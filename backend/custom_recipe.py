# custom_recipe.py - Blueprint for AI Recipe Generator
from flask import Blueprint, request, jsonify
from flask_cors import CORS
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import os

# Create blueprint
custom_recipe_bp = Blueprint('custom_recipe', __name__)
CORS(custom_recipe_bp)

class AdvancedRecipeGenerator:
    def __init__(self, model_choice: str = "recipe"):
        self.model_choice = model_choice
        self.recipe_templates = self._load_recipe_templates()
        self.ingredient_categories = self._load_ingredient_categories()
        
    def _load_recipe_templates(self) -> Dict[str, Any]:
        """Load recipe templates for different cuisines and categories"""
        return {
            "italian": {
                "pasta": ["Spaghetti", "Penne", "Fettuccine", "Linguine", "Rigatoni"],
                "sauce": ["Marinara", "Alfredo", "Pesto", "Aglio e Olio", "Carbonara"],
                "proteins": ["Chicken", "Beef", "Shrimp", "Tofu", "Sausage"],
                "vegetables": ["Mushrooms", "Spinach", "Zucchini", "Bell Peppers", "Olives"]
            },
            "indian": {
                "base": ["Curry", "Biryani", "Masala", "Tikka", "Korma"],
                "proteins": ["Chicken", "Lamb", "Paneer", "Chickpeas", "Lentils"],
                "spices": ["Garam Masala", "Turmeric", "Cumin", "Coriander", "Cardamom"],
                "vegetables": ["Potatoes", "Cauliflower", "Spinach", "Eggplant", "Peas"]
            },
            "mexican": {
                "base": ["Tacos", "Burritos", "Quesadillas", "Enchiladas", "Fajitas"],
                "proteins": ["Chicken", "Beef", "Beans", "Carnitas", "Shrimp"],
                "toppings": ["Guacamole", "Salsa", "Sour Cream", "Cheese", "Lettuce"],
                "vegetables": ["Peppers", "Onions", "Corn", "Tomatoes", "Avocado"]
            },
            "asian": {
                "base": ["Stir Fry", "Noodle Bowl", "Rice Bowl", "Soup", "Dumplings"],
                "proteins": ["Chicken", "Beef", "Tofu", "Shrimp", "Pork"],
                "sauces": ["Soy Sauce", "Teriyaki", "Hoisin", "Oyster Sauce", "Fish Sauce"],
                "vegetables": ["Bok Choy", "Carrots", "Bell Peppers", "Snow Peas", "Mushrooms"]
            },
            "mediterranean": {
                "base": ["Salad", "Bowl", "Wrap", "Platter", "Skewers"],
                "proteins": ["Chicken", "Lamb", "Fish", "Chickpeas", "Falafel"],
                "components": ["Hummus", "Tzatziki", "Olives", "Feta", "Pita"],
                "vegetables": ["Tomatoes", "Cucumbers", "Onions", "Eggplant", "Zucchini"]
            },
            "fusion": {
                "style": ["Asian-Mexican", "Italian-Indian", "Mediterranean-Asian", "American-French"],
                "proteins": ["Tofu", "Salmon", "Chicken", "Beef", "Shrimp"],
                "sauces": ["Teriyaki", "Curry", "Pesto", "BBQ", "Soy-Ginger"],
                "vegetables": ["Bok Choy", "Asparagus", "Sweet Potatoes", "Kale", "Mushrooms"]
            }
        }
    
    def _load_ingredient_categories(self) -> Dict[str, List[str]]:
        """Load comprehensive ingredient categories for variety"""
        return {
            "proteins": [
                "chicken breast", "ground beef", "salmon", "shrimp", "tofu", "lentils", 
                "chickpeas", "black beans", "paneer", "eggs", "pork", "turkey", "tuna",
                "cod", "lamb", "bacon", "sausage", "tempeh", "seitan"
            ],
            "vegetables": [
                "spinach", "broccoli", "carrots", "bell peppers", "zucchini", "mushrooms",
                "onions", "garlic", "tomatoes", "potatoes", "sweet potatoes", "cauliflower",
                "eggplant", "asparagus", "kale", "cabbage", "green beans", "peas", "corn",
                "avocado", "cucumber", "celery", "lettuce"
            ],
            "carbs": [
                "pasta", "rice", "quinoa", "bread", "potatoes", "sweet potatoes",
                "couscous", "noodles", "tortillas", "naan", "pita bread", "oats"
            ],
            "dairy": [
                "cheese", "milk", "yogurt", "butter", "cream", "sour cream", "parmesan",
                "mozzarella", "feta", "cream cheese", "buttermilk"
            ],
            "spices": [
                "salt", "black pepper", "cumin", "coriander", "turmeric", "paprika",
                "chili powder", "garlic powder", "onion powder", "oregano", "thyme",
                "rosemary", "basil", "curry powder", "ginger", "cinnamon", "nutmeg"
            ],
            "specialty": [
                "soy sauce", "olive oil", "vinegar", "honey", "maple syrup", "mustard",
                "mayonnaise", "ketchup", "hot sauce", "worcestershire", "fish sauce"
            ]
        }
    
    def _extract_specific_ingredients(self, prompt: str) -> List[str]:
        """Extract specific ingredients mentioned in the prompt"""
        all_ingredients = []
        for category in self.ingredient_categories.values():
            all_ingredients.extend(category)
        
        found_ingredients = []
        prompt_lower = prompt.lower()
        
        for ingredient in all_ingredients:
            if ingredient in prompt_lower:
                found_ingredients.append(ingredient)
        
        # Also look for plural forms and common variations
        for ingredient in all_ingredients:
            if ingredient + "s" in prompt_lower and ingredient + "s" not in found_ingredients:
                found_ingredients.append(ingredient)
            if ingredient[:-1] in prompt_lower and ingredient[:-1] not in found_ingredients:
                found_ingredients.append(ingredient)
        
        return list(set(found_ingredients))
    
    def generate_recipe(self, prompt: str, constraints: Dict[str, str], variation_level: int = 0) -> Dict[str, Any]:
        """Generate a single recipe with specified variation level"""
        specific_ingredients = self._extract_specific_ingredients(prompt)
        
        # Determine cuisine template to use
        cuisine = constraints.get('cuisine', 'fusion')
        if cuisine not in self.recipe_templates:
            cuisine = 'fusion'
        
        templates = self.recipe_templates[cuisine]
        
        # Generate recipe title and description based on variation
        title = self._generate_recipe_title(prompt, constraints, templates, variation_level)
        description = self._generate_recipe_description(title, constraints, variation_level)
        
        # Generate recipe components with variation
        ingredients = self._generate_ingredients(specific_ingredients, templates, constraints, variation_level)
        instructions = self._generate_instructions(ingredients, constraints, variation_level)
        
        # Calculate nutritional info
        nutrition = self._calculate_nutrition(ingredients, constraints)
        
        # Generate external links
        external_links = self._generate_external_links(ingredients)
        
        # Determine variety description
        variety_descriptions = [
            "Classic preparation with your specified ingredients",
            "Creative twist with complementary flavors",
            "Innovative combination with new ingredients",
            "Fusion-style with unexpected pairings",
            "Gourmet version with premium ingredients"
        ]
        
        return {
            "id": random.randint(1000, 9999),
            "title": title,
            "time": self._generate_cook_time(constraints.get('difficulty', 'medium'), variation_level),
            "servings": random.choice(["2", "3", "4"]),
            "calories": nutrition.get('calories_per_serving', '350'),
            "image": self._get_recipe_emoji(cuisine, variation_level),
            "description": description,
            "ingredients": ingredients,
            "instructions": instructions,
            "external_links": external_links,
            "cuisine": cuisine,
            "dietary": constraints.get('dietary', 'regular'),
            "difficulty": constraints.get('difficulty', 'medium'),
            "user_specified_ingredients": specific_ingredients,
            "variety_description": variety_descriptions[variation_level] if variation_level < len(variety_descriptions) else "Unique variation",
            "nutrition": nutrition,
            "variation_level": variation_level
        }
    
    def generate_recipe_variations(self, prompt: str, constraints: Dict[str, str], num_recipes: int = 5) -> List[Dict[str, Any]]:
        """Generate multiple recipe variations with increasing creativity"""
        recipes = []
        specific_ingredients = self._extract_specific_ingredients(prompt)
        
        for i in range(num_recipes):
            # Create varied constraints for each recipe
            varied_constraints = self._create_varied_constraints(constraints, i)
            
            # Generate recipe with increasing variation
            recipe = self.generate_recipe(prompt, varied_constraints, i)
            
            # Ensure each recipe has different ingredient combinations
            if i > 0:
                recipe = self._ensure_ingredient_variation(recipe, recipes, specific_ingredients)
            
            recipes.append(recipe)
        
        return recipes
    
    def _create_varied_constraints(self, base_constraints: Dict[str, str], variation_level: int) -> Dict[str, str]:
        """Create varied constraints for different recipe variations"""
        varied = base_constraints.copy()
        
        # Vary cuisine for higher variation levels
        if variation_level >= 2:
            cuisines = list(self.recipe_templates.keys())
            current_cuisine = varied.get('cuisine', 'fusion')
            other_cuisines = [c for c in cuisines if c != current_cuisine]
            if other_cuisines:
                varied['cuisine'] = random.choice(other_cuisines)
        
        # Vary difficulty for different variations
        difficulties = ['easy', 'medium', 'hard']
        if variation_level > 0:
            current_diff = varied.get('difficulty', 'medium')
            other_difficulties = [d for d in difficulties if d != current_diff]
            if other_difficulties:
                varied['difficulty'] = random.choice(other_difficulties)
        
        return varied
    
    def _ensure_ingredient_variation(self, current_recipe: Dict[str, Any], 
                                   previous_recipes: List[Dict[str, Any]], 
                                   specified_ingredients: List[str]) -> Dict[str, Any]:
        """Ensure each recipe has different ingredient combinations"""
        current_ingredients = set(ing.lower() for ing in current_recipe['ingredients'])
        
        # Check similarity with previous recipes
        for prev_recipe in previous_recipes:
            prev_ingredients = set(ing.lower() for ing in prev_recipe['ingredients'])
            
            # If too similar, modify ingredients
            similarity = len(current_ingredients.intersection(prev_ingredients)) / len(current_ingredients.union(prev_ingredients))
            if similarity > 0.7:  # 70% similarity threshold
                current_recipe['ingredients'] = self._modify_ingredients(
                    current_recipe['ingredients'], 
                    specified_ingredients,
                    current_recipe['variation_level']
                )
                break
        
        return current_recipe
    
    def _modify_ingredients(self, current_ingredients: List[str], 
                          specified_ingredients: List[str], 
                          variation_level: int) -> List[str]:
        """Modify ingredients to create variety"""
        new_ingredients = current_ingredients.copy()
        
        # Keep specified ingredients but vary others
        specified_set = set(specified_ingredients)
        
        # Replace 1-2 non-specified ingredients based on variation level
        replacements_needed = min(2, variation_level + 1)
        
        non_specified = [ing for ing in new_ingredients 
                        if not any(spec in ing.lower() for spec in specified_set)]
        
        if non_specified and len(non_specified) >= replacements_needed:
            # Remove some non-specified ingredients
            to_remove = random.sample(non_specified, replacements_needed)
            for ing in to_remove:
                new_ingredients.remove(ing)
            
            # Add new ingredients from different categories
            categories = list(self.ingredient_categories.keys())
            for _ in range(replacements_needed):
                category = random.choice(categories)
                new_ingredient = random.choice(self.ingredient_categories[category])
                quantity = random.choice(["1", "2", "3", "1/2", "1/4"])
                unit = "cup" if "milk" in new_ingredient or "cream" in new_ingredient else ""
                new_ingredients.append(f"{quantity} {unit} {new_ingredient}".strip())
        
        return new_ingredients
    
    def _generate_recipe_title(self, prompt: str, constraints: Dict[str, str], 
                             templates: Dict, variation_level: int) -> str:
        """Generate a creative recipe title based on variation level"""
        cuisine = constraints.get('cuisine', 'fusion')
        dietary = constraints.get('dietary', 'regular')
        
        # Different title patterns based on variation level
        if variation_level == 0:
            return self._generate_classic_title(prompt, dietary, templates)
        elif variation_level == 1:
            return self._generate_creative_title(dietary, templates, "with a twist")
        elif variation_level == 2:
            return self._generate_creative_title(dietary, templates, "fusion")
        else:
            return self._generate_gourmet_title(dietary, templates)
    
    def _generate_classic_title(self, prompt: str, dietary: str, templates: Dict) -> str:
        """Generate classic title using prompt ingredients"""
        words = prompt.lower().split()
        key_ingredients = []
        
        for word in words:
            for category in self.ingredient_categories.values():
                if word in category or word + 's' in category:
                    key_ingredients.append(word)
        
        if len(key_ingredients) >= 2:
            return f"{dietary.capitalize()} {key_ingredients[0].title()} and {key_ingredients[1].title()} Delight"
        elif key_ingredients:
            return f"{dietary.capitalize()} {key_ingredients[0].title()} Special"
        else:
            return f"{dietary.capitalize()} Chef's Creation"
    
    def _generate_creative_title(self, dietary: str, templates: Dict, style: str) -> str:
        """Generate creative recipe title"""
        styles = ["with a twist", "fusion", "reimagined", "elevated"]
        proteins = templates.get('proteins', ['Chicken', 'Tofu', 'Salmon'])
        bases = templates.get('pasta', templates.get('base', ['Bowl', 'Plate', 'Dish']))
        
        return f"{dietary.capitalize()} {random.choice(proteins)} {random.choice(bases)} {random.choice(styles)}"
    
    def _generate_gourmet_title(self, dietary: str, templates: Dict) -> str:
        """Generate gourmet recipe title"""
        gourmet_terms = ["Gourmet", "Artisanal", "Signature", "Premium", "Chef's"]
        proteins = templates.get('proteins', ['Chicken', 'Tofu', 'Salmon'])
        styles = ["Experience", "Creation", "Masterpiece", "Specialty"]
        
        return f"{random.choice(gourmet_terms)} {dietary.capitalize()} {random.choice(proteins)} {random.choice(styles)}"
    
    def _generate_recipe_description(self, title: str, constraints: Dict[str, str], variation_level: int) -> str:
        """Generate recipe description based on variation level"""
        difficulty = constraints.get('difficulty', 'medium')
        dietary = constraints.get('dietary', 'regular')
        
        descriptions = [
            f"A perfect {difficulty} {dietary} recipe that highlights your chosen ingredients with classic flavors and simple techniques.",
            f"Creative {difficulty} {dietary} preparation that adds unexpected twists while keeping the essence of your original idea.",
            f"Innovative {difficulty} {dietary} approach combining unique ingredient pairings for a memorable dining experience.",
            f"Sophisticated {difficulty} {dietary} recipe featuring premium ingredients and advanced cooking techniques.",
            f"Ultimate {difficulty} {dietary} gourmet experience with complex flavors and restaurant-quality presentation."
        ]
        
        return descriptions[variation_level] if variation_level < len(descriptions) else descriptions[-1]
    
    def _generate_ingredients(self, specific_ingredients: List[str], templates: Dict, 
                            constraints: Dict[str, str], variation_level: int) -> List[str]:
        """Generate ingredient list with variation levels"""
        ingredients = []
        dietary = constraints.get('dietary', 'regular')
        
        # Always include specified ingredients
        ingredients.extend([f"2 {ing}" for ing in specific_ingredients[:5]])
        
        # Add different complementary ingredients based on variation level
        if variation_level == 0:
            complements = ['olive oil', 'garlic', 'salt', 'pepper', 'onion']
        elif variation_level == 1:
            complements = ['sesame oil', 'ginger', 'soy sauce', 'honey', 'lime']
        elif variation_level == 2:
            complements = ['tahini', 'miso', 'coconut milk', 'lemongrass', 'fish sauce']
        elif variation_level == 3:
            complements = ['truffle oil', 'saffron', 'prosciutto', 'aged cheese', 'fresh herbs']
        else:
            complements = ['gochujang', 'sumac', 'preserved lemon', 'zaatar', 'mirin']
        
        # Add 3-4 complementary ingredients
        ingredients.extend([f"1 {comp}" for comp in random.sample(complements, random.randint(3, 4))])
        
        # Add protein based on dietary and variation
        proteins = self._get_proteins_for_variation(dietary, variation_level)
        existing_proteins = any(p in ' '.join(ingredients).lower() for p in proteins)
        if proteins and not existing_proteins and variation_level > 0:
            ingredients.append(f"1 {random.choice(proteins)}")
        
        # Add vegetables based on variation
        veggies = self._get_vegetables_for_variation(variation_level)
        new_veggies = [v for v in veggies if v not in ' '.join(ingredients).lower()]
        if new_veggies:
            ingredients.extend([f"1 {veg}" for veg in random.sample(new_veggies, min(2, len(new_veggies)))])
        
        # Add dairy for non-vegan variations
        if dietary != 'vegan' and variation_level >= 1:
            dairy = random.sample(self.ingredient_categories['dairy'], 1)
            ingredients.extend([f"1 {item}" for item in dairy])
        
        return ingredients
    
    def _get_proteins_for_variation(self, dietary: str, variation_level: int) -> List[str]:
        """Get appropriate proteins for variation level"""
        if dietary == 'vegetarian':
            bases = ['tofu', 'tempeh', 'lentils', 'chickpeas', 'paneer']
        elif dietary == 'vegan':
            bases = ['tofu', 'tempeh', 'lentils', 'chickpeas', 'black beans']
        else:
            bases = ['chicken breast', 'salmon', 'shrimp', 'beef', 'pork']
        
        # Add variety based on variation level
        if variation_level >= 1:
            bases.extend(['duck', 'lamb', 'scallops'] if dietary == 'regular' else ['seitan', 'jackfruit'])
        if variation_level >= 2:
            bases.extend(['venison', 'quail'] if dietary == 'regular' else ['artichoke hearts', 'king oyster mushrooms'])
        
        return bases
    
    def _get_vegetables_for_variation(self, variation_level: int) -> List[str]:
        """Get vegetables appropriate for variation level"""
        base_veggies = ['carrots', 'bell peppers', 'spinach', 'broccoli', 'zucchini']
        
        if variation_level >= 1:
            base_veggies.extend(['mushrooms', 'asparagus', 'kale', 'sweet potatoes'])
        if variation_level >= 2:
            base_veggies.extend(['bok choy', 'brussels sprouts', 'artichokes', 'fennel'])
        if variation_level >= 3:
            base_veggies.extend(['heirloom tomatoes', 'rainbow chard', 'purple cauliflower'])
        
        return base_veggies
    
    def _generate_instructions(self, ingredients: List[str], constraints: Dict[str, str], variation_level: int) -> List[str]:
        """Generate cooking instructions with variation complexity"""
        difficulty = constraints.get('difficulty', 'medium')
        
        base_steps = [
            "Gather and prepare all ingredients",
            "Heat oil in a pan over medium heat",
            "Cook main ingredients until properly done",
            "Add seasonings and adjust to taste",
            "Serve hot and enjoy your meal"
        ]
        
        # Add complexity based on variation level
        if variation_level >= 1:
            base_steps.insert(2, "Sauté aromatic vegetables until fragrant")
            base_steps.insert(4, "Add sauces and simmer")
        if variation_level >= 2:
            base_steps.insert(3, "Deglaze pan with liquid for extra flavor")
            base_steps.insert(5, "Create and reduce sauce for better consistency")
        if variation_level >= 3:
            base_steps.insert(1, "Marinate proteins for enhanced flavor")
            base_steps.insert(6, "Garnish with fresh herbs and toppings")
        
        return base_steps
    
    def _calculate_nutrition(self, ingredients: List[str], constraints: Dict[str, str]) -> Dict[str, str]:
        """Calculate approximate nutritional information"""
        base_calories = random.randint(300, 600)
        dietary = constraints.get('dietary', 'regular')
        
        if dietary == 'vegan':
            base_calories -= 50
        elif dietary == 'vegetarian':
            base_calories -= 20
        
        return {
            'calories_per_serving': f"{base_calories}",
            'protein_per_serving': f"{random.randint(15, 35)}g",
            'carbs_per_serving': f"{random.randint(40, 80)}g",
            'fat_per_serving': f"{random.randint(10, 30)}g"
        }
    
    def _generate_cook_time(self, difficulty: str, variation_level: int) -> str:
        """Generate appropriate cook time based on difficulty and variation"""
        base_times = {
            'easy': ['15 min', '20 min', '25 min'],
            'medium': ['30 min', '35 min', '40 min'],
            'hard': ['45 min', '50 min', '60 min']
        }
        
        time = random.choice(base_times.get(difficulty, base_times['medium']))
        
        # Increase time for higher variation levels
        if variation_level >= 3:
            time = f"{int(time.split()[0]) + 15} min"
        
        return time
    
    def _get_recipe_emoji(self, cuisine: str, variation_level: int) -> str:
        """Get appropriate emoji for recipe type and variation"""
        base_emojis = {
            'italian': '🍝',
            'indian': '🍛',
            'mexican': '🌮',
            'asian': '🍜',
            'mediterranean': '🥗',
            'fusion': '🍲'
        }
        
        emoji = base_emojis.get(cuisine, '🍽️')
        
        # Add special emojis for higher variations
        if variation_level >= 3:
            emoji = '👨‍🍳' + emoji
        elif variation_level >= 2:
            emoji = '✨' + emoji
        
        return emoji
    
    def _generate_external_links(self, ingredients: List[str]) -> Dict[str, str]:
        """Generate external shopping links"""
        main_ingredients = ' '.join(ingredients[:3]).split()[:3]
        query = '+'.join(main_ingredients)
        
        return {
            "zepto": f"https://www.zeptonow.com/search?q={query}",
            "blinkit": f"https://blinkit.com/search?q={query}"
        }

# Initialize the recipe generator
recipe_generator = AdvancedRecipeGenerator()

# Blueprint Routes
@custom_recipe_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Custom Recipe Generator"})

@custom_recipe_bp.route('/options', methods=['GET'])
def get_options():
    """Get available options for dietary, cuisine, and difficulty"""
    options = {
        "dietary": [
            {"id": "regular", "name": "No Restrictions", "icon": "🍽️"},
            {"id": "vegetarian", "name": "Vegetarian", "icon": "🥕"},
            {"id": "vegan", "name": "Vegan", "icon": "🌱"},
            {"id": "gluten-free", "name": "Gluten-Free", "icon": "🌾"}
        ],
        "cuisine": [
            {"id": "italian", "name": "Italian", "icon": "🍝"},
            {"id": "indian", "name": "Indian", "icon": "🍛"},
            {"id": "mexican", "name": "Mexican", "icon": "🌮"},
            {"id": "asian", "name": "Asian", "icon": "🍜"},
            {"id": "mediterranean", "name": "Mediterranean", "icon": "🥗"},
            {"id": "fusion", "name": "Fusion", "icon": "🌍"}
        ],
        "difficulty": [
            {"id": "easy", "name": "Easy", "icon": "⭐"},
            {"id": "medium", "name": "Medium", "icon": "⭐⭐"},
            {"id": "hard", "name": "Hard", "icon": "⭐⭐⭐"}
        ]
    }
    return jsonify(options)

@custom_recipe_bp.route('/generate-recipe', methods=['POST'])
def generate_recipe():
    """Generate 5 recipe variations with increasing creativity"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data provided"
            }), 400
        
        prompt = data.get('prompt', '').strip()
        constraints = data.get('constraints', {})
        
        if not prompt:
            return jsonify({
                "success": False,
                "error": "Prompt is required"
            }), 400
        
        # Validate constraints
        valid_constraints = {
            'dietary': constraints.get('dietary', 'regular'),
            'cuisine': constraints.get('cuisine', 'fusion'),
            'difficulty': constraints.get('difficulty', 'medium')
        }
        
        # Generate 5 recipe variations with increasing creativity
        recipes = recipe_generator.generate_recipe_variations(
            prompt=prompt,
            constraints=valid_constraints,
            num_recipes=5
        )
        
        return jsonify({
            "success": True,
            "recipes": recipes,
            "generated_at": datetime.now().isoformat(),
            "prompt": prompt,
            "constraints": valid_constraints,
            "variation_explanation": {
                "recipe_1": "Uses your specified ingredients with classic preparation",
                "recipe_2": "Adds complementary ingredients for creative twist",
                "recipe_3": "Innovative combination with unique pairings",
                "recipe_4": "Gourmet version with premium ingredients",
                "recipe_5": "Ultimate fusion experience with exotic elements"
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@custom_recipe_bp.route('/generate-meal-plan', methods=['POST'])
def generate_meal_plan():
    """Generate a weekly meal plan"""
    try:
        data = request.get_json()
        dishes = data.get('dishes', [])
        constraints = data.get('constraints', {})
        
        if not dishes:
            return jsonify({
                "success": False,
                "error": "At least one dish is required"
            }), 400
        
        meal_plan = {
            "week_start": datetime.now().strftime("%Y-%m-%d"),
            "meal_plan": [],
            "shopping_list": {},
            "nutrition_summary": {},
            "prep_tips": []
        }
        
        # Generate recipes for each day with variations
        for i, dish in enumerate(dishes):
            recipe = recipe_generator.generate_recipe(dish, constraints, variation_level=i % 5)
            
            day_plan = {
                "day": f"Day {i + 1}",
                "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
                "recipe": recipe['title'],
                "description": recipe['description'],
                "prep_time": "15 min",
                "cook_time": recipe['time'],
                "difficulty": recipe['difficulty'],
                "servings": recipe['servings'],
                "cuisine": recipe['cuisine'],
                "variation_level": recipe['variation_level']
            }
            
            meal_plan['meal_plan'].append(day_plan)
        
        # Generate shopping list
        meal_plan['shopping_list'] = generate_shopping_list(meal_plan['meal_plan'])
        
        # Generate nutrition summary
        meal_plan['nutrition_summary'] = generate_nutrition_summary(meal_plan['meal_plan'])
        
        # Generate prep tips
        meal_plan['prep_tips'] = generate_prep_tips(meal_plan['meal_plan'])
        
        return jsonify({
            "success": True,
            "meal_plan": meal_plan
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def generate_shopping_list(meal_plan: List[Dict]) -> Dict[str, List[str]]:
    """Generate a categorized shopping list from meal plan"""
    categories = {
        "proteins": ["Chicken breast", "Ground beef", "Salmon", "Tofu", "Lentils", "Chickpeas"],
        "vegetables": ["Onions", "Garlic", "Bell peppers", "Carrots", "Spinach", "Tomatoes", "Mushrooms"],
        "dairy": ["Milk", "Cheese", "Yogurt", "Butter", "Cream"],
        "pantry": ["Rice", "Pasta", "Olive oil", "Spices", "Flour", "Sugar", "Vinegar"],
        "fruits": ["Lemons", "Limes", "Avocado", "Apples", "Bananas"]
    }
    
    shopping_list = {}
    for category, items in categories.items():
        variation_items = min(4, 2 + len([m for m in meal_plan if m.get('variation_level', 0) > 2]))
        shopping_list[category] = random.sample(items, variation_items)
    
    return shopping_list

def generate_nutrition_summary(meal_plan: List[Dict]) -> Dict[str, str]:
    """Generate nutritional summary for meal plan"""
    return {
        "daily_average_calories": f"{random.randint(1800, 2500)}",
        "daily_average_protein": f"{random.randint(60, 100)}g",
        "daily_average_carbs": f"{random.randint(200, 350)}g",
        "daily_average_fat": f"{random.randint(50, 90)}g"
    }

def generate_prep_tips(meal_plan: List[Dict]) -> List[str]:
    """Generate meal prep tips"""
    tips = [
        "Prep vegetables in advance to save time during the week",
        "Cook grains in large batches for multiple meals",
        "Marinate proteins the night before for better flavor",
        "Use overlapping ingredients across different dishes",
        "Portion meals into containers for easy grab-and-go",
        "For gourmet recipes, prep sauces and dressings ahead"
    ]
    return random.sample(tips, 3)

# Optional: Initialize function for the blueprint
def init_app(app):
    """Initialize the custom recipe blueprint with the main app"""
    app.register_blueprint(custom_recipe_bp, url_prefix='/api/custom-recipe')
    print("[custom_recipe] ✅ Custom Recipe blueprint registered with URL prefix /api/custom-recipe")

# Make the blueprint available for import
custom_recipe_bp.name = "custom_recipe"