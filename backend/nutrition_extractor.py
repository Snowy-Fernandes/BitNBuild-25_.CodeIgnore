# nutrition_extractor.py
import os
import io
import json
import base64
import uuid
import re
from typing import Dict, Any, List, Optional
from flask import Blueprint, request, jsonify, current_app
from PIL import Image, ImageStat

# Optional Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        groq_client = None
        print("groq import failed:", e)
else:
    groq_client = None

bp = Blueprint("nutrition", __name__, url_prefix="/nutrition")

# ---------- Small local nutrition DB (per 100g) - approximate ----------
# Add or tune entries as you wish.
NUTRI_DB = {
    "chicken breast": {"calories":165, "protein_g":31, "carbs_g":0,   "fat_g":3.6},
    "brown rice":      {"calories":111, "protein_g":2.6,"carbs_g":23,  "fat_g":0.9},
    "white rice":      {"calories":130, "protein_g":2.4,"carbs_g":28,  "fat_g":0.2},
    "mixed vegetables":{"calories":65,  "protein_g":3.0,"carbs_g":12,  "fat_g":0.5},
    "lettuce":         {"calories":15,  "protein_g":1.4,"carbs_g":2.9, "fat_g":0.2},
    "tomato":          {"calories":18,  "protein_g":0.9,"carbs_g":3.9, "fat_g":0.2},
    "egg":             {"calories":155, "protein_g":13, "carbs_g":1.1, "fat_g":11},
    "tofu":            {"calories":76,  "protein_g":8.0,"carbs_g":1.9, "fat_g":4.8},
    "salmon":          {"calories":208, "protein_g":20, "carbs_g":0,   "fat_g":13},
    "potato":          {"calories":77,  "protein_g":2.0,"carbs_g":17,  "fat_g":0.1},
    "lentils":         {"calories":116, "protein_g":9.0,"carbs_g":20,  "fat_g":0.4},
    "avocado":         {"calories":160, "protein_g":2.0,"carbs_g":9.0, "fat_g":15},
    # ... add more as you need
}

# ---------- Utilities ----------

def parse_json_from_text(text: str) -> Optional[dict]:
    """Attempt to extract a JSON object from a text block (model output)."""
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        # Greedy search for the first {...}
        m = re.search(r"(\{(?:.|\n)*\})", text)
        if m:
            candidate = m.group(1)
            try:
                return json.loads(candidate)
            except Exception:
                try:
                    return json.loads(candidate.replace("'", '"'))
                except Exception:
                    return None
    return None

def parse_calories_value(val) -> int:
    """Normalize calorie-like values to integer."""
    if val is None:
        return 0
    if isinstance(val, (int, float)):
        return int(round(val))
    s = str(val)
    m = re.search(r"(-?\d+)", s.replace(",", ""))
    if m:
        try:
            return int(m.group(1))
        except Exception:
            return 0
    return 0

def safe_get(d, k, default=None):
    return d.get(k, default) if isinstance(d, dict) else default

# ---------- A small local image heuristic pipeline (fallback) ----------

def image_dominant_channel_stats(img: Image.Image) -> Dict[str, float]:
    """
    Returns simple brightness and channel-dominance metrics used for naive heuristics.
    """
    img_small = img.resize((100,100)).convert("RGB")
    stat = ImageStat.Stat(img_small)
    r_mean, g_mean, b_mean = stat.mean
    brightness = sum(stat.mean)/3.0
    return {"r": r_mean, "g": g_mean, "b": b_mean, "brightness": brightness}

def naive_infer_ingredients_from_image(img: Image.Image, prompt: str = "") -> List[Dict[str, Any]]:
    """
    Very simple heuristic: inspect dominant colors and prompt keywords to pick likely ingredients.
    This is a fallback when no Groq/vision model is available.
    Returns list of dicts: {name, quantity_g}
    """
    stats = image_dominant_channel_stats(img)
    ingredients = []
    # Use prompt keywords first (if provided)
    p = (prompt or "").lower()
    # heuristics on prompt
    if "salad" in p or "leaf" in p or "greens" in p:
        ingredients += [("lettuce", 80), ("tomato", 50), ("mixed vegetables", 70)]
    if "rice" in p or "biryani" in p or "fried rice" in p:
        ingredients += [("brown rice", 150), ("mixed vegetables", 80)]
    if "chicken" in p:
        ingredients = [("chicken breast", 150)] + ingredients
    if "vegetarian" in p or "veg" in p:
        # prefer plant items
        ingredients = [it for it in ingredients if it[0] != "chicken breast"]
        if not ingredients:
            ingredients = [("tofu", 120), ("mixed vegetables", 100)]
    # If no strong prompt, infer from colors
    if not ingredients:
        # green dominant -> salad/veg
        if stats["g"] > stats["r"] and stats["g"] > stats["b"] and stats["brightness"] > 40:
            ingredients = [("lettuce", 100), ("tomato", 60), ("mixed vegetables", 80)]
        # brownish/darker -> meat or rice
        elif stats["r"] > stats["g"] and stats["r"] > stats["b"]:
            ingredients = [("chicken breast", 140), ("brown rice", 120)]
        else:
            ingredients = [("mixed vegetables", 100), ("brown rice", 100)]
    # normalize to dicts, dedupe
    out = {}
    for name, qty in ingredients:
        if name in out:
            out[name] += qty
        else:
            out[name] = qty
    return [{"name": n, "quantity_g": int(q)} for n,q in out.items()]

def compute_nutrition_from_ingredients(ingredients: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Given identified ingredients with 'name' and 'quantity_g', compute totals using NUTRI_DB.
    Returns identifiedIngredients list with numeric calories/macros per ingredient and totals dict.
    """
    identified = []
    totals = {"calories": 0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0}
    for ing in ingredients:
        name = ing.get("name", "").lower()
        qty = int(ing.get("quantity_g", 100))
        db = NUTRI_DB.get(name)
        if db:
            factor = qty / 100.0
            cals = int(round(db["calories"] * factor))
            prot = round(db["protein_g"] * factor, 1)
            carbs = round(db["carbs_g"] * factor, 1)
            fats = round(db["fat_g"] * factor, 1)
        else:
            # unknown ingredient - assume 100 kcal / 100g split
            cals = int(round(100 * qty / 100.0))
            prot = round(4.0 * qty / 100.0, 1)
            carbs = round(16.0 * qty / 100.0, 1)
            fats = round(4.0 * qty / 100.0, 1)
        identified.append({
            "id": str(uuid.uuid4()),
            "name": name.title(),
            "quantity": f"{qty}g",
            "calories": int(cals),
            "protein": prot,
            "carbs": carbs,
            "fats": fats
        })
        totals["calories"] += cals
        totals["protein_g"] += prot
        totals["carbs_g"] += carbs
        totals["fat_g"] += fats
    totals = {k: (int(v) if k=="calories" else round(v,1)) for k,v in totals.items()}
    return {"identifiedIngredients": identified, "totals": totals}

# ---------- Groq (LLama) helper ----------

def groq_analyze_image_base64(b64: str, prompt: str, user: dict) -> Optional[Dict[str,Any]]:
    """
    Attempt to call Groq Chat API by embedding the base64 into the user prompt.
    The model is instructed to output only JSON of a precise schema.
    This may or may not be supported by your Groq model — treat as optional helper.
    """
    if groq_client is None:
        return None

    # Be explicit about the schema so parsing is easier
    system = (
        "You are an advanced multimodal nutritionist and visual food analyst. "
        "You will be given an IMAGE in base64 form and some optional user info. "
        "Output ONLY valid JSON with the following schema:\n"
        "{\n"
        "  \"dish_name\": string,\n"
        "  \"identified_ingredients\": [\n"
        "     {\"name\": string, \"quantity_g\": number, \"calories\": number, \"protein_g\": number, \"carbs_g\": number, \"fat_g\": number}\n"
        "  ],\n"
        "  \"micronutrients\": [{\"name\": string, \"value\": string, \"daily\": string}],\n"
        "  \"suggestions\": [{\"type\":\"reduce|add|balance\",\"title\":string,\"description\":string,\"impact\":string}],\n"
        "  \"notes\": string\n"
        "}\n"
        "Be concise and use reasonable estimates if exact data is unknown. Use metric (grams)."
    )

    # Put the base64 inline. If very large this can be slow or fail — but many groq/llama clients accept it.
    user_msg = (
        f"IMAGE_BASE64_START\n{b64}\nIMAGE_BASE64_END\n\n"
        f"User prompt: {prompt}\nUser profile: {json.dumps(user)}\n\n"
        "Analyze the image, identify the dish, list ingredients with approximate quantities in grams and estimated calories/macros per ingredient. Return only the JSON described above."
    )

    try:
        resp = groq_client.chat.completions.create(
            messages=[{"role":"system","content":system},{"role":"user","content":user_msg}],
            model=GROQ_MODEL,
            temperature=0.0,
            max_tokens=800
        )
        text = ""
        try:
            text = resp.choices[0].message.content
        except Exception:
            text = str(resp)
        parsed = parse_json_from_text(text)
        return parsed
    except Exception as e:
        # don't fail hard — return None so fallback is used
        current_app.logger and current_app.logger.warning(f"Groq analyze failed: {e}")
        return None

# ---------- Blueprint endpoint ----------

@bp.route("/analyze", methods=["POST"])
def analyze():
    """
    POST /nutrition/analyze
    multipart/form-data:
      - image: file
      - prompt: optional text field (preferences / hints)
      - user: optional JSON string
    Response: JSON containing nutrition summary matching your RN UI.
    """
    # Accept both multipart (image) and JSON bodies
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image provided. Upload file field 'image'."}), 400

    imgfile = request.files['image']
    prompt = request.form.get("prompt", "") or request.args.get("prompt", "") or ""
    user_json = request.form.get("user") or request.args.get("user") or None
    user = {}
    if user_json:
        try:
            user = json.loads(user_json)
        except Exception:
            user = {}

    # Read image
    try:
        img_bytes = imgfile.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        return jsonify({"success": False, "error": f"Could not open image: {e}"}), 400

    # Try Groq (if configured)
    groq_out = None
    if groq_client:
        try:
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            groq_out = groq_analyze_image_base64(b64, prompt, user)
        except Exception as e:
            current_app.logger and current_app.logger.warning(f"Groq call exception: {e}")
            groq_out = None

    # If groq provided structured JSON, attempt to use it
    if groq_out:
        try:
            # normalize groq_out to expected UI shape
            dish_name = groq_out.get("dish_name", "Dish")
            ident = []
            for ing in groq_out.get("identified_ingredients", []):
                name = ing.get("name", "Ingredient")
                qty = int(ing.get("quantity_g", ing.get("quantity", 100)))
                cals = parse_calories_value(ing.get("calories", 0))
                prot = float(ing.get("protein_g", ing.get("protein", 0)) or 0)
                carbs = float(ing.get("carbs_g", ing.get("carbs", 0)) or 0)
                fats = float(ing.get("fat_g", ing.get("fat", 0)) or 0)
                ident.append({
                    "id": str(uuid.uuid4()),
                    "name": name,
                    "quantity": f"{qty}g",
                    "calories": int(cals),
                    "protein": round(prot,1),
                    "carbs": round(carbs,1),
                    "fats": round(fats,1)
                })
            totals = {"calories": 0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0}
            for i in ident:
                totals["calories"] += int(i["calories"])
                totals["protein_g"] += float(i["protein"])
                totals["carbs_g"] += float(i["carbs"])
                totals["fat_g"] += float(i["fats"])
            totals = {k: (int(v) if k=="calories" else round(v,1)) for k,v in totals.items()}

            # Micronutrients and suggestions: try to use model outputs or craft simple placeholders
            micronutrients = groq_out.get("micronutrients", [
                {"name":"Vitamin C","value":"--","daily":"--"}
            ])
            suggestions = groq_out.get("suggestions", [])

            # Macro percentages from totals
            protein_kcal = totals["protein_g"] * 4
            fat_kcal = totals["fat_g"] * 9
            carb_kcal = totals["carbs_g"] * 4
            total_kcal_calc = totals["calories"] or int(round(protein_kcal+fat_kcal+carb_kcal))
            macros = {}
            if total_kcal_calc > 0:
                macros = {
                    "protein": {"value": totals["protein_g"], "percentage": int(round((protein_kcal/total_kcal_calc)*100))},
                    "carbs": {"value": totals["carbs_g"], "percentage": int(round((carb_kcal/total_kcal_calc)*100))},
                    "fats": {"value": totals["fat_g"], "percentage": int(round((fat_kcal/total_kcal_calc)*100))}
                }
            else:
                macros = {"protein":{"value":0,"percentage":0},"carbs":{"value":0,"percentage":0},"fats":{"value":0,"percentage":0}}

            resp = {
                "success": True,
                "source": "groq",
                "dish_name": dish_name,
                "totalCalories": int(totals["calories"]),
                "macros": macros,
                "micronutrients": micronutrients,
                "identifiedIngredients": ident,
                "suggestions": suggestions,
                "notes": groq_out.get("notes","")
            }
            return jsonify(resp), 200
        except Exception as e:
            current_app.logger and current_app.logger.warning(f"Groq parsing error: {e}")
            # fall through to deterministic fallback

    # ---- Deterministic fallback ----
    try:
        inferred = naive_infer_ingredients_from_image(img, prompt)
        comp = compute_nutrition_from_ingredients(inferred)

        ident = comp["identifiedIngredients"]
        totals = comp["totals"]

        # Build simple micronutrients and suggestions heuristically
        micronutrients = [
            {"name": "Vitamin C", "value": "20mg", "daily": "22%"},
            {"name": "Iron", "value": "2.5mg", "daily": "14%"},
            {"name": "Calcium", "value": "50mg", "daily": "5%"}
        ]
        suggestions = []
        # Simple rules
        if totals["protein_g"] < 15:
            suggestions.append({"id":1,"type":"add","title":"Add protein","description":"Consider adding a lean protein like chicken or tofu.","impact":"Improve muscle maintenance","icon":"💪"})
        if totals["calories"] > 800:
            suggestions.append({"id":2,"type":"reduce","title":"Reduce portion size","description":"This meal is quite calorie-dense — try smaller portions or lighter sides.","impact":"Better weight control","icon":"🍽️"})
        # Macro percentages
        protein_kcal = totals["protein_g"] * 4
        fat_kcal = totals["fat_g"] * 9
        carb_kcal = totals["carbs_g"] * 4
        total_kcal_calc = totals["calories"] if totals["calories"]>0 else int(round(protein_kcal+fat_kcal+carb_kcal))
        macros = {}
        if total_kcal_calc > 0:
            macros = {
                "protein": {"value": totals["protein_g"], "percentage": int(round((protein_kcal/total_kcal_calc)*100))},
                "carbs": {"value": totals["carbs_g"], "percentage": int(round((carb_kcal/total_kcal_calc)*100))},
                "fats": {"value": totals["fat_g"], "percentage": int(round((fat_kcal/total_kcal_calc)*100))}
            }
        else:
            macros = {"protein":{"value":0,"percentage":0},"carbs":{"value":0,"percentage":0},"fats":{"value":0,"percentage":0}}

        resp = {
            "success": True,
            "source": "deterministic_fallback",
            "dish_name": "Inferred Dish",
            "totalCalories": int(totals["calories"]),
            "macros": macros,
            "micronutrients": micronutrients,
            "identifiedIngredients": ident,
            "suggestions": suggestions,
            "notes": "This result was generated by a local heuristic pipeline (no Groq)."
        }
        return jsonify(resp), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to analyze image: {e}"}), 500
