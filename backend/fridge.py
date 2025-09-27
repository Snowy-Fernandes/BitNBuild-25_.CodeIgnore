"""
fridge.py

Flask backend for the Fridge feature in the React Native frontend.

Endpoints:
- GET  /health
- POST /fridge/photo      -> {"image": "data:image/jpeg;base64,...."}
- POST /fridge/text       -> {"ingredients": ["tomato", "onion", ...]}

Environment variables:
- GEMINI_API_KEY  (or GOOGLE_API_KEY)   - API key for Google Gen AI / Gemini
- GEMINI_MODEL    - optional (default "gemini-2.5-flash")
"""

import os
import re
import io
import json
import uuid
import base64
import traceback
from typing import Optional, List, Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

# === Config / Keys ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY / GOOGLE_API_KEY not set. Gemini calls will fail until provided.")

# === Import SDKs (deferred) ===
try:
    import google.generativeai as genai
    # create Gemini client (Google Gen AI)
    genai.configure(api_key=GEMINI_API_KEY)
    genai_client = genai if GEMINI_API_KEY else None
except Exception as e:
    genai_client = None
    print("google-genai import failed:", e)

# === App ===
app = Flask(__name__)
CORS(app)

# In-memory recipe store (for demo). In production use persistent DB.
RECIPE_STORE = {}

# === Helpers ===
def parse_json_from_text(text: str) -> Any:
    """
    Improved parser to extract JSON from model's response, handling code blocks and partial matches.
    """
    text = text.strip()
    
    # Remove code block if present
    if text.startswith('```json'):
        text = text[7:].strip()
        if text.endswith('```'):
            text = text[:-3].strip()
    elif text.startswith('```'):
        text = text[3:].strip()
        if text.endswith('```'):
            text = text[:-3].strip()
    
    try:
        return json.loads(text)
    except Exception:
        pass
    
    # Extract the first valid JSON block {} or []
    in_brace = 0
    in_bracket = 0
    in_quote = False
    escape = False
    start = -1
    for i, c in enumerate(text):
        if escape:
            escape = False
            continue
        if c == '\\':
            escape = True
            continue
        if in_quote:
            if c == '"':
                in_quote = False
            continue
        if c == '"':
            in_quote = True
            continue
        
        if c in '{[' and start == -1:
            start = i
            if c == '{':
                in_brace += 1
            else:
                in_bracket += 1
        elif c == '{':
            in_brace += 1
        elif c == '}':
            in_brace -= 1
        elif c == '[':
            in_bracket += 1
        elif c == ']':
            in_bracket -= 1
        
        if start != -1 and in_brace == 0 and in_bracket == 0:
            candidate = text[start:i+1]
            try:
                return json.loads(candidate)
            except Exception:
                start = -1  # reset and continue
    
    return None

def call_gemini_image_to_text(pil_image: Image.Image, prompt_text: str) -> str:
    """
    Use google-genai client to send an image + prompt, return text.
    """
    if genai_client is None:
        raise RuntimeError("Gemini client not configured (google-genai).")
    model = genai_client.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content([pil_image, prompt_text])
    return response.text if hasattr(response, "text") else str(response)

def call_gemini_text(prompt_text: str) -> str:
    """
    Use google-genai client to send a text prompt, return text.
    """
    if genai_client is None:
        raise RuntimeError("Gemini client not configured (google-genai).")
    model = genai_client.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(prompt_text)
    return response.text if hasattr(response, "text") else str(response)

def generate_recipes_from_ingredients(ingredients: List[str]) -> List[Dict[str, Any]]:
    """
    Generate recipe suggestions based on provided ingredients using Gemini.
    Falls back to sample recipes if Gemini fails.
    """
    try:
        prompt = (
            f"You are a recipe expert. Given these ingredients: {', '.join(ingredients)}, "
            "generate 3 simple recipe suggestions that primarily use these ingredients, "
            "adding minimal common pantry items if needed.\n"
            "Output strictly as JSON object with key 'recipes' containing array of 3 objects, each with:\n"
            '"title": string,\n'
            '"time": "XX min",\n'
            '"servings": "X",\n'
            '"calories": "XXX",\n'
            '"image": "single unicode emoji like 🍝",\n'
            '"ingredients": ["item1", "item2", ...],\n'
            '"instructions": ["step1", "step2", ...],\n'
            '"cuisine": "Italian",\n'
            '"difficulty": "easy",\n'
            '"costBreakdown": "Tomato: $0.50, Pasta: $1.00, Total: $4.50"  // concise estimated US prices\n'
            "No other text or explanations."
        )

        gemini_text = call_gemini_text(prompt)
        parsed = parse_json_from_text(gemini_text)
        
        if parsed:
            if isinstance(parsed, list):
                recipes = parsed
            elif isinstance(parsed, dict) and 'recipes' in parsed and isinstance(parsed['recipes'], list):
                recipes = parsed['recipes']
            else:
                raise ValueError("Invalid Gemini response format")
            
            if len(recipes) == 3:
                for recipe in recipes:
                    recipe["id"] = str(uuid.uuid4())
                    RECIPE_STORE[recipe["id"]] = recipe
                return recipes
            else:
                raise ValueError("Expected exactly 3 recipes")
        else:
            raise ValueError("Failed to parse Gemini response")

    except Exception as e:
        traceback.print_exc()
        # Fallback to sample recipes if Gemini fails
        print("Falling back to sample recipes due to error:", str(e))
        recipes = [
            {
                "id": str(uuid.uuid4()),
                "title": "Quick Pasta Primavera",
                "time": "20 min",
                "servings": "2",
                "calories": "380",
                "image": "🍝",
                "ingredients": ingredients[:3],  # Use first 3 ingredients
                "instructions": [
                    "Boil pasta according to package instructions",
                    f"Sauté {', '.join(ingredients[:3])} in olive oil",
                    "Combine pasta with sautéed vegetables",
                    "Season with salt and pepper to taste"
                ],
                "cuisine": "Italian",
                "difficulty": "easy",
                "costBreakdown": "Pasta: $1.00, Vegetables: $2.00, Total: $3.00"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Vegetable Stir Fry",
                "time": "15 min",
                "servings": "3",
                "calories": "290",
                "image": "🥢",
                "ingredients": ingredients,  # Use all ingredients
                "instructions": [
                    f"Chop {', '.join(ingredients)} into bite-sized pieces",
                    "Heat oil in a wok or large pan",
                    "Add vegetables and stir-fry for 5-7 minutes",
                    "Add soy sauce and serve with rice"
                ],
                "cuisine": "Asian",
                "difficulty": "easy",
                "costBreakdown": "Vegetables: $3.00, Soy sauce: $0.50, Total: $3.50"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Garden Salad",
                "time": "10 min",
                "servings": "2",
                "calories": "180",
                "image": "🥗",
                "ingredients": ingredients,  # Use all ingredients
                "instructions": [
                    f"Wash and chop {', '.join(ingredients)}",
                    "Combine in a large bowl",
                    "Drizzle with olive oil and vinegar",
                    "Season with salt and pepper"
                ],
                "cuisine": "Mediterranean",
                "difficulty": "easy",
                "costBreakdown": "Vegetables: $2.00, Dressing: $0.50, Total: $2.50"
            }
        ]
        
        # Store fallback recipes
        for recipe in recipes:
            RECIPE_STORE[recipe["id"]] = recipe
        
        return recipes

# === Endpoint implementations ===

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"success": True, "message": "fridge backend running"}), 200

@app.route("/fridge/photo", methods=["POST"])
def fridge_photo():
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
            "You are an expert in food recognition. Analyze the image provided and:\n"
            "1) Identify all food items and ingredients visible in the image.\n"
            "2) Return a JSON array of ingredient names only (no quantities or descriptions).\n"
            "3) Be specific but concise with ingredient names (e.g., 'tomatoes' not 'red tomatoes').\n"
            "4) Do not include any cookware, utensils, or non-food items.\n"
            "5) Format the response as a valid JSON array of strings only.\n"
            "Example response: [\"tomatoes\", \"onions\", \"bell peppers\", \"chicken\"]\n"
        )

        # Call Gemini vision (image + prompt)
        gemini_text = ""
        try:
            gemini_text = call_gemini_image_to_text(pil_image, prompt)
        except Exception as e:
            # If Gemini not available, fallback to placeholder
            traceback.print_exc()
            return jsonify({"success": False, "error": f"Gemini vision failed: {str(e)}"}), 500

        # Parse ingredients
        parsed = parse_json_from_text(gemini_text)
        if isinstance(parsed, list):
            ingredients = [str(item).strip() for item in parsed if item]
        else:
            # Fallback parsing
            try:
                ingredients = json.loads(gemini_text)
            except:
                m = re.search(r"(\[(?:.|\n)*\])", gemini_text)
                if m:
                    try:
                        ingredients = json.loads(m.group(1))
                    except:
                        ingredients = []
                else:
                    ingredients = [item.strip() for item in gemini_text.split(',') if item.strip()]

        # Generate recipe suggestions based on ingredients
        recipes = generate_recipes_from_ingredients(ingredients)

        return jsonify({
            "success": True, 
            "ingredients": ingredients,
            "recipes": recipes
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/fridge/text", methods=["POST"])
def fridge_text():
    try:
        data = request.get_json(force=True)
        if not data or "ingredients" not in data:
            return jsonify({"success": False, "error": "Missing 'ingredients' in request body"}), 400

        ingredients = data["ingredients"]
        if not isinstance(ingredients, list) or not ingredients:
            return jsonify({"success": False, "error": "Ingredients must be a non-empty array"}), 400

        # Generate recipe suggestions based on ingredients
        recipes = generate_recipes_from_ingredients(ingredients)

        return jsonify({
            "success": True, 
            "ingredients": ingredients,
            "recipes": recipes
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/fridge/recipe/<recipe_id>", methods=["GET"])
def get_recipe(recipe_id):
    recipe = RECIPE_STORE.get(recipe_id)
    if not recipe:
        return jsonify({"success": False, "error": "Recipe not found"}), 404
    return jsonify({"success": True, "recipe": recipe}), 200

# === Run ===
if __name__ == "__main__":
    # For dev only; use proper WSGI in prod
    app.run(host="0.0.0.0", port=8001, debug=True)