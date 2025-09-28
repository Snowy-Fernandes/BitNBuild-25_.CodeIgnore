# chatbot.py
import os
import json
import requests
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import logging
from typing import Dict, List, Any
import re
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask blueprint
chatbot_bp = Blueprint('chatbot', __name__)

class AIService:
    """Unified AI service handler"""
    
    def __init__(self):
        self.clients = {}
        self.setup_clients()
    
    def setup_clients(self):
        """Setup all available AI clients"""
        # Gemini
        gemini_key = os.getenv('GEMINI_API_KEY')
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                self.clients['gemini'] = genai.GenerativeModel('gemini-pro')
                logger.info("✅ Gemini client initialized")
            except Exception as e:
                logger.error(f"❌ Gemini setup failed: {e}")
        
        # Groq
        groq_key = os.getenv('GROQ_API_KEY')
        if groq_key:
            try:
                from groq import Groq
                self.clients['groq'] = Groq(api_key=groq_key)
                logger.info("✅ Groq client initialized")
            except Exception as e:
                logger.error(f"❌ Groq setup failed: {e}")
        
        # OpenAI (fallback)
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            try:
                import openai
                openai.api_key = openai_key
                self.clients['openai'] = openai
                logger.info("✅ OpenAI client initialized")
            except Exception as e:
                logger.error(f"❌ OpenAI setup failed: {e}")
    
    def get_response(self, prompt: str, context: str = "") -> str:
        """Get response from available AI services"""
        # Try Gemini first (most capable for food/nutrition)
        if 'gemini' in self.clients:
            try:
                return self._get_gemini_response(prompt, context)
            except Exception as e:
                logger.error(f"Gemini request failed: {e}")
        
        # Try Groq second (fastest)
        if 'groq' in self.clients:
            try:
                return self._get_groq_response(prompt, context)
            except Exception as e:
                logger.error(f"Groq request failed: {e}")
        
        # Try OpenAI as fallback
        if 'openai' in self.clients:
            try:
                return self._get_openai_response(prompt, context)
            except Exception as e:
                logger.error(f"OpenAI request failed: {e}")
        
        # Final fallback
        return self._get_fallback_response(prompt)
    
    def _get_gemini_response(self, prompt: str, context: str) -> str:
        """Get response from Gemini"""
        full_prompt = f"""
        You are a expert nutritionist, chef, and food scientist. Provide accurate, helpful information about food, nutrition, and cooking.

        CONTEXT: {context}
        USER QUESTION: {prompt}

        IMPORTANT INSTRUCTIONS:
        - Be specific and scientific when discussing food combinations
        - Mention health implications clearly
        - Use emojis to make it engaging 🍎👨‍🍳
        - Format with clear sections using **bold** text
        - Provide practical advice
        - If something is harmful, explain why clearly
        - If something is beneficial, explain the benefits

        For food combination questions (like mixing drinks/foods):
        - Explain the chemical reactions
        - Mention digestive impacts
        - Suggest alternatives if needed
        - Give practical recommendations

        Current question: {prompt}
        """
        
        response = self.clients['gemini'].generate_content(full_prompt)
        return response.text
    
    def _get_groq_response(self, prompt: str, context: str) -> str:
        """Get response from Groq"""
        full_prompt = f"""
        You are a nutrition and cooking expert. Answer this food-related question accurately.

        Context: {context}
        Question: {prompt}

        Provide a detailed, well-formatted response with emojis. Be specific about:
        - Nutritional facts
        - Health implications
        - Practical cooking advice
        - Safety considerations

        Format with clear sections using **bold** text.
        """
        
        response = self.clients['groq'].chat.completions.create(
            messages=[{"role": "user", "content": full_prompt}],
            model="llama3-8b-8192",
            temperature=0.7,
            max_tokens=1500
        )
        
        return response.choices[0].message.content
    
    def _get_openai_response(self, prompt: str, context: str) -> str:
        """Get response from OpenAI"""
        try:
            response = self.clients['openai'].ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a expert nutritionist and chef. Provide accurate food and nutrition advice."},
                    {"role": "user", "content": f"Context: {context}\nQuestion: {prompt}\n\nProvide detailed response with emojis and clear formatting."}
                ],
                max_tokens=1500,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI error: {e}")
    
    def _get_fallback_response(self, prompt: str) -> str:
        """High-quality fallback responses"""
        prompt_lower = prompt.lower()
        
        # Food combination responses
        if any(word in prompt_lower for word in ['sprite', 'soda', 'soft drink']):
            if any(word in prompt_lower for word in ['milk', 'dairy']):
                return """
🥛 **Sprite with Milk: Not Recommended**

**What happens when you mix Sprite and milk?**
- 🧪 **Chemical Reaction:** The acidity of Sprite (pH ~3.3) causes milk proteins to curdle
- 🤢 **Digestive Issues:** Can cause stomach discomfort, bloating, and digestive problems
- 🚫 **Taste & Texture:** Creates an unappealing curdled mixture

**Health Implications:**
- 📉 **Nutrient Loss:** Curdling reduces nutrient absorption
- 🔥 **Acidity:** High acid content can harm tooth enamel
- 🤕 **Digestive Discomfort:** May cause gas and indigestion

**Better Alternatives:**
• Milk with flavored syrups 🍫
• Smoothies with fruits 🍓
• Yogurt-based drinks 🥤

**Recommendation:** Avoid mixing carbonated soft drinks with dairy products.
"""

        # Nutrition questions
        if any(word in prompt_lower for word in ['nutrition', 'healthy', 'calorie']):
            return """
🥗 **Nutrition Guidance**

For accurate nutrition information, I recommend:
- Consulting registered dietitians
- Using food databases (USDA, MyFitnessPal)
- Reading nutrition labels carefully
- Considering individual dietary needs

**Quick Tips:**
• Focus on whole foods 🍎
• Balance macronutrients ⚖️
• Stay hydrated 💧
• Practice portion control 📊
"""

        # Recipe questions
        if any(word in prompt_lower for word in ['recipe', 'cook', 'make']):
            return """
👨‍🍳 **Recipe Assistance**

I'd love to help with recipes! Please ask about specific dishes like:
- "How to make chicken curry?" 🍛
- "Easy pasta recipes" 🍝
- "Healthy salad ideas" 🥗
- "Baking tips for beginners" 🧁

**Pro Tip:** Be specific about ingredients and dietary preferences!
"""

        # General high-quality response
        return f"""
🤖 **Culinary Assistant**

I understand you're asking about: **"{prompt}"**

🔧 **AI Services Status:** Currently initializing advanced features

💡 **For immediate assistance:**
- Use our dedicated app features for specific tasks
- Consult food safety guidelines
- Speak with nutrition professionals

🌐 **Quick Tip:** Most food questions can be answered by:
- Food science resources
- Nutrition databases  
- Certified dietitians

**I'll be fully operational soon with advanced AI capabilities!**
"""

# Initialize AI service
ai_service = AIService()

# Enhanced web search with better food sources
def search_food_info(query: str) -> str:
    """Search for food-specific information"""
    try:
        from duckduckgo_search import DDGS
        ddgs = DDGS()
        
        # Food-specific search queries
        searches = [
            f"{query} nutrition facts",
            f"{query} food science",
            f"{query} health effects"
        ]
        
        results = []
        for search_query in searches:
            try:
                search_results = list(ddgs.text(search_query, max_results=2))
                for result in search_results:
                    if any(keyword in result['title'].lower() for keyword in ['nutrition', 'health', 'food', 'diet']):
                        results.append(f"📚 {result['title']}: {result['body']}")
            except:
                continue
        
        return "\n".join(results[:3]) if results else ""
    except Exception as e:
        logger.error(f"Search error: {e}")
        return ""

# Enhanced intent detection with food-specific patterns
INTENT_PATTERNS = {
    'nutrition_analysis': [
        r'nutrition.*food', r'calories.*dish', r'nutrients.*meal',
        r'health.*benefits', r'food.*analysis', r'analyze.*nutrition',
        r'what.*nutrition', r'how.*healthy', r'food.*value', r'drink.*nutrition'
    ],
    'fridge_ingredients': [
        r'fridge.*ingredients', r'ingredients.*fridge', r'what.*make.*ingredients',
        r'recipe.*ingredients', r'cook.*ingredients', r'make.*ingredients',
        r'what.*cook.*fridge', r'ingredients.*have', r'fridge.*what.*make'
    ],
    'recipe_extraction': [
        r'recipe.*dish', r'how.*make.*dish', r'cooking.*instructions',
        r'restaurant.*recipe', r'dish.*recipe', r'how.*cook',
        r'preparation.*steps', r'cooking.*method', r'make.*recipe'
    ],
    'diet_plan': [
        r'diet.*plan', r'weekly.*diet', r'meal.*plan',
        r'food.*schedule', r'eating.*plan', r'nutrition.*plan',
        r'weekly.*menu', r'diet.*schedule', r'meal.*prep'
    ],
    'food_safety': [
        r'safe.*eat', r'can.*eat', r'is.*safe', r'food.*safety',
        r'healthy.*drink', r'can.*drink', r'mix.*food', r'food.*combination'
    ]
}

def detect_intent(text: str) -> str:
    """Enhanced intent detection for food questions"""
    text_lower = text.lower()
    
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return intent
    
    return 'general_query'

@chatbot_bp.route('/chatbot/message', methods=['POST', 'OPTIONS'])
@cross_origin()
def chat_message():
    """Enhanced chatbot endpoint with proper AI integration"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200
            
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Request must be JSON'
            }), 400
            
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
            
        message = data.get('message', '').strip()
        language = data.get('language', 'en')
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            }), 400
        
        logger.info(f"Received message: {message} in language: {language}")
        
        # Detect intent
        intent = detect_intent(message)
        logger.info(f"Detected intent: {intent}")
        
        # Get web context for food-related queries
        web_context = ""
        if intent in ['general_query', 'food_safety', 'nutrition_analysis']:
            web_context = search_food_info(message)
            if web_context:
                logger.info(f"Found web context: {web_context[:100]}...")
        
        # Generate AI response
        start_time = time.time()
        ai_response = ai_service.get_response(message, web_context)
        response_time = time.time() - start_time
        
        logger.info(f"AI response generated in {response_time:.2f}s")
        
        # Handle specific intents with redirects
        redirect_target = None
        if intent == 'nutrition_analysis':
            redirect_target = 'extract-nutrition'
        elif intent == 'fridge_ingredients':
            redirect_target = 'fridge'
        elif intent == 'recipe_extraction':
            redirect_target = 'extract-recipe'
        elif intent == 'diet_plan':
            redirect_target = 'diet-plan'
        
        response_data = {
            'success': True,
            'response': ai_response,
            'redirect': redirect_target,
            'intent': intent,
            'response_time': f"{response_time:.2f}s",
            'ai_services_available': len(ai_service.clients) > 0
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'fallback_response': "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."
        }), 500

@chatbot_bp.route('/chatbot/health', methods=['GET'])
@cross_origin()
def health_check():
    """Enhanced health check with AI service status"""
    ai_status = {
        'gemini_available': 'gemini' in ai_service.clients,
        'groq_available': 'groq' in ai_service.clients,
        'openai_available': 'openai' in ai_service.clients,
        'total_services': len(ai_service.clients),
        'status': 'operational' if ai_service.clients else 'limited'
    }
    
    return jsonify({
        'success': True,
        'service': 'Culinary AI Assistant',
        'ai_services': ai_status,
        'timestamp': time.time()
    })

@chatbot_bp.route('/chatbot/test', methods=['POST'])
@cross_origin()
def test_ai():
    """Test AI service with food-related question"""
    try:
        data = request.get_json() or {}
        test_message = data.get('message', 'Is it safe to mix milk and soda?')
        
        start_time = time.time()
        response = ai_service.get_response(test_message)
        response_time = time.time() - start_time
        
        return jsonify({
            'success': True,
            'test_message': test_message,
            'response': response,
            'response_time': f"{response_time:.2f}s",
            'ai_services_used': list(ai_service.clients.keys())
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Initialize app function
def init_app(app):
    """Initialize the chatbot module with the Flask app"""
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    
    # Log initialization status
    ai_count = len(ai_service.clients)
    if ai_count > 0:
        logger.info(f"✅ Chatbot initialized with {ai_count} AI services: {list(ai_service.clients.keys())}")
    else:
        logger.warning("⚠️ Chatbot running in limited mode - no AI services available")
        logger.info("💡 Set GEMINI_API_KEY or GROQ_API_KEY environment variables for full functionality")

# Test the AI service when module loads
if __name__ == '__main__':
    # Test the AI service
    test_question = "Can I mix sprite and milk? What happens?"
    print("🧪 Testing AI service...")
    print(f"❓ Question: {test_question}")
    
    start_time = time.time()
    response = ai_service.get_response(test_question)
    response_time = time.time() - start_time
    
    print(f"✅ Response ({response_time:.2f}s):")
    print(response)
    print(f"🔧 AI Services available: {list(ai_service.clients.keys())}")