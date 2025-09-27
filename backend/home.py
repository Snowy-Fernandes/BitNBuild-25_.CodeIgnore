# Placeholder for home dashboard endpoints
# - GET /home/weekly-plan: Get weekly meal plan
# - PUT /home/weekly-plan: Update weekly meal plan
# - GET /home/quick-stats: Get user quick stats and metrics

# home.py
"""
Flask blueprint that generates weekly meal plans and recipes.
Endpoints:
 - GET  /home/health
 - POST /home/generate-plan   { prompt: str, days?: int, meals?: list[str] }
 - GET  /home/recipe/<id>
 - POST /home/enhance         { recipeId: str, enhancementType: str, customInstructions?: str }

Costs are in Indian Rupees (INR). In-memory store (RECIPE_DB).
Optional OpenAI support if OPENAI_API_KEY env var is set.
"""

import os
import uuid
import json
from typing import List, Dict, Any, Optional
from flask import Blueprint, request, jsonify, current_app
from math import ceil

# Optional: OpenAI usage (only if OPENAI_API_KEY provided)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    try:
        import openai
        openai.api_key = OPENAI_API_KEY
    except Exception as e:
        print("OpenAI import failed:", e)
        openai = None
else:
    openai = None

home_bp = Blueprint("home", __name__, url_prefix="/home")

# In-memory DB of recipes (id -> recipe dict)
RECIPE_DB: Dict[str, Dict[str, Any]] = {}

# ---------------- Helpers -----------------
def new_id() -> str:
    return str(uuid.uuid4())

def round2(x: float) -> float:
    return float(f"{x:.2f}")

def estimate_price_inr(name: str) -> float:
    n = (name or "").lower()
    if "tomato" in n: return 10.0
    if "onion" in n: return 8.0
    if "garlic" in n: return 3.0
    if "bell pepper" in n or "capsicum" in n: return 30.0
    if "olive oil" in n or "oil" in n: return 20.0
    if "rice" in n: return 30.0
    if "chicken" in n: return 120.0
    if "egg" in n: return 8.0
    if "paneer" in n: return 80.0
    if "tofu" in n: return 50.0
    if "flour" in n: return 25.0
    if "banana" in n: return 7.0
    if "bread" in n: return 30.0
    if "yogurt" in n: return 25.0
    # fallback
    return 20.0

def estimate_time_for_title(title: str) -> int:
    t = (title or "").lower()
    if any(x in t for x in ["salad","smoothie","toast","bowl"]): return 10
    if any(x in t for x in ["stir-fry","pasta","rice","one-pot"]): return 20
    if any(x in t for x in ["grill","bake"]): return 30
    return 25

def estimate_calories_for_title(title: str) -> int:
    t = (title or "").lower()
    if any(x in t for x in ["salad","smoothie"]): return 300
    if "bowl" in t or "pasta" in t: return 450
    if "fried" in t or "burger" in t: return 600
    return 420

def build_recipe_from_template(title: str, meal_type: str, prompt_hint: str = "") -> Dict[str, Any]:
    """Deterministic generator used when OpenAI not available or as fallback."""
    rid = new_id()
    if meal_type == "breakfast":
        base_ings = [
            {"name": "Rolled oats", "quantity": 50, "unit": "g"},
            {"name": "Milk or water", "quantity": 200, "unit": "ml"},
            {"name": "Banana", "quantity": 1, "unit": "pc"},
            {"name": "Peanut butter", "quantity": 1, "unit": "tbsp"},
        ]
        tags = ["quick", "vegetarian", "cheap"]
    elif meal_type == "lunch":
        base_ings = [
            {"name": "Rice", "quantity": 150, "unit": "g"},
            {"name": "Mixed vegetables", "quantity": 150, "unit": "g"},
            {"name": "Onion", "quantity": 1, "unit": "pc"},
            {"name": "Tomato", "quantity": 1, "unit": "pc"},
            {"name": "Oil", "quantity": 1, "unit": "tbsp"},
        ]
        tags = ["one-pot", "budget"]
    elif meal_type == "dinner":
        base_ings = [
            {"name": "Whole wheat pasta", "quantity": 120, "unit": "g"},
            {"name": "Tomato sauce", "quantity": 100, "unit": "g"},
            {"name": "Bell pepper", "quantity": 1, "unit": "pc"},
            {"name": "Garlic", "quantity": 2, "unit": "cloves"},
            {"name": "Olive oil", "quantity": 1, "unit": "tbsp"},
        ]
        tags = ["comfort", "quick"]
    else:  # snack
        base_ings = [
            {"name": "Yogurt", "quantity": 150, "unit": "g"},
            {"name": "Honey", "quantity": 1, "unit": "tbsp"},
            {"name": "Mixed nuts", "quantity": 20, "unit": "g"},
        ]
        tags = ["snack", "quick"]

    # compute ingredient costs and total
    ingredients_with_costs = []
    total_cost = 0.0
    for ing in base_ings:
        name = ing["name"]
        qty = float(ing.get("quantity") or 1.0)
        # assume price_per_base corresponds to a typical small unit; scale roughly
        price_unit = estimate_price_inr(name)
        # if unit has 'g' assume price is per 50g baseline
        denom = 50.0 if (ing.get("unit") and "g" in ing.get("unit")) else 1.0
        cost = max(1.0, price_unit * (qty / denom))
        ingredients_with_costs.append({
            "name": name,
            "quantity": qty,
            "unit": ing.get("unit"),
            "cost_inr": round2(cost)
        })
        total_cost += cost

    time_min = estimate_time_for_title(title)
    calories = estimate_calories_for_title(title)

    instructions = [
        f"Prep ingredients for {title}.",
        "Heat a pan, cook main ingredients until tender.",
        "Season to taste and serve."
    ]

    recipe = {
        "id": rid,
        "title": title,
        "image": "🍽️",
        "time_min": time_min,
        "servings": 2,
        "cost_inr": round2(total_cost),
        "calories": calories,
        "source": "local-generator",
        "confidence": "high",
        "ingredients": ingredients_with_costs,
        "instructions": instructions,
        "cuisine": None,
        "difficulty": "Easy",
        "tags": tags,
        "nutritional_info": {"protein_g": 12, "carbs_g": 45, "fat_g": 14}
    }

    RECIPE_DB[rid] = recipe
    return recipe

# ---------- Optional OpenAI agent helpers (if openai is available) ----------
def _call_openai_chat(system_prompt: str, user_prompt: str, max_tokens: int = 700) -> Optional[str]:
    if not openai:
        return None
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini" if hasattr(openai, "ChatCompletion") else "gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=max_tokens
        )
        return resp.choices[0].message.content
    except Exception as e:
        print("OpenAI call error:", e)
        return None

def openai_generate_plan_and_recipes(prompt: str, days: int, meals: List[str]) -> Optional[Dict[str, Any]]:
    """Two-step pipeline: planner -> recipe generator. Expects JSON outputs from LLM."""
    if not openai:
        return None

    # Planner request: produce days array with simple titles
    system_planner = (
        "You are a helpful meal planner. Produce JSON of the shape: "
        '{"days":[{"day":"Monday","meals":{"breakfast":"...","lunch":"...","dinner":"...","snack":"..."}},...]} '
        "Return only JSON."
    )
    user_planner = f"User constraints: {prompt}\nDays: {days}\nMeals: {','.join(meals)}\nReturn JSON only."

    planner_text = _call_openai_chat(system_planner, user_planner, max_tokens=600)
    if not planner_text:
        return None

    try:
        # try to extract JSON substring
        first = planner_text.find("{")
        last = planner_text.rfind("}")
        json_text = planner_text[first:last+1] if first!=-1 and last!=-1 else planner_text
        planner_json = json.loads(json_text)
    except Exception as e:
        print("Planner parse failed:", e)
        return None

    days_out = []
    recipes_out = []
    system_recipe = (
        "You are a recipe generator. For a given recipe title and meal type return JSON like:\n"
        '{"title":"...","ingredients":[{"name":"...","quantity":50,"unit":"g"},...],"instructions":["..."],"servings":2,"time_min":20,"calories":400}\n'
        "Return only JSON."
    )

    try:
        for day_obj in planner_json.get("days", []):
            day_name = day_obj.get("day")
            meals_map = day_obj.get("meals", {})
            meals_recipe_map = {}
            for mtype, title in meals_map.items():
                user_recipe = f"Title: {title}\nMeal type: {mtype}\nConstraints: {prompt}\nReturn JSON recipe."
                recipe_text = _call_openai_chat(system_recipe, user_recipe, max_tokens=700)
                recipe_obj = None
                if recipe_text:
                    try:
                        f = recipe_text.find("{")
                        l = recipe_text.rfind("}")
                        rtext = recipe_text[f:l+1] if f!=-1 and l!=-1 else recipe_text
                        recipe_json = json.loads(rtext)
                        # transform into our format and estimate costs
                        rid = new_id()
                        ingr_list = []
                        total_cost = 0.0
                        for ing in recipe_json.get("ingredients", []):
                            name = ing.get("name")
                            qty = float(ing.get("quantity") or 1.0)
                            unit = ing.get("unit")
                            price_unit = estimate_price_inr(name)
                            denom = 50.0 if unit and "g" in unit else 1.0
                            cost = max(1.0, price_unit * (qty / denom))
                            ingr_list.append({"name": name, "quantity": qty, "unit": unit, "cost_inr": round2(cost)})
                            total_cost += cost
                        recipe_obj = {
                            "id": rid,
                            "title": title,
                            "image": "🍽️",
                            "time_min": int(recipe_json.get("time_min") or estimate_time_for_title(title)),
                            "servings": int(recipe_json.get("servings") or 2),
                            "cost_inr": round2(total_cost),
                            "calories": int(recipe_json.get("calories") or estimate_calories_for_title(title)),
                            "source": "openai",
                            "confidence": "medium",
                            "ingredients": ingr_list,
                            "instructions": recipe_json.get("instructions", ["Cook and serve."]),
                            "tags": recipe_json.get("tags", []),
                        }
                        RECIPE_DB[rid] = recipe_obj
                    except Exception as e:
                        print("Recipe parse failed, fallback:", e)
                        recipe_obj = build_recipe_from_template(title, mtype, prompt_hint=prompt)
                else:
                    recipe_obj = build_recipe_from_template(title, mtype, prompt_hint=prompt)
                meals_recipe_map[mtype] = recipe_obj
                recipes_out.append(recipe_obj)
            days_out.append({"day": day_name, "meals": meals_recipe_map})
        return {"days": days_out, "recipes": recipes_out}
    except Exception as e:
        print("OpenAI recipe pipeline error:", e)
        return None

# ---------------- Routes ----------------
@home_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "openai": bool(openai)}), 200

@home_bp.route("/generate-plan", methods=["POST"])
def generate_plan():
    data = request.get_json() or {}
    prompt = data.get("prompt", "") or ""
    days = int(data.get("days", 7) or 7)
    meals = data.get("meals") or ["breakfast", "lunch", "dinner", "snack"]

    # Try OpenAI pipeline if available
    if openai:
        try:
            out = openai_generate_plan_and_recipes(prompt, days, meals)
            if out:
                # transform into day->meal->recipe mapping
                plan_map = {}
                for day_obj in out["days"]:
                    day_name = day_obj["day"]
                    plan_map[day_name] = {}
                    for mtype, recipe in day_obj["meals"].items():
                        plan_map[day_name][mtype] = recipe
                return jsonify({"success": True, "plan": plan_map, "recipes": out["recipes"]}), 200
        except Exception as e:
            current_app.logger.error("OpenAI pipeline failed, falling back: %s", e)

    # Fallback deterministic generator
    weekday_names = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    plan_map: Dict[str, Dict[str, Any]] = {}
    recipes_list: List[Dict[str, Any]] = []
    for i in range(days):
        day_name = weekday_names[i % len(weekday_names)]
        plan_map[day_name] = {}
        for m in meals:
            if "student" in prompt.lower() and ("quick" in prompt.lower() or "cheap" in prompt.lower()):
                base_title = {
                    "breakfast": "Quick Oats & Fruit Bowl",
                    "lunch": "One-pot Veg Pulao",
                    "dinner": "Simple Pasta with Veggies",
                    "snack": "Yogurt & Nuts Snack"
                }.get(m, f"Quick {m.title()}")
            else:
                base_title = f"{m.title()} Recipe"
            recipe = build_recipe_from_template(base_title, m, prompt)
            plan_map[day_name][m] = recipe
            recipes_list.append(recipe)

    return jsonify({"success": True, "plan": plan_map, "recipes": recipes_list}), 200

@home_bp.route("/recipe/<recipe_id>", methods=["GET"])
def get_recipe(recipe_id: str):
    r = RECIPE_DB.get(recipe_id)
    if not r:
        return jsonify({"success": False, "error": "Recipe not found"}), 404
    return jsonify(r), 200

@home_bp.route("/enhance", methods=["POST"])
def enhance_recipe():
    data = request.get_json() or {}
    recipe_id = data.get("recipeId")
    enhancement_type = data.get("enhancementType")
    custom_instructions = data.get("customInstructions")

    if not recipe_id or not enhancement_type:
        return jsonify({"success": False, "error": "recipeId and enhancementType required"}), 400

    r = RECIPE_DB.get(recipe_id)
    if not r:
        return jsonify({"success": False, "error": "Recipe not found"}), 404

    # Simple enhancement logic
    if enhancement_type == "vegetarian":
        # replace meat with tofu/paneer
        new_ings = []
        for ing in r.get("ingredients", []):
            name = ing.get("name", "")
            if any(x in name.lower() for x in ["chicken","fish","salmon","beef","pork"]):
                new_ing = {"name": "Tofu", "quantity": ing.get("quantity") or 100, "unit": ing.get("unit") or "g", "cost_inr": round2(estimate_price_inr("tofu"))}
                new_ings.append(new_ing)
            else:
                new_ings.append(ing)
        r["ingredients"] = new_ings
        tags = set(r.get("tags", []) + ["vegetarian"])
        r["tags"] = list(tags)
        r["cost_inr"] = round2(sum([ing.get("cost_inr") or estimate_price_inr(ing.get("name","")) for ing in new_ings]))
    elif enhancement_type == "spicier":
        r.setdefault("ingredients", []).append({"name": "Red chili powder", "quantity": 1, "unit": "tsp", "cost_inr": 5.0})
        r.setdefault("instructions", []).append("Add extra red chili powder to taste.")
        r["cost_inr"] = round2(r.get("cost_inr", 0.0) + 5.0)
        r["tags"] = list(set(r.get("tags", []) + ["spicy"]))
    elif enhancement_type == "double-portions":
        r["servings"] = int(r.get("servings", 2)) * 2
        new_ings = []
        for ing in r.get("ingredients", []):
            qty = float(ing.get("quantity") or 1.0)
            new_qty = round2(qty * 2)
            cost = round2((ing.get("cost_inr") or estimate_price_inr(ing.get("name",""))) * 2)
            new_ings.append({"name": ing.get("name"), "quantity": new_qty, "unit": ing.get("unit"), "cost_inr": cost})
        r["ingredients"] = new_ings
        r["cost_inr"] = round2(r.get("cost_inr", 0.0) * 2)
    elif enhancement_type == "custom":
        if custom_instructions:
            r.setdefault("instructions", []).append(f"Custom: {custom_instructions}")
            r["cost_inr"] = round2(r.get("cost_inr", 0.0) + 10.0)
            r["tags"] = list(set(r.get("tags", []) + ["custom"]))
    else:
        return jsonify({"success": False, "error": "Unknown enhancement type"}), 400

    # Persist change in RECIPE_DB
    RECIPE_DB[recipe_id] = r
    return jsonify({"success": True, "recipe": r}), 200
