"""
diet_plan.py

Flask blueprint that generates weekly diet plans nutrition-wise using Groq (Llama) when available.

Endpoints:
- POST /diet/generate-plan
- POST /diet/generate-day

Environment:
- GROQ_API_KEY  (optional; if missing, code uses deterministic fallback)
- GROQ_MODEL    (optional, default "llama-3.3-70b-versatile")
"""
import os
import json
import uuid
import re
import hashlib
from typing import Dict, Any, List, Optional
from flask import Blueprint, request, jsonify

# Groq client (Llama) config
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not set; diet_plan will run in deterministic fallback mode only.")

try:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
except Exception as e:
    groq_client = None
    print("groq import failed:", e)

diet_bp = Blueprint("diet", __name__, url_prefix="/diet")

WEEKDAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

# ---------------- Nutrition helpers ----------------

def bmr_mifflin(weight_kg: float, height_cm: float, age: int, sex: str) -> float:
    if sex and sex.lower().startswith("f"):
        bmr = 10*weight_kg + 6.25*height_cm - 5*age - 161
    else:
        bmr = 10*weight_kg + 6.25*height_cm - 5*age + 5
    return float(bmr)

ACTIVITY_MULTIPLIER = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9
}

def tdee_from_user(user: dict) -> float:
    weight = float(user.get("weight_kg", 70))
    height = float(user.get("height_cm", 170))
    age = int(user.get("age", 30))
    sex = user.get("sex", "male")
    activity = user.get("activity_level", "moderate")
    multiplier = ACTIVITY_MULTIPLIER.get(activity, 1.55)
    bmr = bmr_mifflin(weight, height, age, sex)
    return bmr * multiplier

def target_calories(tdee: float, goal: str) -> int:
    g = (goal or "maintenance").lower()
    if g == "lose_weight":
        return int(round(tdee * 0.8))
    if g == "gain_weight":
        return int(round(tdee * 1.15))
    return int(round(tdee))

def macros_from_calories(calories: int, protein_pct=0.30, fat_pct=0.25, carb_pct=0.45) -> Dict[str, float]:
    protein_cals = calories * protein_pct
    fat_cals = calories * fat_pct
    carb_cals = calories * carb_pct
    protein_g = protein_cals / 4.0
    fat_g = fat_cals / 9.0
    carbs_g = carb_cals / 4.0
    return {"protein_g": round(protein_g, 1), "fat_g": round(fat_g, 1), "carbs_g": round(carbs_g, 1)}

# ---------------- Deterministic fallback templates ----------------

SIMPLE_MEAL_TEMPLATES = {
    "breakfast": [
        {"name": "Greek Yogurt Quinoa Bowl", "description": "Greek yogurt, cooked quinoa, berries, nuts", "ratio": {"protein":0.35,"fat":0.25,"carb":0.40}},
        {"name": "Protein Oatmeal", "description": "Rolled oats, protein powder, banana, nuts", "ratio": {"protein":0.30,"fat":0.20,"carb":0.50}},
        {"name": "Veggie Omelette", "description": "Eggs, spinach, tomato, onions", "ratio": {"protein":0.34,"fat":0.30,"carb":0.36}},
    ],
    "lunch": [
        {"name": "Grilled Chicken Salad", "description": "Greens, grilled chicken, olive oil dressing, seeds", "ratio": {"protein":0.40,"fat":0.30,"carb":0.30}},
        {"name": "Tofu Quinoa Bowl", "description": "Tofu, quinoa, mixed veggies, tahini", "ratio": {"protein":0.30,"fat":0.30,"carb":0.40}},
        {"name": "Chickpea & Veggie Wrap", "description": "Whole-wheat wrap with spiced chickpeas and veggies", "ratio": {"protein":0.28,"fat":0.25,"carb":0.47}},
    ],
    "dinner": [
        {"name": "Baked Salmon with Veggies", "description": "Salmon, roasted veg, small potato or quinoa", "ratio": {"protein":0.35,"fat":0.30,"carb":0.35}},
        {"name": "Lentil Curry and Rice", "description": "Lentils, tomato-onion gravy, brown rice", "ratio": {"protein":0.25,"fat":0.20,"carb":0.55}},
        {"name": "Stir-fried Tofu & Rice", "description": "Tofu, mixed vegetables, soy glaze, brown rice", "ratio": {"protein":0.30,"fat":0.28,"carb":0.42}},
    ]
}

def split_calories_across_meals(total_calories: int, meals: List[str]) -> Dict[str,int]:
    n = len(meals)
    allocation = {}
    if n == 3:
        weights = {"breakfast":0.25, "lunch":0.35, "dinner":0.40}
    elif n == 4:
        weights = {"breakfast":0.22, "lunch":0.30, "dinner":0.33, "snack":0.15}
    else:
        w = 1.0 / n
        weights = {m: w for m in meals}
    for m in meals:
        pct = weights.get(m, 1.0/len(meals))
        allocation[m] = int(round(total_calories * pct))
    diff = total_calories - sum(allocation.values())
    if diff != 0:
        key = "dinner" if "dinner" in allocation else meals[-1]
        allocation[key] += diff
    return allocation

def _stable_hash_int(s: str) -> int:
    h = hashlib.sha256(s.encode("utf-8")).hexdigest()
    return int(h[:8], 16)

def build_meal_from_template(meal_type: str, calories: int, preference_tags: List[str], day_index: int = 0, avoid_names: List[str] = None) -> Dict[str,Any]:
    templates = SIMPLE_MEAL_TEMPLATES.get(meal_type, [])
    if not templates:
        chosen = {"name": f"{meal_type.title()} Meal", "description": "Balanced meal", "ratio": {"protein":0.3,"fat":0.25,"carb":0.45}}
    else:
        seed_input = f"{meal_type}|{day_index}|" + "|".join(sorted(preference_tags or []))
        idx = _stable_hash_int(seed_input) % len(templates)
        chosen = templates[idx]
        if avoid_names:
            attempts = 0
            while chosen["name"] in avoid_names and attempts < len(templates):
                idx = (idx + 1) % len(templates)
                chosen = templates[idx]
                attempts += 1

    ratio = chosen.get("ratio", {"protein":0.3,"fat":0.25,"carb":0.45})
    macros = macros_from_calories(calories, ratio["protein"], ratio["fat"], ratio["carb"])
    return {
        "id": str(uuid.uuid4()),
        "name": chosen["name"],
        "description": chosen["description"],
        "calories": int(calories),
        "macros": macros,
        "ingredients_hint": chosen.get("description", "")
    }

# ---------------- Utilities: parse calories and JSON ----------------

def parse_json_from_text(text: str) -> Optional[dict]:
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
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

def parse_calories_value(val, fallback: int) -> int:
    """
    Accept numeric or string values like "420 cal", "~420", "about 420kcal", "≈420".
    Return integer calories; fallback used if parsing fails.
    """
    if val is None:
        return int(fallback)
    if isinstance(val, (int, float)):
        return int(round(val))
    s = str(val)
    # find first integer in string
    m = re.search(r"(-?\d+)", s.replace(",", ""))
    if m:
        try:
            return int(m.group(1))
        except Exception:
            return int(fallback)
    return int(fallback)

# ---------------- Groq (Llama) helper ----------------

def call_groq_chat_system(system_prompt: str, user_prompt: str, model: str = GROQ_MODEL) -> str:
    if groq_client is None:
        raise RuntimeError("Groq client not configured (GROQ_API_KEY missing or import failed).")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    resp = groq_client.chat.completions.create(
        messages=messages,
        model=model,
    )
    try:
        return resp.choices[0].message.content
    except Exception:
        return str(resp)

# ---------------- Groq-powered agent pipeline ----------------

def groq_generate_week_plan(prompt: str, days: int, meals: List[str], user: dict) -> Optional[Dict[str,Any]]:
    if groq_client is None:
        return None

    planner_system = (
        "You are a nutritionist and meal planner. Output ONLY JSON. Ensure diversity across days: do not repeat the same meal name more than once in the week unless unavoidable.\n"
        "Schema: {\"days\": [{\"day\":\"Monday\",\"calories\":2200, \"notes\":\"...\"}, ...]}."
    )
    planner_user = (
        f"User profile: {json.dumps(user)}\n"
        f"Preferences / prompt: {prompt}\n"
        f"Number of days: {days}\n"
        f"Meals per day: {meals}\n"
        "Return a planner JSON with the target calories for each day and brief notes. Make sure day-to-day meals will be varied."
    )
    try:
        planner_text = call_groq_chat_system(planner_system, planner_user)
        planner_json = parse_json_from_text(planner_text)
        if not planner_json:
            return None
    except Exception as e:
        print("Groq planner error:", e)
        return None

    out_days = []
    used_names_global = set()
    for d_index, d in enumerate(planner_json.get("days", [])):
        day_name = d.get("day", WEEKDAYS[d_index % len(WEEKDAYS)])
        target_day_cals = int(d.get("calories", user.get("target_calories", 2000)))
        allocation = split_calories_across_meals(target_day_cals, meals)
        meals_obj = {}
        used_names_list = list(used_names_global)

        for mtype in meals:
            meal_cal_target = allocation.get(mtype, max(200, target_day_cals // max(1,len(meals))))
            avoid_note = ""
            if used_names_list:
                avoid_note = f" Avoid using these meal names (they were used earlier in the week): {json.dumps(used_names_list)}."

            gen_system = (
                "You are a recipe and meal generator. Output ONLY JSON for a single meal with keys:\n"
                '{"name":"...","description":"...","calories":400,"macros":{"protein_g":30,"fat_g":15,"carbs_g":40},"ingredients_hint":"..."}'
            )
            gen_user = (
                f"Create one {mtype} matching these constraints:\n"
                f"- calories (approx): {meal_cal_target}\n"
                f"- target style / preferences: {prompt}\n"
                f"- user profile: {json.dumps(user)}\n"
                f"{avoid_note}\n"
                "Return only the JSON object for the meal. The name should be concise (one short title)."
            )

            try:
                meal_text = call_groq_chat_system(gen_system, gen_user)
                meal_json = parse_json_from_text(meal_text)
                if meal_json and meal_json.get("name"):
                    # normalize calories to integer (if string like '420 cal' parse it)
                    meal_cals = parse_calories_value(meal_json.get("calories"), meal_cal_target)
                    name = meal_json.get("name").strip()
                    # avoid duplicates completely
                    if name in used_names_global:
                        raise ValueError("Duplicate name from model; fallback to deterministic")
                    meal_json["calories"] = int(meal_cals)
                    # ensure macros present
                    if "macros" not in meal_json:
                        meal_json["macros"] = macros_from_calories(meal_cals)
                    meal_json.setdefault("id", str(uuid.uuid4()))
                    meals_obj[mtype] = meal_json
                    used_names_global.add(name)
                    used_names_list.append(name)
                    continue
            except Exception as e:
                print("Groq meal generation warning for", mtype, "on", day_name, ":", e)

            # fallback deterministic meal, ensure calorie equals allocation
            pref_tags = [t.strip().lower() for t in (prompt or "").split(",") if t.strip()]
            fallback_meal = build_meal_from_template(mtype, meal_cal_target, pref_tags, day_index=d_index, avoid_names=list(used_names_global))
            # if fallback duplicates, append day to name
            if fallback_meal["name"] in used_names_global:
                fallback_meal["name"] = f"{fallback_meal['name']} ({day_name})"
            used_names_global.add(fallback_meal["name"])
            meals_obj[mtype] = fallback_meal

        # compute reliable day total from the meals we have
        day_total_calories = sum(int(parse_calories_value(m.get("calories"), 0)) for m in meals_obj.values())
        total_macros = {"protein_g":0.0,"fat_g":0.0,"carbs_g":0.0}
        for m in meals_obj.values():
            mm = m.get("macros", {})
            total_macros["protein_g"] += float(mm.get("protein_g", 0))
            total_macros["fat_g"] += float(mm.get("fat_g", 0))
            total_macros["carbs_g"] += float(mm.get("carbs_g", 0))

        out_days.append({
            "day": day_name,
            "target_calories": target_day_cals,
            "calories": int(day_total_calories),
            "notes": d.get("notes", ""),
            "meals": meals_obj,
            "total_macros": {k: round(v,1) for k,v in total_macros.items()}
        })

    return {"days": out_days}

# ---------------- Blueprint endpoints ----------------

@diet_bp.route("/generate-plan", methods=["POST"])
def generate_plan():
    data = request.get_json() or {}
    prompt = data.get("prompt", "") or ""
    days = int(data.get("days", 7) or 7)
    meals = data.get("meals") or ["breakfast","lunch","dinner"]
    user = data.get("user") or {}

    user_defaults = {
        "age": int(user.get("age", 30)),
        "sex": user.get("sex", "male"),
        "weight_kg": float(user.get("weight_kg", 70)),
        "height_cm": float(user.get("height_cm", 170)),
        "activity_level": user.get("activity_level", "moderate"),
        "goal": user.get("goal", "maintenance")
    }
    user = user_defaults

    tdee = tdee_from_user(user)
    targ = target_calories(tdee, user.get("goal"))
    user["tdee"] = int(round(tdee))
    user["target_calories"] = targ

    # Try Groq if available
    if groq_client:
        try:
            agent_out = groq_generate_week_plan(prompt, days, meals, user)
            if agent_out:
                return jsonify({"success": True, "source": "groq_agent", "plan": agent_out}), 200
        except Exception as e:
            print("Groq agent failed, falling back to deterministic:", e)

    # Deterministic fallback -> ensure variety and set meal calories from allocation
    plan_days = []
    used_names = set()
    pref_tags_global = [t.strip().lower() for t in prompt.split(",") if t.strip()]
    for i in range(days):
        day_name = WEEKDAYS[i % len(WEEKDAYS)]
        target_for_day = int(round(targ * (1.0 + (0.05 * (((i % 3) - 1))))))  # small variation
        allocation = split_calories_across_meals(target_for_day, meals)
        meals_obj = {}
        for m_index, m in enumerate(meals):
            meal_cal = allocation.get(m, max(200, target_for_day // max(1,len(meals))))
            mobj = build_meal_from_template(m, meal_cal, pref_tags_global, day_index=i, avoid_names=list(used_names))
            if mobj["name"] in used_names:
                mobj["name"] = f"{mobj['name']} ({day_name})"
            used_names.add(mobj["name"])
            meals_obj[m] = mobj

        # compute totals from actual meal calories/macros
        total_cal = sum(int(parse_calories_value(mobj.get("calories"), 0)) for mobj in meals_obj.values())
        total_macros = {"protein_g":0.0,"fat_g":0.0,"carbs_g":0.0}
        for mobj in meals_obj.values():
            mm = mobj.get("macros", {})
            total_macros["protein_g"] += float(mm.get("protein_g", 0))
            total_macros["fat_g"] += float(mm.get("fat_g", 0))
            total_macros["carbs_g"] += float(mm.get("carbs_g", 0))

        plan_days.append({
            "day": day_name,
            "target_calories": target_for_day,
            "calories": int(total_cal),
            "meals": meals_obj,
            "total_macros": {k: round(v,1) for k,v in total_macros.items()}
        })

    return jsonify({"success": True, "source": "deterministic", "user": user, "plan": {"days": plan_days}}), 200

@diet_bp.route("/generate-day", methods=["POST"])
def generate_day():
    data = request.get_json() or {}
    prompt = data.get("prompt", "") or ""
    day = data.get("day", "Monday")
    meals = data.get("meals") or ["breakfast","lunch","dinner"]
    user = data.get("user") or {}

    user_defaults = {
        "age": int(user.get("age", 30)),
        "sex": user.get("sex", "male"),
        "weight_kg": float(user.get("weight_kg", 70)),
        "height_cm": float(user.get("height_cm", 170)),
        "activity_level": user.get("activity_level", "moderate"),
        "goal": user.get("goal", "maintenance")
    }
    user = user_defaults
    tdee = tdee_from_user(user)
    targ = target_calories(tdee, user.get("goal"))
    user["tdee"] = int(round(tdee))
    user["target_calories"] = targ

    # Try Groq for a single day (re-uses groq_generate_week_plan with days=1)
    if groq_client:
        try:
            ag = groq_generate_week_plan(prompt, 1, meals, user)
            if ag and ag.get("days"):
                day_obj = ag["days"][0]
                return jsonify({"success": True, "source":"groq_agent", "day": day_obj}), 200
        except Exception as e:
            print("Groq single-day failed:", e)

    allocation = split_calories_across_meals(targ, meals)
    pref_tags = [t.strip().lower() for t in prompt.split(",") if t.strip()]
    meals_obj = {}
    for idx, m in enumerate(meals):
        meal_cal = allocation.get(m, max(200, targ // max(1,len(meals))))
        meals_obj[m] = build_meal_from_template(m, meal_cal, pref_tags, day_index=idx)
    # compute totals
    total_cal = sum(int(parse_calories_value(m.get("calories"), 0)) for m in meals_obj.values())
    total_macros = {"protein_g":0.0,"fat_g":0.0,"carbs_g":0.0}
    for m in meals_obj.values():
        mm = m.get("macros", {})
        total_macros["protein_g"] += float(mm.get("protein_g", 0))
        total_macros["fat_g"] += float(mm.get("fat_g", 0))
        total_macros["carbs_g"] += float(mm.get("carbs_g", 0))

    day_out = {
        "day": day,
        "target_calories": targ,
        "calories": int(total_cal),
        "meals": meals_obj,
        "total_macros": {k: round(v,1) for k,v in total_macros.items()}
    }
    return jsonify({"success": True, "source":"deterministic", "day": day_out}), 200
