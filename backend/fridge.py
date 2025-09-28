"""
fridge.py - Blueprint version with improved error handling
"""

import os
import re
import io
import json
import uuid
import base64
import traceback
from typing import Optional, List, Dict, Any
from flask import Blueprint, request, jsonify
from PIL import Image
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

# === Config / Keys ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")

print(f"[fridge] Gemini API Key: {'Set' if GEMINI_API_KEY else 'Not Set'}")
print(f"[fridge] Gemini Model: {GEMINI_MODEL}")

# === Import SDKs with better error handling ===
genai_client = None
try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        genai_client = genai
        print("[fridge] ✅ Gemini client configured successfully")
    else:
        print("[fridge] ⚠️  GEMINI_API_KEY not set, Gemini features disabled")
except Exception as e:
    print(f"[fridge] ❌ Failed to import google-generativeai: {e}")
    genai_client = None

# === Create Blueprint ===
fridge_bp = Blueprint('fridge_bp', __name__)

# In-memory recipe store
RECIPE_STORE = {}

# === Helpers ===
def parse_json_from_text(text: str) -> Any:
    """Improved JSON parser with better error handling"""
    if not text:
        return None
        
    text = text.strip()
    
    # Remove code blocks
    if text.startswith('```json'):
        text = text[7:].strip()
    if text.startswith('```'):
        text = text[3:].strip()
    if text.endswith('```'):
        text = text[:-3].strip()
    
    # Try direct parse first
    try:
        return json.loads(text)
    except:
        pass
    
    # Try to extract JSON from text
    try:
        # Look for array pattern
        match = re.search(r'\[[^]]*\][^]]*\]', text)
        if not match:
            match = re.search(r'\[.*\]', text, re.DOTALL)
        
        if match:
            candidate = match.group(0)
            return json.loads(candidate)
    except:
        pass
    
    return None

def call_gemini_image_to_text(pil_image: Image.Image, prompt_text: str) -> str:
    """Call Gemini vision API with error handling"""
    if genai_client is None:
        raise RuntimeError("Gemini client not available. Please check API key and installation.")
    
    try:
        model = genai_client.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content([prompt_text, pil_image])
        return response.text
    except Exception as e:
        print(f"[fridge] Gemini vision error: {e}")
        raise RuntimeError(f"Gemini API error: {str(e)}")

def call_gemini_text(prompt_text: str) -> str:
    """Call Gemini text API with error handling"""
    if genai_client is None:
        raise RuntimeError("Gemini client not available. Please check API key and installation.")
    
    try:
        model = genai_client.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt_text)
        return response.text
    except Exception as e:
        print(f"[fridge] Gemini text error: {e}")
        raise RuntimeError(f"Gemini API error: {str(e)}")

def extract_ingredients_fallback(image_description: str) -> List[str]:
    """Fallback ingredient extraction when Gemini fails"""
    # Simple keyword-based fallback
    common_ingredients = [
        'tomato', 'onion', 'garlic', 'carrot', 'potato', 'broccoli', 
        'chicken', 'beef', 'fish', 'egg', 'milk', 'cheese', 'bread',
        'rice', 'pasta', 'lettuce', 'spinach', 'bell pepper', 'mushroom',
        'lemon', 'apple', 'banana', 'orange', 'berry', 'avocado'
    ]
    
    found_ingredients = []
    for ingredient in common_ingredients:
        if ingredient in image_description.lower():
            found_ingredients.append(ingredient)
    
    return found_ingredients if found_ingredients else ['vegetables', 'produce']

def generate_sample_recipes(ingredients: List[str]) -> List[Dict[str, Any]]:
    """Generate sample recipes when Gemini is unavailable"""
    sample_recipes = [
        {
            "id": str(uuid.uuid4()),
            "title": f"Quick {ingredients[0] if ingredients else 'Vegetable'} Stir Fry",
            "time": "20 min",
            "servings": "2",
            "calories": "350",
            "image": "🍳",
            "ingredients": ingredients + ["oil", "salt", "pepper"],
            "instructions": [
                f"Prepare {', '.join(ingredients[:3])} by washing and chopping",
                "Heat oil in a pan over medium heat",
                f"Add {ingredients[0] if ingredients else 'vegetables'} and stir fry for 5-7 minutes",
                "Season with salt and pepper to taste",
                "Serve hot with rice or bread"
            ],
            "cuisine": "International",
            "difficulty": "easy",
            "costBreakdown": f"Ingredients: ${len(ingredients) * 1.5:.2f}, Total: ${len(ingredients) * 2.0:.2f}"
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"Fresh {ingredients[0] if ingredients else 'Garden'} Salad",
            "time": "10 min",
            "servings": "2",
            "calories": "180",
            "image": "🥗",
            "ingredients": ingredients + ["olive oil", "vinegar", "salt"],
            "instructions": [
                f"Wash and chop {', '.join(ingredients)}",
                "Combine in a large bowl",
                "Drizzle with olive oil and vinegar",
                "Season with salt and mix well"
            ],
            "cuisine": "Mediterranean",
            "difficulty": "easy",
            "costBreakdown": f"Ingredients: ${len(ingredients) * 1.0:.2f}, Total: ${len(ingredients) * 1.5:.2f}"
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"Simple {ingredients[0] if ingredients else 'Vegetable'} Soup",
            "time": "25 min",
            "servings": "3",
            "calories": "220",
            "image": "🍲",
            "ingredients": ingredients + ["water", "salt", "herbs"],
            "instructions": [
                f"Chop {', '.join(ingredients[:3])}",
                "Bring water to a boil in a pot",
                "Add ingredients and simmer for 15 minutes",
                "Season with salt and herbs",
                "Serve warm"
            ],
            "cuisine": "International",
            "difficulty": "easy",
            "costBreakdown": f"Ingredients: ${len(ingredients) * 0.8:.2f}, Total: ${len(ingredients) * 1.2:.2f}"
        }
    ]
    
    # Store recipes
    for recipe in sample_recipes:
        RECIPE_STORE[recipe["id"]] = recipe
    
    return sample_recipes

def generate_recipes_from_ingredients(ingredients: List[str]) -> List[Dict[str, Any]]:
    """Generate recipes using Gemini or fallback to samples"""
    if not genai_client:
        print("[fridge] Gemini not available, using sample recipes")
        return generate_sample_recipes(ingredients)
    
    try:
        prompt = f"""You are a recipe expert. Given these ingredients: {', '.join(ingredients)}, 
generate 3 simple recipe suggestions that primarily use these ingredients. 
Return ONLY valid JSON with this exact structure:

{{
  "recipes": [
    {{
      "title": "Recipe name",
      "time": "XX min",
      "servings": "X",
      "calories": "XXX",
      "image": "🍝",
      "ingredients": ["item1", "item2"],
      "instructions": ["step1", "step2"],
      "cuisine": "Italian",
      "difficulty": "easy",
      "costBreakdown": "Total: $X.XX"
    }}
  ]
}}"""

        gemini_text = call_gemini_text(prompt)
        parsed = parse_json_from_text(gemini_text)
        
        if parsed and 'recipes' in parsed:
            recipes = parsed['recipes'][:3]  # Take first 3 recipes
            for recipe in recipes:
                recipe["id"] = str(uuid.uuid4())
                RECIPE_STORE[recipe["id"]] = recipe
            return recipes
        else:
            raise ValueError("Invalid response format from Gemini")
            
    except Exception as e:
        print(f"[fridge] Recipe generation failed: {e}")
        return generate_sample_recipes(ingredients)

# === Blueprint Endpoints ===

@fridge_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "success": True, 
        "message": "fridge backend running",
        "gemini_available": genai_client is not None
    }), 200

@fridge_bp.route("/photo", methods=["POST"])
def fridge_photo():
    try:
        data = request.get_json(force=True)
        if not data or "image" not in data:
            return jsonify({"success": False, "error": "Missing 'image' in request body"}), 400

        data_uri = data["image"]
        m = re.match(r"data:(?P<mime>image/[^;]+);base64,(?P<b64>.+)$", data_uri)
        if not m:
            return jsonify({"success": False, "error": "Invalid image data URI"}), 400

        img_b64 = m.group("b64")
        img_bytes = base64.b64decode(img_b64)
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # If Gemini is not available, use fallback
        if not genai_client:
            ingredients = ['fresh vegetables', 'produce']  # Default fallback
            recipes = generate_sample_recipes(ingredients)
            return jsonify({
                "success": True, 
                "ingredients": ingredients,
                "recipes": recipes,
                "message": "Using sample data (Gemini not configured)"
            }), 200

        prompt = """Analyze this food image and list all visible ingredients. 
Return ONLY a JSON array of ingredient names, like: ["tomato", "onion", "chicken"]"""

        try:
            gemini_text = call_gemini_image_to_text(pil_image, prompt)
            parsed = parse_json_from_text(gemini_text)
            
            if isinstance(parsed, list):
                ingredients = [str(item).strip().lower() for item in parsed if item]
            else:
                # Fallback extraction
                ingredients = extract_ingredients_fallback(gemini_text)
                
        except Exception as e:
            print(f"[fridge] Image analysis failed: {e}")
            ingredients = ['mixed vegetables', 'fresh produce']
            
        # Generate recipes
        recipes = generate_recipes_from_ingredients(ingredients)

        return jsonify({
            "success": True, 
            "ingredients": ingredients,
            "recipes": recipes,
            "gemini_used": genai_client is not None
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@fridge_bp.route("/text", methods=["POST"])
def fridge_text():
    try:
        data = request.get_json(force=True)
        if not data or "ingredients" not in data:
            return jsonify({"success": False, "error": "Missing 'ingredients' in request body"}), 400

        ingredients = data["ingredients"]
        if not isinstance(ingredients, list):
            return jsonify({"success": False, "error": "Ingredients must be an array"}), 400

        if not ingredients:
            ingredients = ["vegetables", "pantry items"]  # Default

        # Generate recipes
        recipes = generate_recipes_from_ingredients(ingredients)

        return jsonify({
            "success": True, 
            "ingredients": ingredients,
            "recipes": recipes,
            "gemini_used": genai_client is not None
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@fridge_bp.route("/recipe/<recipe_id>", methods=["GET"])
def get_recipe(recipe_id):
    recipe = RECIPE_STORE.get(recipe_id)
    if not recipe:
        return jsonify({"success": False, "error": "Recipe not found"}), 404
    return jsonify({"success": True, "recipe": recipe}), 200

def init_app(app):
    """Initialize the fridge blueprint"""
    app.register_blueprint(fridge_bp, url_prefix='/fridge')
    print("[fridge] ✅ Fridge blueprint registered")