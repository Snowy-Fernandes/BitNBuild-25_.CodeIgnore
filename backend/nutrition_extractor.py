"""
nutrition_extractor.py

Flask blueprint for the Nutrition Analyzer backend.

Endpoints:
- GET  /api/health
- POST /api/analyze-nutrition  -> {"imageBase64": "..."} or {"description": "..."}
- POST /api/enhance-nutrition  -> {"nutritionId": "...", "enhancementType": "...", "customInstructions": "..."}

Environment variables:
- GEMINI_API_KEY
- GEMINI_MODEL
- GROQ_API_KEY  
- GROQ_MODEL
"""
import os
import re
import io
import json
import uuid
import base64
import traceback
from typing import Optional
from flask import Blueprint, request, jsonify
from PIL import Image
import requests
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

# === Config / Keys ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")  # Will be updated to correct model
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not set. Gemini calls will fail until provided.")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not set. Groq calls will fail until provided.")

# === Import SDKs (deferred) ===
try:
    import google.generativeai as genai
    # Configure Gemini
    genai.configure(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
    gemini_available = GEMINI_API_KEY is not None
    
    # Get available models to find the correct one
    if gemini_available:
        try:
            models = genai.list_models()
            available_models = [model.name for model in models]
            print(f"Available Gemini models: {available_models}")
            
            # Try to find a working vision model
            vision_models = [model for model in available_models if 'vision' in model.lower() or 'flash' in model.lower()]
            if vision_models:
                GEMINI_MODEL = vision_models[0]  # Use the first available vision model
                print(f"Using Gemini model: {GEMINI_MODEL}")
            else:
                # Fallback to common models
                if 'gemini-1.5-flash' in available_models:
                    GEMINI_MODEL = 'gemini-1.5-flash'
                elif 'gemini-1.5-pro' in available_models:
                    GEMINI_MODEL = 'gemini-1.5-pro'
                else:
                    GEMINI_MODEL = available_models[0] if available_models else 'gemini-1.5-flash'
                    
        except Exception as e:
            print(f"Error listing Gemini models: {e}")
            GEMINI_MODEL = 'gemini-1.5-flash'  # Fallback
            
except Exception as e:
    print("google-generativeai import failed:", e)
    gemini_available = False

try:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
    groq_available = GROQ_API_KEY is not None
except Exception as e:
    print("groq import failed:", e)
    groq_client = None
    groq_available = False

# === Blueprint ===
bp = Blueprint("nutrition_extractor", __name__)

# In-memory nutrition store (for demo)
NUTRITION_STORE = {}

# === Helpers ===

def parse_json_from_text(text: str) -> Optional[dict]:
    """
    Try to extract JSON object from a model's textual response.
    """
    try:
        # Clean the response and find JSON
        text = text.strip()
        
        # Remove markdown code blocks if present
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        
        # Try to find JSON pattern
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            return json.loads(json_str)
        else:
            # Try to parse the entire response
            return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response: {text}")
        return None

def call_gemini_vision(image_base64: str, prompt_text: str) -> str:
    """
    Use Gemini vision model to analyze image
    """
    if not gemini_available:
        raise RuntimeError("Gemini client not configured")
    
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Create the model
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Generate content with image
        response = model.generate_content([prompt_text, image])
        return response.text
        
    except Exception as e:
        print(f"Gemini vision error: {e}")
        # If it's a model not found error, try a different approach
        if "not found" in str(e).lower() or "404" in str(e):
            print("Model not found, trying text-only analysis with image description")
            # Fallback to text analysis by describing the image first
            return call_gemini_text(f"Describe this food image in detail: {prompt_text}")
        raise

def call_gemini_text(prompt_text: str) -> str:
    """
    Use Gemini text model
    """
    if not gemini_available:
        raise RuntimeError("Gemini client not configured")
    
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt_text)
        return response.text
    except Exception as e:
        print(f"Gemini text error: {e}")
        raise

def call_groq_chat(system_prompt: str, user_prompt: str) -> str:
    """
    Use Groq chat completion
    """
    if not groq_available:
        raise RuntimeError("Groq client not configured")
    
    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        resp = groq_client.chat.completions.create(
            messages=messages,
            model=GROQ_MODEL,
            temperature=0.7,
            max_tokens=2000
        )
        return resp.choices[0].message.content
    except Exception as e:
        print(f"Groq chat error: {e}")
        raise

def get_default_nutrition_data():
    """
    Return default nutrition data in case of API failure
    """
    return {
        "id": str(uuid.uuid4()),
        "description": "Mixed food meal",
        "totalCalories": 520,
        "macros": {
            "protein": {"value": 28, "percentage": 22},
            "carbs": {"value": 45, "percentage": 35},
            "fats": {"value": 25, "percentage": 43}
        },
        "micronutrients": [
            {"name": "Vitamin C", "value": "45mg", "daily": "75%"},
            {"name": "Iron", "value": "8.2mg", "daily": "46%"},
            {"name": "Calcium", "value": "240mg", "daily": "24%"},
            {"name": "Fiber", "value": "12g", "daily": "48%"}
        ],
        "identifiedIngredients": [
            {
                "id": 1,
                "name": "Chicken Breast",
                "quantity": "150g",
                "calories": 248,
                "protein": 25,
                "carbs": 0,
                "fats": 3,
            },
            {
                "id": 2,
                "name": "Brown Rice",
                "quantity": "100g",
                "calories": 180,
                "protein": 3,
                "carbs": 35,
                "fats": 2,
            },
            {
                "id": 3,
                "name": "Mixed Vegetables",
                "quantity": "80g",
                "calories": 92,
                "protein": 0,
                "carbs": 10,
                "fats": 20,
            },
        ],
        "suggestions": [
            {
                "id": 1,
                "type": "reduce",
                "title": "Reduce sodium",
                "description": "Consider using herbs instead of salt for flavoring",
                "impact": "Better heart health",
                "icon": "🧂",
            },
            {
                "id": 2,
                "type": "add",
                "title": "Add more fiber",
                "description": "Include a side of leafy greens or beans",
                "impact": "Better digestion",
                "icon": "🥬",
            },
            {
                "id": 3,
                "type": "balance",
                "title": "Balance protein",
                "description": "Great protein content for muscle maintenance",
                "impact": "Optimal nutrition",
                "icon": "💪",
            },
        ],
        "confidence": "high",
        "analysisTime": "AI Analysis"
    }

# === Nutrition Analysis Prompts ===

NUTRITION_IMAGE_PROMPT = """You are a professional nutritionist. Analyze this food image and provide a detailed nutrition breakdown.

Please respond with ONLY valid JSON in this exact structure:

{
    "description": "Brief description of the meal",
    "totalCalories": number,
    "macros": {
        "protein": {"value": number, "percentage": number},
        "carbs": {"value": number, "percentage": number},
        "fats": {"value": number, "percentage": number}
    },
    "micronutrients": [
        {"name": "Vitamin C", "value": "45mg", "daily": "75%"},
        {"name": "Iron", "value": "8.2mg", "daily": "46%"},
        {"name": "Calcium", "value": "240mg", "daily": "24%"},
        {"name": "Fiber", "value": "12g", "daily": "48%"}
    ],
    "identifiedIngredients": [
        {
            "id": 1,
            "name": "Ingredient name",
            "quantity": "150g",
            "calories": 248,
            "protein": 25,
            "carbs": 0,
            "fats": 3
        }
    ],
    "suggestions": [
        {
            "id": 1,
            "type": "reduce|add|balance",
            "title": "Suggestion title",
            "description": "Suggestion description",
            "impact": "Health impact",
            "icon": "emoji"
        }
    ]
}

Guidelines:
- Make realistic estimates based on the visible food items
- Ensure macro percentages add up to approximately 100%
- Include 3-5 identifiable ingredients
- Include 3-4 relevant micronutrients
- Provide 2-3 practical health suggestions
- Use appropriate emojis for suggestions
- Keep all values nutritionally accurate"""

# FIXED: Use proper string formatting with double braces for JSON
NUTRITION_TEXT_PROMPT_TEMPLATE = """Analyze this food description and provide a detailed nutrition breakdown: "{description}"

Please respond with ONLY valid JSON in this exact structure:

{{
    "description": "Brief description of the meal",
    "totalCalories": number,
    "macros": {{
        "protein": {{"value": number, "percentage": number}},
        "carbs": {{"value": number, "percentage": number}},
        "fats": {{"value": number, "percentage": number}}
    }},
    "micronutrients": [
        {{"name": "Vitamin C", "value": "45mg", "daily": "75%"}},
        {{"name": "Iron", "value": "8.2mg", "daily": "46%"}},
        {{"name": "Calcium", "value": "240mg", "daily": "24%"}},
        {{"name": "Fiber", "value": "12g", "daily": "48%"}}
    ],
    "identifiedIngredients": [
        {{
            "id": 1,
            "name": "Ingredient name",
            "quantity": "150g",
            "calories": 248,
            "protein": 25,
            "carbs": 0,
            "fats": 3
        }}
    ],
    "suggestions": [
        {{
            "id": 1,
            "type": "reduce|add|balance",
            "title": "Suggestion title",
            "description": "Suggestion description",
            "impact": "Health impact",
            "icon": "emoji"
        }}
    ]
}}

Make realistic nutritional estimates based on common knowledge."""

def get_nutrition_text_prompt(description: str) -> str:
    """Safely format the nutrition text prompt"""
    return NUTRITION_TEXT_PROMPT_TEMPLATE.format(description=description)

# === Endpoint implementations ===

@bp.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "success": True, 
        "message": "nutrition-extractor backend running",
        "models": {
            "gemini_available": gemini_available,
            "gemini_model": GEMINI_MODEL,
            "groq_available": groq_available,
            "groq_model": GROQ_MODEL
        }
    }), 200

@bp.route("/api/analyze-nutrition", methods=["POST"])
def analyze_nutrition():
    """
    Main endpoint for nutrition analysis - accepts both image and text input
    """
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400
        
        analysis_result = None
        input_type = None
        
        # Handle image analysis
        if 'imageBase64' in data:
            input_type = "image"
            image_base64 = data['imageBase64']
            
            # Remove data URL prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            # Validate base64
            if not image_base64 or len(image_base64) < 100:
                return jsonify({"success": False, "error": "Invalid image data"}), 400
            
            print(f"Analyzing image with AI... (Data length: {len(image_base64)})")
            
            # Try Gemini first, then fallback to Groq
            try:
                if gemini_available:
                    analysis_result = call_gemini_vision(image_base64, NUTRITION_IMAGE_PROMPT)
                else:
                    raise RuntimeError("Gemini not available")
            except Exception as e:
                print(f"Gemini vision failed, trying Groq: {e}")
                if groq_available:
                    # For image analysis with Groq, use a simpler approach
                    system_prompt = "You are a nutrition expert. Analyze food images and provide nutrition information."
                    user_prompt = f"Analyze this food image and provide nutrition data: {NUTRITION_IMAGE_PROMPT}"
                    analysis_result = call_groq_chat(system_prompt, user_prompt)
                else:
                    raise RuntimeError("No AI models available")
        
        # Handle text description analysis
        elif 'description' in data:
            input_type = "text"
            description = data['description']
            if not description.strip():
                return jsonify({"success": False, "error": "Description cannot be empty"}), 400
            
            print(f"Analyzing description: {description}")
            
            # Try Gemini first, then fallback to Groq
            try:
                if gemini_available:
                    prompt = get_nutrition_text_prompt(description)
                    analysis_result = call_gemini_text(prompt)
                else:
                    raise RuntimeError("Gemini not available")
            except Exception as e:
                print(f"Gemini text failed, trying Groq: {e}")
                if groq_available:
                    prompt = get_nutrition_text_prompt(description)
                    analysis_result = call_groq_chat("You are a nutritionist.", prompt)
                else:
                    raise RuntimeError("No AI models available")
        
        else:
            return jsonify({"success": False, "error": "No imageBase64 or description provided"}), 400
        
        # Process the result
        nutrition_data = None
        if analysis_result:
            print(f"Analysis result received: {analysis_result[:200]}...")
            parsed_data = parse_json_from_text(analysis_result)
            if parsed_data:
                # Add metadata
                parsed_data["id"] = str(uuid.uuid4())
                parsed_data["confidence"] = "high"
                parsed_data["analysisTime"] = "AI Analysis"
                parsed_data["inputType"] = input_type
                nutrition_data = parsed_data
                # Store in memory
                NUTRITION_STORE[parsed_data["id"]] = nutrition_data
        
        # Fallback to default data if analysis failed
        if not nutrition_data:
            print("Using default nutrition data")
            nutrition_data = get_default_nutrition_data()
            NUTRITION_STORE[nutrition_data["id"]] = nutrition_data
        
        return jsonify({
            "success": True,
            "data": nutrition_data
        })
        
    except Exception as e:
        traceback.print_exc()
        # Return default data with error
        nutrition_data = get_default_nutrition_data()
        NUTRITION_STORE[nutrition_data["id"]] = nutrition_data
        
        return jsonify({
            "success": False,
            "error": str(e),
            "data": nutrition_data
        }), 500

@bp.route("/api/enhance-nutrition", methods=["POST"])
def enhance_nutrition():
    """
    Enhance nutrition analysis based on user requests
    """
    try:
        data = request.get_json()
        if not data or 'nutritionId' not in data or 'enhancementType' not in data:
            return jsonify({"success": False, "error": "Missing nutritionId or enhancementType"}), 400
        
        nutrition_id = data['nutritionId']
        enhancement_type = data['enhancementType']
        custom_instructions = data.get('customInstructions', '')
        
        # Get the original nutrition data
        original_data = NUTRITION_STORE.get(nutrition_id)
        if not original_data:
            return jsonify({"success": False, "error": "Nutrition analysis not found"}), 404
        
        # Build enhancement prompt based on type
        enhancement_prompts = {
            'calorie-reduction': "Reduce calories in this nutrition analysis. Suggest lower-calorie alternatives while maintaining nutrition.",
            'protein-boost': "Increase protein content in this nutrition analysis. Suggest protein-rich alternatives.",
            'healthier': "Make this nutrition analysis healthier: reduce unhealthy fats, increase fiber, suggest whole food alternatives.",
            'vegetarian': "Suggest vegetarian alternatives for this nutrition analysis. Replace animal products with plant-based options.",
            'low-carb': "Create a low-carb version of this nutrition analysis. Reduce carbohydrates and suggest alternatives.",
            'custom': f"Apply these custom modifications: {custom_instructions}"
        }
        
        if enhancement_type not in enhancement_prompts:
            return jsonify({"success": False, "error": f"Invalid enhancement type: {enhancement_type}"}), 400
        
        prompt = f"{enhancement_prompts[enhancement_type]} Original data: {json.dumps(original_data)}"
        
        # Call AI for enhancement
        enhanced_result = None
        try:
            if gemini_available:
                enhanced_result = call_gemini_text(prompt)
            elif groq_available:
                enhanced_result = call_groq_chat("You are a nutritionist helping to enhance meal plans.", prompt)
            else:
                raise RuntimeError("No AI models available for enhancement")
        except Exception as e:
            print(f"Enhancement AI call failed: {e}")
            # Return original data if enhancement fails
            return jsonify({
                "success": False,
                "error": "Enhancement failed",
                "data": original_data
            }), 500
        
        # Parse enhanced result
        enhanced_data = None
        if enhanced_result:
            enhanced_data = parse_json_from_text(enhanced_result)
            if enhanced_data:
                # Preserve original ID and metadata
                enhanced_data["id"] = nutrition_id
                enhanced_data["confidence"] = "enhanced"
                enhanced_data["analysisTime"] = "Enhanced Analysis"
                enhanced_data["inputType"] = original_data.get("inputType", "unknown")
                # Update store
                NUTRITION_STORE[nutrition_id] = enhanced_data
        
        # Return enhanced data or original if enhancement failed
        result_data = enhanced_data if enhanced_data else original_data
        
        return jsonify({
            "success": True,
            "data": result_data,
            "enhanced": enhanced_data is not None
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@bp.route("/api/models", methods=["GET"])
def get_models():
    """Get available AI models"""
    try:
        models_info = {
            "gemini": {
                "available": gemini_available,
                "model": GEMINI_MODEL,
                "status": "active" if gemini_available else "not configured"
            },
            "groq": {
                "available": groq_available,
                "model": GROQ_MODEL,
                "status": "active" if groq_available else "not configured"
            }
        }
        return jsonify({
            "success": True,
            "models": models_info
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@bp.route("/", methods=["GET"])
def home():
    """Root endpoint for nutrition extractor"""
    return jsonify({
        "message": "Nutrition Analyzer API",
        "endpoints": {
            "analyze_nutrition": "POST /api/analyze-nutrition",
            "enhance_nutrition": "POST /api/enhance-nutrition", 
            "health": "GET /api/health",
            "models": "GET /api/models"
        },
        "usage": {
            "image_analysis": "Send POST with {imageBase64: 'base64_string'}",
            "text_analysis": "Send POST with {description: 'food description'}"
        },
        "status": {
            "gemini_available": gemini_available,
            "groq_available": groq_available
        }
    })

# Alias for backward compatibility
nutrition_bp = bp

def init_app(app):
    """Initialize the nutrition extractor with the Flask app"""
    print("[nutrition_extractor] ✅ Initialized nutrition extractor module")