"""
nutrition_extractor.py

Deterministic local nutrition estimator with compatible response shape.

Routes (server.py mounts blueprint at /api):
 - GET  /api/health
 - POST /api/analyze-nutrition   body: { "description": "..."} or { "imageBase64": "data:...,..." }
 - POST /api/enhance-nutrition   body: { "nutritionId": "...", "enhancementType": "...", ... }

Compatibility notes:
 - Response includes: success, message, fallback, nutrition, data (data === nutrition)
 - nutrition contains both totalCalories and calories keys to satisfy various frontends.
"""
import re
import io
import json
import uuid
import base64
import traceback
from typing import Optional, List, Dict, Any
from flask import Blueprint, request, jsonify

# optional PIL usage for image dimension heuristics
try:
    from PIL import Image
    PIL_AVAILABLE = True
except Exception:
    PIL_AVAILABLE = False

bp = Blueprint("nutrition_extractor", __name__)

# Small lookup DB for deterministic estimation
FOOD_DB = {
    "chicken breast": {"per_100g": {"calories": 165, "protein": 31, "carbs": 0, "fat": 3.6}},
    "salmon": {"per_100g": {"calories": 208, "protein": 20, "carbs": 0, "fat": 13}},
    "egg": {"per_piece": {"calories": 78, "protein": 6.3, "carbs": 0.6, "fat": 5.3}, "default_grams": 50},
    "rice": {"per_100g": {"calories": 130, "protein": 2.4, "carbs": 28.0, "fat": 0.3}},
    "brown rice": {"per_100g": {"calories": 111, "protein": 2.6, "carbs": 23.0, "fat": 0.9}},
    "tofu": {"per_100g": {"calories": 76, "protein": 8.0, "carbs": 1.9, "fat": 4.8}},
    "lentils": {"per_100g": {"calories": 116, "protein": 9.0, "carbs": 20.0, "fat": 0.4}},
    "mixed vegetables": {"per_100g": {"calories": 40, "protein": 2.0, "carbs": 7.0, "fat": 0.3}},
    "oats": {"per_100g": {"calories": 389, "protein": 17.0, "carbs": 66.0, "fat": 7.0}},
    "banana": {"per_piece": {"calories": 105, "protein": 1.3, "carbs": 27.0, "fat": 0.3}},
    "potato": {"per_100g": {"calories": 77, "protein": 2.0, "carbs": 17.0, "fat": 0.1}},
    "yogurt": {"per_100g": {"calories": 59, "protein": 10.0, "carbs": 3.6, "fat": 0.4}},
    "bread": {"per_slice": {"calories": 80, "protein": 3.0, "carbs": 14.0, "fat": 1.0}},
    "nuts": {"per_100g": {"calories": 607, "protein": 20.0, "carbs": 21.0, "fat": 54.0}},
    "beef": {"per_100g": {"calories": 250, "protein": 26.0, "carbs": 0, "fat": 15.0}},
    "pasta": {"per_100g": {"calories": 131, "protein": 5.0, "carbs": 25.0, "fat": 1.1}},
    "apple": {"per_piece": {"calories": 95, "protein": 0.5, "carbs": 25.0, "fat": 0.3}},
}

SYNONYMS = {
    "chicken": ["chicken", "chicken breast", "chicken breasts"],
    "rice": ["rice", "white rice", "brown rice"],
    "veg": ["veg", "veggies", "vegetable", "vegetables", "mixed vegetables"],
    "egg": ["egg", "eggs"],
}

UNIT_TO_GRAMS = {
    "g": 1.0, "gram": 1.0, "grams": 1.0,
    "kg": 1000.0, "kilogram": 1000.0,
    "cup": 160.0, "cups": 160.0,
    "tbsp": 15.0, "tablespoon": 15.0,
    "tsp": 5.0, "slice": 30.0, "piece": None
}

NUTRITION_STORE: Dict[str, Dict[str, Any]] = {}

# --- parsing & estimating helpers ---

def identify_food_key(name: str) -> Optional[str]:
    n = name.lower().strip()
    if n in FOOD_DB:
        return n
    for k in FOOD_DB.keys():
        if n == k or n in k or k in n:
            return k
    for canon, syns in SYNONYMS.items():
        if n in syns:
            for k in FOOD_DB.keys():
                if canon in k:
                    return k
    return None

def find_food_matches(description: str) -> List[Dict[str, Any]]:
    desc = description.lower()
    matches = []
    pattern = r"(\d+(?:[.,]\d+)?)\s*(g|grams|gram|kg|cup|cups|tbsp|tablespoon|tsp|slice|slices|piece|pieces|oz|ounce|ounces)?\s*(of\s+)?([a-zA-Z\s]+?)(?:$|,|\band\b|\.)"
    for m in re.finditer(pattern, desc):
        num_s = m.group(1)
        unit = (m.group(2) or "").strip()
        raw_food = m.group(4).strip()
        try:
            num = float(num_s.replace(",", "."))
        except Exception:
            continue
        food_key = identify_food_key(raw_food)
        quantity_g = None
        count = None
        if unit in ("g", "gram", "grams"):
            quantity_g = num
        elif unit in ("kg", "kilogram"):
            quantity_g = num * 1000.0
        elif unit in ("cup", "cups"):
            quantity_g = num * UNIT_TO_GRAMS["cup"]
        elif unit in ("tbsp", "tablespoon"):
            quantity_g = num * UNIT_TO_GRAMS["tbsp"]
        elif unit in ("tsp",):
            quantity_g = num * UNIT_TO_GRAMS["tsp"]
        elif unit in ("oz", "ounce", "ounces"):
            quantity_g = num * 28.35
        elif unit in ("slice", "slices", "piece", "pieces"):
            count = int(num)
        else:
            if num.is_integer():
                count = int(num)
            else:
                quantity_g = num
        if food_key:
            matches.append({"food_key": food_key, "raw": raw_food, "quantity_g": quantity_g, "count": count})
    # append words present without quantities
    for k in FOOD_DB.keys():
        if k in desc and not any(m["food_key"] == k for m in matches):
            matches.append({"food_key": k, "raw": k, "quantity_g": None, "count": None})
    for group in SYNONYMS.values():
        for syn in group:
            if syn in desc:
                fk = identify_food_key(syn)
                if fk and not any(m["food_key"] == fk for m in matches):
                    matches.append({"food_key": fk, "raw": syn, "quantity_g": None, "count": None})
    return matches

def estimate_item(item: Dict[str, Any]) -> Dict[str, Any]:
    key = item["food_key"]
    db = FOOD_DB.get(key, {})
    qty_g = item.get("quantity_g")
    count = item.get("count")
    calories = protein = carbs = fat = 0.0
    qty_desc = ""
    if count and "per_piece" in db:
        piece = db["per_piece"]
        calories = piece["calories"] * count
        protein = piece["protein"] * count
        carbs = piece.get("carbs", 0) * count
        fat = piece.get("fat", 0) * count
        qty_desc = f"{count} piece(s)"
    elif qty_g and "per_100g" in db:
        factor = qty_g / 100.0
        base = db["per_100g"]
        calories = base["calories"] * factor
        protein = base["protein"] * factor
        carbs = base["carbs"] * factor
        fat = base["fat"] * factor
        qty_desc = f"{int(qty_g)} g"
    elif count and "per_100g" in db and db.get("default_grams"):
        grams = db.get("default_grams") * count
        factor = grams / 100.0
        base = db["per_100g"]
        calories = base["calories"] * factor
        protein = base["protein"] * factor
        carbs = base["carbs"] * factor
        fat = base["fat"] * factor
        qty_desc = f"{count} serving(s) (~{int(grams)} g)"
    elif "per_100g" in db:
        base = db["per_100g"]
        calories = base["calories"]
        protein = base["protein"]
        carbs = base["carbs"]
        fat = base["fat"]
        qty_desc = "100 g (assumed)"
    elif "per_piece" in db:
        piece = db["per_piece"]
        calories = piece["calories"]
        protein = piece["protein"]
        carbs = piece.get("carbs", 0)
        fat = piece.get("fat", 0)
        qty_desc = "1 piece (assumed)"
    else:
        calories = 100; protein = 5; carbs = 10; fat = 5; qty_desc = "assumed"
    return {
        "id": str(uuid.uuid4()),
        "name": key,
        "quantity": qty_desc,
        "calories": round(float(calories), 1),
        "protein": round(float(protein), 1),
        "carbs": round(float(carbs), 1),
        "fats": round(float(fat), 1)
    }

def aggregate(identified: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_cal = sum(i["calories"] for i in identified)
    total_protein = sum(i["protein"] for i in identified)
    total_carbs = sum(i["carbs"] for i in identified)
    total_fats = sum(i["fats"] for i in identified)
    prot_cals = total_protein * 4.0
    carb_cals = total_carbs * 4.0
    fat_cals = total_fats * 9.0
    sum_macros = max(1.0, prot_cals + carb_cals + fat_cals)
    protein_pct = round((prot_cals / sum_macros) * 100, 1)
    carbs_pct = round((carb_cals / sum_macros) * 100, 1)
    fats_pct = round((fat_cals / sum_macros) * 100, 1)
    macros = {
        "protein": {"value": round(total_protein, 1), "percentage": protein_pct},
        "carbs": {"value": round(total_carbs, 1), "percentage": carbs_pct},
        "fats": {"value": round(total_fats, 1), "percentage": fats_pct}
    }
    # simple micronutrients heuristics
    names = " ".join([i["name"] for i in identified]).lower()
    micronutrients = []
    if any(w in names for w in ["banana", "apple", "vegetable", "veg", "spinach"]):
        micronutrients.append({"name": "Vitamin C", "value": "20-60mg", "daily": "20-60%"})
        micronutrients.append({"name": "Fiber", "value": "3-8g", "daily": "10-30%"})
    if "yogurt" in names or "cheese" in names:
        micronutrients.append({"name": "Calcium", "value": "100-250mg", "daily": "10-25%"})
    if not micronutrients:
        micronutrients.append({"name": "Iron", "value": "1-3mg", "daily": "5-15%"})
    suggestions = []
    if total_cal > 800:
        suggestions.append({"id": 1, "type": "reduce", "title": "Reduce portion", "description": "Consider smaller portions", "impact": "Lower calories", "icon": "🍽️"})
    if fats_pct > 35:
        suggestions.append({"id": 2, "type": "reduce", "title": "Lower fats", "description": "Choose leaner options", "impact": "Better heart health", "icon": "🫒"})
    if protein_pct < 15:
        suggestions.append({"id": 3, "type": "add", "title": "Add protein", "description": "Include lean protein or legumes", "impact": "Satiety & muscle", "icon": "🍗"})
    if not suggestions:
        suggestions.append({"id": 10, "type": "balance", "title": "Balanced meal", "description": "Looks reasonably balanced", "impact": "Maintain", "icon": "✅"})
    return {
        "id": str(uuid.uuid4()),
        "description": "Estimated from input",
        "totalCalories": int(round(total_cal)),
        "calories": int(round(total_cal)),   # compatibility alias
        "macros": macros,
        "micronutrients": micronutrients,
        "identifiedIngredients": identified,
        "suggestions": suggestions,
        "confidence": "low",
        "analysisTime": "local_estimate"
    }

def deterministic_image_estimate(width: int, height: int) -> Dict[str, Any]:
    area = max(1, width * height)
    scaled = 400 + (area % 300)
    identified = [
        {"id": str(uuid.uuid4()), "name": "Protein (est.)", "quantity": "120g", "calories": round(scaled * 0.45, 1), "protein": round((scaled * 0.45) / 4.0, 1), "carbs": 0.0, "fats": round((scaled * 0.45) / 9.0, 1)},
        {"id": str(uuid.uuid4()), "name": "Carb (est.)", "quantity": "150g", "calories": round(scaled * 0.35, 1), "protein": 2.0, "carbs": round((scaled * 0.35) / 4.0, 1), "fats": round((scaled * 0.35) / 9.0, 1)},
    ]
    return aggregate(identified)

# --- endpoints (server mounts blueprint at /api) ---

@bp.route("/health", methods=["GET"])
def health():
    return jsonify({"success": True, "message": "nutrition-extractor ready", "model": "local-estimator"}), 200

@bp.route("/analyze-nutrition", methods=["POST"])
def analyze_nutrition():
    try:
        data = request.get_json(force=True, silent=True) or {}
        if not data:
            fallback = get_default()
            # include both keys for compatibility
            return jsonify({"success": False, "message": "No JSON provided", "fallback": True, "nutrition": fallback, "data": fallback}), 400

        nutrition_result = None
        if "description" in data:
            desc = (data.get("description") or "").strip()
            if not desc:
                fallback = get_default()
                return jsonify({"success": False, "message": "Description empty", "fallback": True, "nutrition": fallback, "data": fallback}), 400
            matches = find_food_matches(desc)
            if matches:
                identified = []
                for it in matches:
                    try:
                        identified.append(estimate_item(it))
                    except Exception:
                        continue
                if identified:
                    nutrition_result = aggregate(identified)
                    nutrition_result["confidence"] = "medium"
                else:
                    nutrition_result = heuristic_free_text(desc)
                    nutrition_result["confidence"] = "low"
            else:
                nutrition_result = heuristic_free_text(desc)
                nutrition_result["confidence"] = "low"
            nutrition_result["inputType"] = "text"

        elif "imageBase64" in data:
            img_b64 = data.get("imageBase64", "")
            if "," in img_b64:
                img_b64 = img_b64.split(",", 1)[1]
            if not img_b64 or len(img_b64) < 50:
                fallback = get_default()
                return jsonify({"success": False, "message": "Invalid image data", "fallback": True, "nutrition": fallback, "data": fallback}), 400
            width = 400; height = 300
            if PIL_AVAILABLE:
                try:
                    raw = base64.b64decode(img_b64)
                    im = Image.open(io.BytesIO(raw))
                    width, height = im.size
                except Exception:
                    width, height = 400, 300
            nutrition_result = deterministic_image_estimate(width, height)
            nutrition_result["inputType"] = "image"
            nutrition_result["confidence"] = "low"

        else:
            fallback = get_default()
            return jsonify({"success": False, "message": "Provide 'description' or 'imageBase64'", "fallback": True, "nutrition": fallback, "data": fallback}), 400

        # store and return both 'nutrition' and 'data' keys
        nutrition_result["id"] = nutrition_result.get("id", str(uuid.uuid4()))
        NUTRITION_STORE[nutrition_result["id"]] = nutrition_result
        return jsonify({"success": True, "message": "Analysis complete", "fallback": False, "nutrition": nutrition_result, "data": nutrition_result}), 200

    except Exception as e:
        traceback.print_exc()
        fallback = get_default()
        NUTRITION_STORE[fallback["id"]] = fallback
        return jsonify({"success": False, "message": f"Internal error: {e}", "fallback": True, "nutrition": fallback, "data": fallback}), 500

@bp.route("/enhance-nutrition", methods=["POST"])
def enhance_nutrition():
    try:
        d = request.get_json(force=True, silent=True) or {}
        nid = d.get("nutritionId"); etype = d.get("enhancementType")
        if not nid or not etype:
            return jsonify({"success": False, "message": "Missing nutritionId or enhancementType"}), 400
        original = NUTRITION_STORE.get(nid)
        if not original:
            return jsonify({"success": False, "message": "Nutrition analysis not found"}), 404
        return jsonify({"success": True, "message": "Enhancement requires AI in this demo — returning original", "enhanced": False, "data": original, "nutrition": original}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Internal error: {e}"}), 500

@bp.route("/models", methods=["GET"])
def models():
    return jsonify({"success": True, "models": {"local": True}}), 200

@bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Nutrition Analyzer (local)", "endpoints": {"analyze": "/analyze-nutrition", "enhance": "/enhance-nutrition", "health": "/health"}}), 200

# helper fallback & heuristic functions

def get_default() -> Dict[str, Any]:
    obj = {
        "id": str(uuid.uuid4()),
        "description": "Mixed meal (deterministic fallback)",
        "totalCalories": 520,
        "calories": 520,
        "macros": {"protein": {"value": 28, "percentage": 22}, "carbs": {"value": 45, "percentage": 35}, "fats": {"value": 25, "percentage": 43}},
        "identifiedIngredients": [
            {"id": 1, "name": "Chicken Breast", "quantity": "150g", "calories": 247.5, "protein": 46.5, "carbs": 0, "fats": 5.4},
            {"id": 2, "name": "Brown Rice", "quantity": "100g", "calories": 111, "protein": 2.6, "carbs": 23.0, "fats": 0.9}
        ],
        "suggestions": [{"id": 1, "type": "balance", "title": "Balanced meal", "description": "Reduce oils to lower calories", "icon": "✅"}],
        "confidence": "low",
        "analysisTime": "fallback"
    }
    return obj

def heuristic_free_text(text: str) -> Dict[str, Any]:
    t = text.lower()
    items = []
    if any(w in t for w in ["chicken", "breast"]):
        items.append({"food_key": "chicken breast", "quantity_g": 150, "count": None})
    if any(w in t for w in ["rice", "biryani", "pulao", "pilaf", "fried rice"]):
        items.append({"food_key": "rice", "quantity_g": 150, "count": None})
    if any(w in t for w in ["egg", "eggs"]):
        items.append({"food_key": "egg", "quantity_g": None, "count": 2})
    if any(w in t for w in ["salad", "vegetable", "veg", "veggies"]):
        items.append({"food_key": "mixed vegetables", "quantity_g": 100, "count": None})
    if not items:
        return get_default()
    identified = [estimate_item(it) for it in items]
    return aggregate(identified)

# alias expected by server.py
nutrition_bp = bp

def init_app(app):
    print("[nutrition_extractor] ✅ deterministic nutrition extractor initialized")
