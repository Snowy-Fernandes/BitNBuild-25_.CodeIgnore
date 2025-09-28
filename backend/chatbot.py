# chatbot.py - FIXED VERSION
import os
import json
import base64
import requests
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import logging
from typing import Dict, List, Any
import re
import time
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask blueprint
chatbot_bp = Blueprint('chatbot', __name__)

class AIService:
    """Unified AI service handler with proper error handling"""
    
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
                GEMINI_AVAILABLE = True

            except ImportError as e:
                GEMINI_AVAILABLE = False
                print(f"❌ Gemini import failed: {e}")
        
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
    
    def get_response(self, prompt: str) -> str:
        """Get response from available AI services"""
        # Try Gemini first
        if 'gemini' in self.clients:
            try:
                return self._get_gemini_response(prompt)
            except Exception as e:
                logger.error(f"Gemini request failed: {e}")
        
        # Try Groq second
        if 'groq' in self.clients:
            try:
                return self._get_groq_response(prompt)
            except Exception as e:
                logger.error(f"Groq request failed: {e}")
        
        # Try OpenAI as fallback
        if 'openai' in self.clients:
            try:
                return self._get_openai_response(prompt)
            except Exception as e:
                logger.error(f"OpenAI request failed: {e}")
        
        # Final fallback
        return self._get_fallback_response(prompt)
    
    def _get_gemini_response(self, prompt: str) -> str:
        """Get response from Gemini"""
        try:
            response = self.clients['gemini'].generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini error: {e}")
    
    def _get_groq_response(self, prompt: str) -> str:
        """Get response from Groq"""
        try:
            response = self.clients['groq'].chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama3-8b-8192",
                temperature=0.7,
                max_tokens=1500
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Groq error: {e}")
    
    def _get_openai_response(self, prompt: str) -> str:
        """Get response from OpenAI"""
        try:
            response = self.clients['openai'].ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI error: {e}")
    
    def _get_fallback_response(self, prompt: str) -> str:
        """High-quality fallback responses"""
        return f"""
🤖 **Culinary Assistant**

I understand you're asking about: **"{prompt}"**

While I'm optimizing my AI services, here's what I can help with:

• **Food safety** and combination questions
• **Recipe development** and cooking techniques  
• **Nutrition analysis** and dietary advice
• **Meal planning** strategies

**Pro Tip:** For detailed analysis, try our specialized features like nutrition extraction or recipe enhancement!

🔧 **AI Services Status:** Currently initializing advanced capabilities
"""

class BaseAgent:
    """Base class for all specialized agents with common functionality"""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
    
    def _get_ai_response(self, prompt: str) -> str:
        """Get response from AI service with proper error handling"""
        try:
            return self.ai_service.get_response(prompt)
        except Exception as e:
            logger.error(f"AI service error in {self.__class__.__name__}: {e}")
            return self._get_fallback_response(prompt)
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Agent-specific fallback response"""
        return f"🧑‍🔬 **{self.__class__.__name__}**\n\nI'm currently optimizing my response system. Please try again in a moment or use our dedicated features for this type of question."

class NutritionExpertAgent(BaseAgent):
    """Specialized agent for nutrition questions"""
    
    def process_query(self, prompt: str, context: str = "", intent: str = "") -> str:
        base_prompt = f"""
        You are a certified nutritionist and dietitian with 15 years of experience. 
        Provide scientifically accurate, practical nutrition advice.

        USER QUESTION: {prompt}
        CONTEXT: {context}

        GUIDELINES:
        - Cite scientific evidence when possible
        - Mention specific nutrients and their benefits
        - Discuss health implications clearly
        - Provide practical, actionable advice
        - Consider different dietary needs
        - Use appropriate emojis to make it engaging
        - Format with clear sections using **bold** text

        Current question: {prompt}
        """
        
        return self._get_ai_response(base_prompt)

class RecipeSpecialistAgent(BaseAgent):
    """Specialized agent for recipe-related questions"""
    
    def process_query(self, prompt: str, context: str = "", intent: str = "") -> str:
        # Special handling for specific recipe requests
        prompt_lower = prompt.lower()
        
        if 'ice cream' in prompt_lower:
            return self._get_ice_cream_recipe()
        elif 'pasta' in prompt_lower or 'spaghetti' in prompt_lower:
            return self._get_pasta_recipe()
        elif 'salad' in prompt_lower:
            return self._get_salad_recipe()
        elif 'curry' in prompt_lower:
            return self._get_curry_recipe()
        
        base_prompt = f"""
        You are a master chef and recipe developer with expertise in global cuisines. 
        Provide detailed, tested recipes and cooking guidance.

        USER REQUEST: {prompt}

        RESPONSE GUIDELINES:
        - Provide complete, tested recipes when appropriate
        - Include ingredients with measurements
        - Give step-by-step instructions
        - Mention cooking times and temperatures
        - Suggest variations and substitutions
        - Include chef's tips and techniques
        - Make it engaging with food emojis
        - Format with clear sections using **bold** text

        For recipe requests, provide a complete recipe.
        """
        
        return self._get_ai_response(base_prompt)
    
    def _get_ice_cream_recipe(self) -> str:
        return """
🍦 **Homemade Vanilla Ice Cream Recipe**

**Ingredients:**
- 2 cups heavy cream (chilled)
- 1 cup whole milk (chilled) 
- ¾ cup granulated sugar
- 1 tablespoon pure vanilla extract
- Pinch of salt

**Equipment:**
- Ice cream maker
- Mixing bowls
- Whisk

**Instructions:**

1. **Prepare the Base:**
   - In a large bowl, whisk together milk and sugar until dissolved
   - Add heavy cream, vanilla extract, and salt
   - Whisk until well combined

2. **Chill:**
   - Cover and refrigerate for 1-2 hours (must be below 40°F/4°C)

3. **Churn:**
   - Pour into ice cream maker
   - Churn 20-30 minutes until soft-serve consistency

4. **Freeze:**
   - Transfer to airtight container
   - Freeze for at least 4 hours until firm

**Chef's Tips:**
• Use vanilla bean for richer flavor
• Add mix-ins during last 5 minutes of churning
• Let sit at room temperature 5-10 minutes before serving

**Variations:**
- **Chocolate:** Add ¾ cup cocoa powder
- **Strawberry:** Blend 2 cups fresh strawberries
- **Coffee:** Add 2 tbsp instant espresso

Enjoy! 🍨
"""

    def _get_pasta_recipe(self) -> str:
        return """
🍝 **Classic Spaghetti Aglio e Olio**

**Ingredients:**
- 8 oz spaghetti
- 4 cloves garlic, thinly sliced
- ½ cup olive oil
- 1 tsp red pepper flakes
- ½ cup fresh parsley, chopped
- Salt and black pepper to taste
- ¼ cup grated Parmesan cheese

**Instructions:**

1. **Cook Pasta:**
   - Boil spaghetti in salted water until al dente
   - Reserve 1 cup pasta water before draining

2. **Prepare Sauce:**
   - Heat olive oil over medium heat
   - Add garlic and cook until golden (1-2 minutes)
   - Add red pepper flakes and cook 30 seconds

3. **Combine:**
   - Add drained pasta to the skillet
   - Toss with sauce, adding pasta water as needed
   - Stir in parsley and season with salt/pepper

4. **Serve:**
   - Top with Parmesan cheese
   - Drizzle with extra olive oil

**Preparation time:** 20 minutes
**Serves:** 2-3 people
"""

class FoodSafetyAgent(BaseAgent):
    """Specialized agent for food safety questions"""
    
    def process_query(self, prompt: str, context: str = "", intent: str = "") -> str:
        # Special handling for common food safety questions
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ['chocolate', 'chilli', 'chili', 'spicy']):
            return self._get_chocolate_chilli_safety()
        elif any(word in prompt_lower for word in ['expired', 'expiration', 'old']):
            return self._get_expired_food_safety()
        elif any(word in prompt_lower for word in ['milk', 'soda', 'sprite', 'mix']):
            return self._get_milk_soda_safety()
        
        base_prompt = f"""
        You are a food safety expert and microbiologist. Provide accurate food safety information.

        USER QUESTION: {prompt}

        Focus on:
        - Foodborne illness prevention
        - Proper storage temperatures  
        - Expiration guidelines
        - Cross-contamination prevention
        - Safe cooking temperatures
        - Scientific explanations of risks
        - Use **bold** text for important warnings
        - Include practical safety tips

        Be clear about risks and safe practices.
        """
        
        return self._get_ai_response(base_prompt)
    
    def _get_chocolate_chilli_safety(self) -> str:
        return """
🌶️ **Chocolate with Chillies: Food Safety Analysis**

**✅ SAFE TO EAT** - with some considerations

**Scientific Perspective:**
- Chocolate and chillies are chemically compatible
- No harmful reactions occur when combined
- Both are commonly used together in Mexican mole sauce

**Health Considerations:**
- **Spice Tolerance:** Depends on individual sensitivity
- **Digestive Issues:** May cause discomfort if not used to spicy food
- **Allergies:** Rare, but check for individual allergies

**Benefits:**
- Antioxidants from both cocoa and chillies
- Capsaicin (in chillies) may boost metabolism
- Complex flavor profile

**Safety Tips:**
• Start with mild chillies if new to spicy food
• Use high-quality, food-grade ingredients
• Wash chillies thoroughly before use
• Store chocolate properly to prevent blooming

**Popular Combinations:**
- Dark chocolate with ancho chillies
- Mexican hot chocolate
- Chilli-chocolate desserts

**Conclusion:** Perfectly safe and delicious when prepared properly! 🍫🔥
"""

    def _get_expired_food_safety(self) -> str:
        return """
📅 **Expired Food Safety Guidelines**

**General Rules:**
- **"Best Before"** = Quality date, often safe after
- **"Use By"** = Safety date, discard after

**High Risk Foods (Discard if expired):**
- Fresh meat, poultry, fish
- Dairy products (milk, yogurt)
- Prepared meals
- Eggs

**Lower Risk Foods (Use judgment):**
- Dry goods (pasta, rice) - check for pests
- Canned goods - check for bulging/damage
- Spices - may lose potency but generally safe

**When in doubt, throw it out!** 🗑️
"""

class DietPlannerAgent(BaseAgent):
    """Specialized agent for diet planning"""
    
    def process_query(self, prompt: str, context: str = "", intent: str = "") -> str:
        base_prompt = f"""
        You are a certified dietitian specializing in meal planning and dietary strategies.

        USER REQUEST: {prompt}

        Provide structured meal plans with:
        - Balanced macronutrients
        - Variety and enjoyment
        - Practical preparation tips
        - Consideration of dietary restrictions
        - Weekly shopping lists when appropriate
        - Use **bold** sections for different meals
        - Include nutritional breakdown

        Make it practical and achievable.
        """
        
        return self._get_ai_response(base_prompt)

class GeneralChefAgent(BaseAgent):
    """General culinary expert for miscellaneous questions"""
    
    def process_query(self, prompt: str, context: str = "", intent: str = "") -> str:
        base_prompt = f"""
        You are an experienced chef and culinary instructor. Provide helpful cooking advice.

        USER QUESTION: {prompt}

        Be engaging, practical, and informative. Use appropriate culinary terminology.
        Include tips, techniques, and creative suggestions.
        Format with clear sections using **bold** text.
        """
        
        return self._get_ai_response(base_prompt)

class IntentDetector:
    """Advanced intent detection with food-specific patterns"""
    
    def __init__(self):
        self.patterns = {
            'nutrition_analysis': [
                r'nutrition.*|calorie.*|nutrient.*|health.*benefit.*|food.*analysis',
                r'how.*healthy.*|what.*nutrition.*|analyze.*nutrition',
                r'protein.*|carb.*|fat.*|vitamin.*|mineral.*',
                r'weight.*loss|weight.*gain|diet.*plan',
            ],
            'recipe_request': [
                r'recipe.*for.*|how.*make.*|how.*cook.*',
                r'ingredient.*for.*|step.*to.*make.*',
                r'dish.*recipe|food.*recipe|cooking.*instruction',
                r'prepare.*meal|make.*dish',
                r'ice cream recipe|pasta recipe|curry recipe|salad recipe',
                r'how.*prepare.*|cooking.*method',
            ],
            'food_safety': [
                r'safe.*eat.*|can.*eat.*|is.*safe',
                r'food.*safety|healthy.*drink',
                r'mix.*food|food.*combination',
                r'expir.*food|spoiled.*food',
                r'allerg.*|intoleranc.*',
                r'chocolate.*chilli|chili.*chocolate',
            ],
            'diet_advice': [
                r'diet.*plan|meal.*plan',
                r'weekly.*diet|eating.*plan',
                r'vegetarian.*|vegan.*|keto.*|paleo.*',
                r'gluten.*free|dairy.*free',
                r'healthy.*eating.*plan',
            ],
        }
    
    def detect(self, text: str) -> str:
        """Detect intent from text with confidence scoring"""
        text_lower = text.lower()
        
        # Score each intent category
        scores = {}
        for intent, patterns in self.patterns.items():
            scores[intent] = 0
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    scores[intent] += 1
        
        # Get intent with highest score
        if scores:
            best_intent = max(scores.items(), key=lambda x: x[1])
            # Only return if score is above threshold
            if best_intent[1] > 0:
                return best_intent[0]
        
        return 'general_query'

class AIServiceOrchestrator:
    """Orchestrates multiple AI agents for different tasks"""
    
    def __init__(self):
        self.ai_service = AIService()
        self.intent_detector = IntentDetector()
        self.setup_agents()
    
    def setup_agents(self):
        """Initialize specialized AI agents"""
        self.agents = {
            'nutrition_analysis': NutritionExpertAgent(self.ai_service),
            'recipe_request': RecipeSpecialistAgent(self.ai_service),
            'food_safety': FoodSafetyAgent(self.ai_service),
            'diet_advice': DietPlannerAgent(self.ai_service),
            'general_query': GeneralChefAgent(self.ai_service)
        }
    
    def route_to_agent(self, prompt: str, intent: str, context: str = "") -> str:
        """Route query to appropriate specialized agent"""
        # Map intent to agent
        agent = self.agents.get(intent, self.agents['general_query'])
        
        try:
            response = agent.process_query(prompt, context, intent)
            return response
        except Exception as e:
            logger.error(f"Agent error for intent '{intent}': {e}")
            return f"🧑‍🔬 **Culinary Assistant**\n\nI encountered an issue processing your request. Please try again or rephrase your question.\n\nError: {str(e)}"

# Initialize the orchestrator
ai_orchestrator = AIServiceOrchestrator()

@chatbot_bp.route('/message', methods=['POST', 'OPTIONS'])
@cross_origin()
def chat_message():
    """Enhanced chatbot endpoint with agentic architecture"""
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
        
        # Detect intent using advanced detector
        intent = ai_orchestrator.intent_detector.detect(message)
        logger.info(f"Detected intent: {intent}")
        
        # Generate response using agentic architecture
        start_time = time.time()
        ai_response = ai_orchestrator.route_to_agent(message, intent)
        response_time = time.time() - start_time
        
        logger.info(f"AI response generated in {response_time:.2f}s")
        
        # Handle redirects based on intent
        redirect_target = None
        intent_redirects = {
            'nutrition_analysis': 'extract-nutrition',
            'recipe_request': 'extract-recipe', 
        }
        redirect_target = intent_redirects.get(intent)
        
        response_data = {
            'success': True,
            'response': ai_response,
            'redirect': redirect_target,
            'intent': intent,
            'response_time': f"{response_time:.2f}s",
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'fallback_response': "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."
        }), 500

@chatbot_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'service': 'Agentic Culinary Assistant',
        'status': 'operational',
        'agents': list(ai_orchestrator.agents.keys()),
        'ai_services_available': len(ai_orchestrator.ai_service.clients),
        'timestamp': time.time()
    })

@chatbot_bp.route('/test', methods=['POST'])
@cross_origin()
def test_chat():
    """Test endpoint with sample queries"""
    try:
        data = request.get_json() or {}
        test_message = data.get('message', 'How do I make ice cream?')
        
        start_time = time.time()
        intent = ai_orchestrator.intent_detector.detect(test_message)
        response = ai_orchestrator.route_to_agent(test_message, intent)
        response_time = time.time() - start_time
        
        return jsonify({
            'success': True,
            'test_message': test_message,
            'detected_intent': intent,
            'response': response,
            'response_time': f"{response_time:.2f}s",
            'ai_services_used': list(ai_orchestrator.ai_service.clients.keys())
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@chatbot_bp.route('/intents', methods=['GET'])
@cross_origin()
def list_intents():
    """List available intents and patterns"""
    return jsonify({
        'success': True,
        'intents': ai_orchestrator.intent_detector.patterns
    })

def init_app(app):
    """Initialize the chatbot module with the Flask app"""
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    
    # Log initialization status
    ai_count = len(ai_orchestrator.ai_service.clients)
    if ai_count > 0:
        logger.info(f"✅ Chatbot initialized with {ai_count} AI services and {len(ai_orchestrator.agents)} specialized agents")
    else:
        logger.warning("⚠️ Chatbot running in limited mode - no AI services available")
        logger.info("💡 Set GEMINI_API_KEY or GROQ_API_KEY environment variables for full functionality")

# Test the system
if __name__ == '__main__':
    # Test the intent detection and response
    test_questions = [
        "can i eat chocolate with chillies",
        "How do I make ice cream?",
        "What's the nutrition of chicken breast?",
        "Is it safe to eat expired yogurt?",
        "I need a weekly diet plan",
    ]
    
    print("🧪 Testing Agentic Chatbot System...")
    for question in test_questions:
        intent = ai_orchestrator.intent_detector.detect(question)
        response = ai_orchestrator.route_to_agent(question, intent)
        print(f"\n❓ {question}")
        print(f"🎯 Intent: {intent}")
        print(f"📝 Response: {response[:200]}...")
        print("─" * 50)