"""
recipe_extractor.py

Flask blueprint for the Recipe Extractor backend.

Endpoints:
- GET  /health
- POST /photo      -> {"image": "data:image/jpeg;base64,...."}
- POST /dish-name  -> {"dishName": "Paneer Butter Masala"}
- POST /url        -> {"url": "https://..."}
- POST /enhance    -> {"recipeId": "...", "enhancementType": "vegetarian" | "spicier" | "double-portions" | "custom",
                       "customInstructions": "..."}
- POST /save       -> Save recipe to database
"""

import os
import re
import io
import json
import uuid
import base64
import traceback
from typing import Optional
from database import save_recipe_to_db, get_user_saved_recipes
from flask import Blueprint, request, jsonify
from PIL import Image
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

# === Config / Keys ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY / GOOGLE_API_KEY not set. Gemini calls will fail until provided.")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not set. Groq calls will fail until provided.")

# === Import SDKs (deferred) ===
try:
    from google import genai
    # create Gemini client (Google Gen AI)
    genai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
except Exception as e:
    genai_client = None
    print("google-genai import failed:", e)

try:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
except Exception as e:
    groq_client = None
    print("groq import failed:", e)

# === Blueprint ===
extractor_bp = Blueprint("recipe_extractor", __name__)

# In-memory recipe store (for demo). In production use persistent DB.
RECIPE_STORE = {}

# === Helpers ===

def parse_json_from_text(text: str) -> Optional[dict]:
    """
    Try to extract JSON object from a model's textual response.
    The model is asked to return strict JSON, but we defensively parse.
    """
    try:
        # First try direct parse
        return json.loads(text)
    except Exception:
        # Attempt to extract the first {...} block
        m = re.search(r"(\{(?:.|\n)*\})", text)
        if m:
            candidate = m.group(1)
            try:
                return json.loads(candidate)
            except Exception:
                # try fixing single quotes
                try:
                    candidate2 = candidate.replace("'", '"')
                    return json.loads(candidate2)
                except Exception:
                    pass
    return None

def safe_json(obj):
    return json.loads(json.dumps(obj))

def call_gemini_image_to_text(pil_image: Image.Image, prompt_text: str) -> str:
    """
    Use google-genai client to send an image + prompt, return text.
    """
    if genai_client is None:
        raise RuntimeError("Gemini client not configured (google-genai).")
    # The google-genai SDK supports passing PIL.Image objects directly in contents list.
    # We build a contents list: [image_obj, prompt_text]
    # The response object has `text` attribute.
    response = genai_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[pil_image, prompt_text],
    )
    # aggregated text:
    return response.text if hasattr(response, "text") else str(response)

def call_groq_chat_system(system_prompt: str, user_prompt: str, model: str = GROQ_MODEL) -> str:
    """
    Use Groq client chat completion to produce text (expected JSON).
    """
    if groq_client is None:
        raise RuntimeError("Groq client not configured (groq).")
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

def fetch_url_text(url: str) -> str:
    """
    Fetch a URL and attempt to extract title and main text.
    """
    try:
        resp = requests.get(url, timeout=8, headers={"User-Agent":"RecipeExtractor/1.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        title = (soup.title.string or "").strip() if soup.title else ""
        # Try OpenGraph description or meta description
        desc = ""
        og = soup.find("meta", property="og:description")
        if og and og.get("content"):
            desc = og["content"]
        else:
            md = soup.find("meta", attrs={"name":"description"})
            desc = md["content"] if md and md.get("content") else ""
        # Also collect any <p> text as fallback (first few paragraphs)
        paragraphs = soup.find_all("p")
        ptext = " ".join([p.get_text().strip() for p in paragraphs[:5]])
        combined = "\n".join([t for t in [title, desc, ptext] if t])
        return combined
    except Exception:
        return ""

# === Endpoint implementations ===

@extractor_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"success": True, "message": "recipe-extractor backend running"}), 200

@extractor_bp.route("/photo", methods=["POST"])
def extractor_photo():
    try:
        data = request.get_json(force=True)
        if not data or "image" not in data:
            return jsonify({"success": False, "error": "Missing 'image' in request body"}), 400

        data_uri = data["image"]
        # Expect form: data:image/jpeg;base64,/9j/4AA...
        m = re.match(r"data:(?P<mime>image/[^;]+);base64,(?P<b64>.+)$", data_uri)
        if not m:
            return jsonify({"success": False, "error": "Invalid image data URI"}), 400

        img_b64 = m.group("b64")
        img_bytes = base64.b64decode(img_b64)
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Build a rich prompt for Gemini vision
        prompt = (
            "You are an expert chef and food scientist. Analyze the image provided and:\n"
            "1) Say whether the image clearly shows a food dish (\"food\" or \"not food\").\n"
            "2) If food, give your best-guess dish name (short) and cuisine.\n"
            "3) List visible ingredients (comma separated).\n"
            "4) State whether it's vegetarian or non-vegetarian.\n"
            "5) Suggest likely cooking method(s) and an estimated total time (in minutes), servings, and calorie estimate.\n"
            "6) Finally, produce a structured recipe in JSON EXACTLY with the following keys:\n"
            "   title, source, confidence, time, servings, calories, cuisine, difficulty, tags (array),\n"
            "   ingredients (array of objects {name, quantity, unit}), instructions (array of step strings),\n"
            "   nutritional_info (object: protein, carbs, fat, fiber)\n"
            "Output only valid JSON (no additional explanatory text). If you are not confident it is food, set confidence to 'low' and return {\"title\":null, \"reason\":\"not food\"}.\n"
            "Be conservative on quantities if uncertain; use approximate quantities like \"1-2\" or \"to taste\".\n"
        )

        # Call Gemini vision (image + prompt)
        gemini_text = ""
        try:
            gemini_text = call_gemini_image_to_text(pil_image, prompt)
        except Exception as e:
            traceback.print_exc()
            return jsonify({"success": False, "error": f"Gemini vision failed: {str(e)}"}), 500

        # Try to parse JSON
        parsed = parse_json_from_text(gemini_text)

        # If parsing failed, fallback to using Groq to convert gemini textual description into JSON
        if parsed is None:
            try:
                system_prompt = "You are a helpful assistant that converts a chef's analysis into a structured JSON recipe object. Output ONLY JSON."
                user_prompt = (
                    "Convert the following analysis into a strict JSON recipe following the schema "
                    "title, source, confidence, time, servings, calories, cuisine, difficulty, tags (array), "
                    "ingredients (array of {name,quantity,unit}), instructions (array), nutritional_info.\n\n"
                    "Analysis:\n" + gemini_text
                )
                groq_out = call_groq_chat_system(system_prompt, user_prompt)
                parsed = parse_json_from_text(groq_out)
            except Exception as e:
                traceback.print_exc()
                parsed = None

        if parsed is None:
            return jsonify({"success": False, "error": "Could not parse recipe JSON from model output", "raw": gemini_text}), 500

        # Put sensible defaults and store recipe
        recipe_id = str(uuid.uuid4())
        recipe = {
            "id": recipe_id,
            "title": parsed.get("title") or parsed.get("dish") or "Unknown Dish",
            "image": "🍽️",
            "time": parsed.get("time", "30 mins"),
            "servings": parsed.get("servings", "2"),
            "calories": parsed.get("calories", "estimate"),
            "source": "image",
            "confidence": parsed.get("confidence", "medium"),
            "ingredients": parsed.get("ingredients", []),
            "instructions": parsed.get("instructions", []),
            "cuisine": parsed.get("cuisine", ""),
            "difficulty": parsed.get("difficulty", "medium"),
            "tags": parsed.get("tags", []),
            "nutritional_info": parsed.get("nutritional_info", {}),
        }
        RECIPE_STORE[recipe_id] = recipe

        return jsonify({"success": True, "recipe": recipe}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@extractor_bp.route("/dish-name", methods=["POST"])
def extractor_dish_name():
    """
    Generate a recipe from a dish name (text) using Groq (Llama) model -> structured JSON.
    """
    try:
        data = request.get_json(force=True)
        if not data or "dishName" not in data:
            return jsonify({"success": False, "error": "Missing 'dishName' in body"}), 400
        dish = data["dishName"].strip()
        if not dish:
            return jsonify({"success": False, "error": "Empty dishName"}), 400

        system_prompt = (
            "You are a world-class chef and recipe writer. When asked for a recipe, output STRICT JSON only (no explanation). "
            "Schema: title, source, confidence (low/medium/high), time, servings, calories, cuisine, difficulty, tags (array), "
            "ingredients (array of {name, quantity, unit}), instructions (array of step strings), nutritional_info (protein, carbs, fat, fiber)."
        )
        user_prompt = f"Create a complete recipe for '{dish}'. Be realistic, include ingredient quantities for 2-4 servings, a step-by-step instruction list, an estimated total time, and a short nutrition estimate."

        groq_response = call_groq_chat_system(system_prompt, user_prompt)
        parsed = parse_json_from_text(groq_response)
        if parsed is None:
            fallback_user = (
                "The model output must be valid JSON. Convert the following text to the JSON schema described earlier:\n\n"
                + groq_response
            )
            groq_response2 = call_groq_chat_system(system_prompt, fallback_user)
            parsed = parse_json_from_text(groq_response2)

        if parsed is None:
            return jsonify({"success": False, "error": "Failed to parse recipe JSON from Groq response", "raw": groq_response}), 500

        recipe_id = str(uuid.uuid4())
        recipe = {
            "id": recipe_id,
            "title": parsed.get("title", dish),
            "image": parsed.get("image", "🍽️"),
            "time": parsed.get("time", "30 mins"),
            "servings": parsed.get("servings", "2"),
            "calories": parsed.get("calories", ""),
            "source": "dish-name",
            "confidence": parsed.get("confidence", "high"),
            "ingredients": parsed.get("ingredients", []),
            "instructions": parsed.get("instructions", []),
            "cuisine": parsed.get("cuisine", ""),
            "difficulty": parsed.get("difficulty", "medium"),
            "tags": parsed.get("tags", []),
            "nutritional_info": parsed.get("nutritional_info", {}),
        }
        RECIPE_STORE[recipe_id] = recipe
        return jsonify({"success": True, "recipe": recipe}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@extractor_bp.route("/url", methods=["POST"])
def extractor_url():
    """
    Extract information from a restaurant/dish URL and generate a recipe using Groq.
    """
    try:
        data = request.get_json(force=True)
        if not data or "url" not in data:
            return jsonify({"success": False, "error": "Missing 'url' in body"}), 400
        url = data["url"].strip()
        if not url:
            return jsonify({"success": False, "error": "Empty url"}), 400

        scraped = fetch_url_text(url)
        if not scraped:
            return jsonify({"success": False, "error": "Failed to fetch or parse URL"}), 400

        system_prompt = (
            "You are a world-class chef and recipe extractor. Given the scraped page content (title, description, text), "
            "create a structured recipe JSON using this schema: title, source, confidence, time, servings, calories, cuisine, difficulty, tags (array), "
            "ingredients (array of {name, quantity, unit}), instructions (array), nutritional_info. Output ONLY JSON."
        )
        user_prompt = f"Scraped content:\n{scraped}\n\nCreate the recipe JSON now."

        groq_response = call_groq_chat_system(system_prompt, user_prompt)
        parsed = parse_json_from_text(groq_response)
        if parsed is None:
            groq_response2 = call_groq_chat_system(system_prompt, "Please output valid JSON only. Convert the previous output to JSON.")
            parsed = parse_json_from_text(groq_response2)

        if parsed is None:
            return jsonify({"success": False, "error": "Could not parse JSON from model", "raw": groq_response}), 500

        recipe_id = str(uuid.uuid4())
        recipe = {
            "id": recipe_id,
            "title": parsed.get("title", parsed.get("dish", "Unknown Dish")),
            "image": parsed.get("image", "🍽️"),
            "time": parsed.get("time", "30 mins"),
            "servings": parsed.get("servings", "2"),
            "calories": parsed.get("calories", ""),
            "source": url,
            "confidence": parsed.get("confidence", "medium"),
            "ingredients": parsed.get("ingredients", []),
            "instructions": parsed.get("instructions", []),
            "cuisine": parsed.get("cuisine", ""),
            "difficulty": parsed.get("difficulty", "medium"),
            "tags": parsed.get("tags", []),
            "nutritional_info": parsed.get("nutritional_info", {}),
        }
        RECIPE_STORE[recipe_id] = recipe
        return jsonify({"success": True, "recipe": recipe}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@extractor_bp.route("/enhance", methods=["POST"])
def extractor_enhance():
    """
    Enhance an existing recipe stored in RECIPE_STORE according to enhancementType.
    enhancementType: vegetarian, non-vegetarian, healthier, spicier, double-portions, custom
    """
    try:
        data = request.get_json(force=True)
        if not data or "recipeId" not in data or "enhancementType" not in data:
            return jsonify({"success": False, "error": "Missing 'recipeId' or 'enhancementType'"}), 400
        recipe_id = data["recipeId"]
        enh_type = data["enhancementType"]
        custom_instructions = data.get("customInstructions", "")

        recipe = RECIPE_STORE.get(recipe_id)
        if recipe is None:
            return jsonify({"success": False, "error": "recipeId not found"}), 404

        # Build a transformation prompt
        system_prompt = (
            "You are a professional chef and recipe modifier. Given an existing recipe JSON, apply the requested enhancement and output ONLY the updated recipe JSON with the same schema."
        )
        if enh_type == "vegetarian":
            user_prompt = (
                "Convert the recipe to vegetarian. Replace non-vegetarian protein(s) with suitable vegetarian alternatives. "
                "Keep quantities and cooking method similar where possible. Update tags and nutritional_info if needed.\n\n"
                f"Original recipe JSON:\n{json.dumps(recipe)}"
            )
        elif enh_type == "non-vegetarian":
            user_prompt = (
                "Add non-vegetarian protein options (e.g., chicken or prawns) to this recipe, with suggested quantities and cooking changes if needed.\n\n"
                f"Original recipe JSON:\n{json.dumps(recipe)}"
            )
        elif enh_type == "healthier":
            user_prompt = (
                "Make the recipe healthier: reduce calories, suggest lower-fat alternatives, increase vegetables and fiber, and adjust quantities. "
                "Keep flavor and method intact where possible.\n\n"
                f"Original recipe JSON:\n{json.dumps(recipe)}"
            )
        elif enh_type == "spicier":
            user_prompt = (
                "Increase spice/heat profile: add or increase spices, suggest exact quantities (e.g., '1 tsp chili powder'). Ensure balance and list modifications.\n\n"
                f"Original recipe JSON:\n{json.dumps(recipe)}"
            )
        elif enh_type == "double-portions":
            user_prompt = (
                "Scale the recipe to double the portions. Update all ingredient quantities accordingly and adjust cooking times if necessary.\n\n"
                f"Original recipe JSON:\n{json.dumps(recipe)}"
            )
        elif enh_type == "custom":
            user_prompt = (
                "Apply the following user instructions to the recipe and output updated recipe JSON only:\n\n"
                f"{custom_instructions}\n\nOriginal recipe JSON:\n{json.dumps(recipe)}"
            )
        else:
            return jsonify({"success": False, "error": f"Unknown enhancementType: {enh_type}"}), 400

        groq_out = call_groq_chat_system(system_prompt, user_prompt)
        parsed = parse_json_from_text(groq_out)
        if parsed is None:
            groq_out2 = call_groq_chat_system(system_prompt, "Please output valid JSON only. Convert the previous output to JSON.")
            parsed = parse_json_from_text(groq_out2)

        if parsed is None:
            return jsonify({"success": False, "error": "Could not parse enhanced recipe JSON", "raw": groq_out}), 500

        # Ensure id remains same
        parsed["id"] = recipe_id
        # store
        RECIPE_STORE[recipe_id] = parsed
        return jsonify({"success": True, "recipe": parsed}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@extractor_bp.route("/save", methods=["POST"])
def save_recipe():
    """
    Save a recipe to the database.
    Expects: {"recipe": recipe_data, "user_id": "user-uuid"}
    """
    try:
        data = request.get_json(force=True)
        if not data or "recipe" not in data or "user_id" not in data:
            return jsonify({"success": False, "error": "Missing 'recipe' or 'user_id' in body"}), 400
        
        recipe_data = data["recipe"]
        user_id = data["user_id"]
        
        # Save to database
        result = save_recipe_to_db(recipe_data, user_id)
        
        if result['success']:
            return jsonify({
                "success": True,
                "message": "Recipe saved successfully",
                "recipe_id": result['recipe_id'],
                "title": result['title']
            }), 200
        else:
            return jsonify({"success": False, "error": result.get('error', 'Database error')}), 500
            
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@extractor_bp.route("/saved-recipes/<user_id>", methods=["GET"])
def get_saved_recipes(user_id):
    """
    Get all saved recipes for a user.
    """
    try:
        recipes = get_user_saved_recipes(user_id)
        return jsonify({"success": True, "recipes": recipes}), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@extractor_bp.route("/test-db", methods=["GET"])
def test_db_connection():
    """Test database connection"""
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT version();")
        db_version = cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({
            "success": True, 
            "message": "Database connection successful",
            "version": db_version[0]
        }), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Database connection failed: {str(e)}"
        }), 500