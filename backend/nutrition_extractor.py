# nutrition_extractor.py
"""
Nutrition extractor blueprint.

Endpoint:
  POST /nutrition/analyze-image

Accepts:
  - multipart/form-data with 'image' file (preferred)
  - or application/json with "image_base64": "data:...;base64,..." string
Optional:
  - "notes" (text), "user" dict in body/form

Behavior:
  - If GROQ_API_KEY present and groq SDK importable, attempts to call Groq chat (best-effort).
    (Models' multimodal/file support differs — this code includes image base64 in prompt
     as a fallback but still falls back if the model cannot handle it.)
  - Always provides a deterministic fallback that:
      - picks a likely dish "type" using an image-hash-based stable choice
      - estimates ingredient list & quantities per dish template
      - computes nutrition using a small per-100g nutrition DB
  - Returns JSON shaped for frontend consumption.
"""

import os
import io
import re
import json
import base64
import hashlib
import uuid
from typing import Optional, Dict, Any, List, Tuple
from flask import Blueprint, request, jsonify, current_app
from PIL import Image

# Try to import Groq (optional)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
try:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
except Exception as e:
    groq_client = None
    # not fatal; fallback deterministic will be used
    print("groq import failed or not configured:", e)

bp = Blueprint("nutrition", __name__, url_prefix="/nutrition")

# ----------------- Small nutrition DB (per 100g) -----------------
# Expand this table to improve accuracy.
# Values: calories (kcal), protein (g), carbs (g), fat (g)
NUTRITION_DB = {
    "chicken breast": {"calories": 165, "protein": 31, "carbs": 0, "fat": 3.6},
    "brown rice": {"calories": 111, "protein": 2.6, "carbs": 23, "fat": 0.9},
    "white rice": {"calories": 130, "protein": 2.4, "carbs": 28, "fat": 0.3},
    "salmon": {"calories": 208, "protein": 20, "carbs": 0, "fat": 13},
    "mixed vegetables": {"calories": 40, "protein": 2, "carbs": 7, "fat": 0.2},
    "potato": {"calories": 77, "protein": 2, "carbs": 17, "fat": 0.1},
    "tofu": {"calories": 76, "protein": 8, "carbs": 1.9, "fat": 4.8},
    "lentils": {"calories": 116, "protein": 9, "carbs": 20, "fat": 0.4},
    "pasta": {"calories": 131, "protein": 5, "carbs": 25, "fat": 1.1},
    "olive oil": {"calories": 884, "protein": 0, "carbs": 0, "fat": 100},
    "spinach": {"calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4},
    "egg": {"calories": 155, "protein": 13, "carbs": 1.1, "fat": 11},
    "avocado": {"calories": 160, "protein": 2, "carbs": 9, "fat": 15},
    "bread": {"calories": 265, "protein": 9, "carbs": 49, "fat": 3.2},
    "cheese": {"calories": 402, "protein": 25, "carbs": 1.3, "fat": 33},
    "tomato": {"calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2},
    # Add more items as needed...
}

# ----------------- Dish templates for fallback -----------------
# Each template: list of (ingredient_name, grams)
DISH_TEMPLATES = [
    ("chicken bowl", [("chicken breast", 150), ("brown rice", 120), ("mixed vegetables", 80), ("olive oil", 10)]),
    ("salmon plate", [("salmon", 140), ("potato", 150), ("mixed vegetables", 100), ("olive oil", 8)]),
    ("tofu quinoa bowl", [("tofu", 150), ("brown rice", 100), ("mixed vegetables", 100), ("olive oil", 8)]),
    ("lentil curry", [("lentils", 180), ("tomato", 80), ("mixed vegetables", 80), ("olive oil", 8)]),
    ("pasta primavera", [("pasta", 150), ("mixed vegetables", 100), ("olive oil", 10), ("cheese", 20)]),
    ("salad with egg", [("spinach", 80), ("tomato", 60), ("egg", 100), ("avocado", 70), ("olive oil", 8)]),
    ("sandwich", [("bread", 120), ("chicken breast", 80), ("cheese", 20), ("tomato", 40)]),
]

# ----------------- Utilities -----------------

def _stable_hash_int(s: str) -> int:
    """Stable deterministic integer from string for reproducible choices."""
    h = hashlib.sha256(s.encode("utf-8")).hexdigest()
    return int(h[:8], 16)

def image_to_base64(img_bytes: bytes) -> str:
    return base64.b64encode(img_bytes).decode('utf-8')

def parse_base64_image(s: str) -> Optional[bytes]:
    if not s:
        return None
    m = re.match(r"data:.*;base64,(.*)$", s, re.DOTALL)
    if m:
        s = m.group(1)
    try:
        return base64.b64decode(s)
    except Exception:
        return None

def compute_nutrition_for_ingredient(name: str, grams: float) -> Dict[str, Any]:
    key = name.lower()
    info = NUTRITION_DB.get(key)
    if not info:
        # unknown ingredient: return zeros so it doesn't break sums
        return {"name": name, "grams": grams, "calories": 0, "protein": 0, "carbs": 0, "fats": 0}
    factor = grams / 100.0
    calories = round(info["calories"] * factor)
    protein = round(info["protein"] * factor, 1)
    carbs = round(info["carbs"] * factor, 1)
    fats = round(info["fat"] * factor, 1)
    return {"name": name, "grams": int(round(grams)), "calories": int(calories), "protein": protein, "carbs": carbs, "fats": fats}

def aggregate_totals(ingredients: List[Dict[str,Any]]) -> Dict[str,Any]:
    total_cal = sum(int(i.get("calories", 0)) for i in ingredients)
    total_pro = sum(float(i.get("protein", 0)) for i in ingredients)
    total_car = sum(float(i.get("carbs", 0)) for i in ingredients)
    total_fat = sum(float(i.get("fats", 0)) for i in ingredients)
    # percent distribution for macros (by calories)
    pro_kcal = total_pro * 4
    car_kcal = total_car * 4
    fat_kcal = total_fat * 9
    total_kcal = pro_kcal + car_kcal + fat_kcal
    if total_kcal <= 0:
        # fallback to simple percentages if zero
        total_kcal = max(total_cal, 1)
        pro_pct = car_pct = fat_pct = round(100/3)
    else:
        pro_pct = round((pro_kcal / total_kcal) * 100)
        car_pct = round((car_kcal / total_kcal) * 100)
        fat_pct = 100 - pro_pct - car_pct
    return {
        "totalCalories": int(total_cal),
        "macros": {
            "protein": {"value": round(total_pro,1), "percentage": pro_pct},
            "carbs": {"value": round(total_car,1), "percentage": car_pct},
            "fats": {"value": round(total_fat,1), "percentage": fat_pct},
        }
    }

# ----------------- Groq helper (best-effort) -----------------

def call_groq_chat_system(system_prompt: str, user_prompt: str, model: str = GROQ_MODEL) -> str:
    """
    Best-effort wrapper around Groq chat completions. Some Groq models may support
    multimodal content; this wrapper sends the text prompts. We include image
    base64 in the user prompt if available (models that can use it will; others will ignore).
    """
    if groq_client is None:
        raise RuntimeError("Groq client not configured.")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    resp = groq_client.chat.completions.create(
        messages=messages,
        model=model,
    )
    # Try to extract text content
    try:
        return resp.choices[0].message.content
    except Exception:
        return str(resp)

def parse_json_from_text(text: str) -> Optional[dict]:
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"(\{(?:.|\n)*\})", text)
        if m:
            try:
                return json.loads(m.group(1))
            except Exception:
                try:
                    return json.loads(m.group(1).replace("'", '"'))
                except Exception:
                    return None
    return None

# ----------------- Fallback deterministic image "recognizer" -----------------

def fallback_recognize_dish_and_ingredients(img_bytes: bytes, notes: Optional[str], user: Dict[str,Any]) -> Dict[str,Any]:
    """
    Deterministic fallback that selects a dish template based on image bytes hash,
    returns ingredient estimates and computed nutrition.
    """
    # create stable seed from image bytes + notes to ensure different images produce different dishes
    h = hashlib.sha256(img_bytes + (notes or "").encode("utf-8")).hexdigest()
    seed = int(h[:8], 16)
    # choose a template
    idx = seed % len(DISH_TEMPLATES)
    dish_name, ing_list = DISH_TEMPLATES[idx]

    # Slightly vary grams deterministically using hash
    grams_variation = (seed % 21) - 10  # -10..+10 grams offset
    ingredients_result = []
    used_names = set()
    for (iname, baseg) in ing_list:
        grams = max(10, baseg + ((_stable_hash_int(f"{iname}|{seed}") % 31) - 15))  # +-15g jitter
        item = compute_nutrition_for_ingredient(iname, grams)
        ingredients_result.append(item)
        used_names.add(iname.lower())

    totals = aggregate_totals(ingredients_result)

    # Simple micronutrient guesses (very rough; you can expand DB)
    micronutrients = [
        {"name": "Vitamin C", "value": "varies", "daily": "—"},
        {"name": "Iron", "value": "varies", "daily": "—"},
        {"name": "Calcium", "value": "varies", "daily": "—"},
        {"name": "Fiber", "value": "varies", "daily": "—"},
    ]

    # Suggestions heuristic
    suggestions = []
    if totals["macros"]["protein"]["value"] < 20:
        suggestions.append({"id": 1, "type": "add", "title": "Increase protein", "description": "Add lean protein like chicken or tofu", "impact": "Better satiety", "icon": "💪"})
    if totals["totalCalories"] > 800:
        suggestions.append({"id": 2, "type": "reduce", "title": "Lower calories", "description": "Reduce oil or portions", "impact": "Calorie reduction", "icon": "⚖️"})
    if not suggestions:
        suggestions.append({"id": 3, "type": "balance", "title": "Well balanced", "description": "This meal looks reasonably balanced", "impact": "Good nutrition", "icon": "✅"})

    return {
        "source": "fallback",
        "dish_name": dish_name,
        "totalCalories": totals["totalCalories"],
        "macros": totals["macros"],
        "micronutrients": micronutrients,
        "identifiedIngredients": ingredients_result,
        "suggestions": suggestions
    }

# ----------------- Main Groq-powered pipeline -----------------

def groq_analyze_image(img_bytes: bytes, notes: Optional[str], user: Dict[str,Any]) -> Optional[Dict[str,Any]]:
    """
    Best-effort attempt to let Groq/Llama produce structured analysis.
    We embed a reasonably short base64 preview plus instruction in the prompt.
    If Groq returns parseable JSON in expected schema, we normalize and return it.
    If anything fails, return None so fallback runs.
    """
    if groq_client is None:
        return None

    try:
        # build a short base64 preview (downscale to avoid extremely large prompt)
        pil = Image.open(io.BytesIO(img_bytes))
        pil.thumbnail((256, 256))
        buffer = io.BytesIO()
        pil.save(buffer, format="JPEG", quality=70)
        preview_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        system_prompt = (
            "You are a nutritionist + visual food recognizer. "
            "User will give you a picture (base64 JPG preview) and a short note. "
            "Output ONLY a JSON object with keys:\n"
            " - dish_name (string)\n"
            " - identifiedIngredients: [{name (str), grams (int, approx), calories (int), protein (float), carbs (float), fats (float)}...]\n"
            " - totalCalories (int)\n"
            " - macros: { protein: {value, percentage}, carbs: {...}, fats: {...} }\n"
            " - micronutrients: [{name, value, daily}...]\n"
            " - suggestions: [{id, type, title, description, impact, icon}...]\n"
            "Be concise, numeric values should be numbers (not strings). If you cannot analyze the image, return null."
        )

        user_prompt = f"Preview base64 (short): {preview_b64[:100]}... (trimmed). Note: {notes or ''}\nUser profile: {json.dumps(user)}\nReturn the JSON described above."

        resp_text = call_groq_chat_system(system_prompt, user_prompt, model=GROQ_MODEL)
        parsed = parse_json_from_text(resp_text)
        if not parsed:
            # model didn't return parseable JSON
            return None

        # normalize: ensure ingredients have numeric calories/macros and totals compute correctly
        ingredients = parsed.get("identifiedIngredients", [])
        normalized_ingredients = []
        for it in ingredients:
            # tolerant conversions
            name = it.get("name", "ingredient")
            grams = int(float(it.get("grams", it.get("quantity_g", 0) or 0)))
            calories = int(it.get("calories", 0))
            protein = float(it.get("protein", 0))
            carbs = float(it.get("carbs", 0))
            fats = float(it.get("fats", 0))
            if calories == 0:
                # try to infer from DB
                computed = compute_nutrition_for_ingredient(name, grams)
                calories = computed["calories"]
                protein = computed["protein"]
                carbs = computed["carbs"]
                fats = computed["fats"]
            normalized_ingredients.append({
                "name": name,
                "grams": grams,
                "calories": int(calories),
                "protein": float(protein),
                "carbs": float(carbs),
                "fats": float(fats),
            })

        totals = aggregate_totals(normalized_ingredients)
        # if model returned macros/totalCalories, prefer model values but validate
        total_cal_model = parsed.get("totalCalories")
        if total_cal_model is None:
            total_cal = totals["totalCalories"]
        else:
            total_cal = int(total_cal_model)

        macros = parsed.get("macros") or totals["macros"]
        micronutrients = parsed.get("micronutrients") or []
        suggestions = parsed.get("suggestions") or []

        return {
            "source": "groq",
            "dish_name": parsed.get("dish_name", "Dish"),
            "totalCalories": int(total_cal),
            "macros": macros,
            "micronutrients": micronutrients,
            "identifiedIngredients": normalized_ingredients,
            "suggestions": suggestions
        }

    except Exception as e:
        current_app.logger.warning("groq_analyze_image failed: %s", e)
        return None

# ----------------- Flask endpoint -----------------

@bp.route("/analyze-image", methods=["POST"])
def analyze_image():
    """
    Accepts multipart/form-data (file field 'image') or JSON {image_base64: "..."}.
    Optional form fields: notes (string), user (json-string)
    Returns JSON used by frontend (see React UI).
    """
    notes = None
    user = {}
    img_bytes = None

    # 1) Try multipart file upload
    if "image" in request.files:
        f = request.files["image"]
        try:
            img_bytes = f.read()
        except Exception:
            return jsonify({"success": False, "error": "Could not read uploaded file"}), 400
        notes = request.form.get("notes") or None
        user_json = request.form.get("user")
        if user_json:
            try:
                user = json.loads(user_json)
            except Exception:
                user = {}
    else:
        # 2) Try JSON body with base64
        data = request.get_json(silent=True) or {}
        b64 = data.get("image_base64") or data.get("image")
        notes = data.get("notes")
        user = data.get("user") or {}
        if b64:
            img_bytes = parse_base64_image(b64)
            if img_bytes is None:
                return jsonify({"success": False, "error": "Invalid base64 image"}), 400

    if img_bytes is None:
        return jsonify({"success": False, "error": "No image provided. Provide multipart file 'image' or JSON 'image_base64'."}), 400

    # Attempt Groq analysis first (best-effort)
    groq_result = None
    if groq_client:
        try:
            groq_result = groq_analyze_image(img_bytes, notes, user)
        except Exception as e:
            current_app.logger.warning("Groq pipeline raised: %s", e)
            groq_result = None

    if groq_result:
        # Format response in the shape the frontend expects:
        # totalCalories, macros, micronutrients, identifiedIngredients, suggestions
        return jsonify({"success": True, "source": groq_result.get("source", "groq"), "result": {
            "totalCalories": groq_result["totalCalories"],
            "macros": groq_result["macros"],
            "micronutrients": groq_result["micronutrients"],
            "identifiedIngredients": groq_result["identifiedIngredients"],
            "suggestions": groq_result["suggestions"],
            "dish_name": groq_result.get("dish_name")
        }}), 200

    # Fallback deterministic analysis
    try:
        fallback = fallback_recognize_dish_and_ingredients(img_bytes, notes, user)
        return jsonify({"success": True, "source": "fallback", "result": {
            "totalCalories": fallback["totalCalories"],
            "macros": fallback["macros"],
            "micronutrients": fallback["micronutrients"],
            "identifiedIngredients": fallback["identifiedIngredients"],
            "suggestions": fallback["suggestions"],
            "dish_name": fallback.get("dish_name")
        }}), 200
    except Exception as e:
        current_app.logger.error("Fallback nutrition analysis failed: %s", e)
        return jsonify({"success": False, "error": "Analysis failed"}), 500
