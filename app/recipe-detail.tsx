import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, 
  Clock, 
  Users, 
  Plus, 
  Minus,
  ShoppingCart,
  Star,
  Utensils,
  Flame,
  DollarSign,
  BookOpen,
  Scale,
  Heart,
  Share2,
  Bookmark,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Recipe {
  id: string;
  title: string;
  time: string;
  servings: string;
  calories: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  cuisine?: string;
  difficulty?: string;
  costBreakdown?: string;
}

interface IngredientItem {
  name: string;
  amount: number;
  unit: string;
  cost: number;
}

interface RecipeStep {
  id: number;
  instruction: string;
  icon: string;
  timer?: number;
}

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeSteps, setRecipeSteps] = useState<RecipeStep[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [servings, setServings] = useState(2);
  const [expandedSteps, setExpandedSteps] = useState(true);
  const [ingredientAmounts, setIngredientAmounts] = useState<Record<number, number>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (params.recipe) {
      try {
        const parsedRecipe: Recipe = JSON.parse(params.recipe as string);
        setRecipe(parsedRecipe);
        
        if (parsedRecipe.servings) {
          const initialServings = parseInt(parsedRecipe.servings, 10) || 2;
          setServings(initialServings);
        }
        
        const steps: RecipeStep[] = parsedRecipe.instructions.map((instruction, index) => {
          let icon = '🍳';
          const lowerInstruction = instruction.toLowerCase();
          
          if (lowerInstruction.includes('boil') || lowerInstruction.includes('water') || lowerInstruction.includes('simmer')) {
            icon = '💧';
          } else if (lowerInstruction.includes('chop') || lowerInstruction.includes('cut') || lowerInstruction.includes('slice')) {
            icon = '🔪';
          } else if (lowerInstruction.includes('mix') || lowerInstruction.includes('stir') || lowerInstruction.includes('combine')) {
            icon = '🥄';
          } else if (lowerInstruction.includes('bake') || lowerInstruction.includes('oven') || lowerInstruction.includes('roast')) {
            icon = '🔥';
          } else if (lowerInstruction.includes('fry') || lowerInstruction.includes('sauté') || lowerInstruction.includes('pan')) {
            icon = '🍳';
          } else if (lowerInstruction.includes('season') || lowerInstruction.includes('salt') || lowerInstruction.includes('pepper')) {
            icon = '🧂';
          } else if (lowerInstruction.includes('serve') || lowerInstruction.includes('plate') || lowerInstruction.includes('garnish')) {
            icon = '🍽️';
          }
          
          const timeRegex = /(\d+)[-\s]?(?:minute|min|minutes|hour|hr|hours)/i;
          const timeMatch = timeRegex.exec(instruction);
          const timer = timeMatch ? parseInt(timeMatch[1], 10) : undefined;
          
          return { id: index + 1, instruction, icon, timer };
        });
        setRecipeSteps(steps);
        
        let formattedIngredients: IngredientItem[] = [];
        if (Array.isArray(parsedRecipe.ingredients)) {
          formattedIngredients = (parsedRecipe.ingredients as string[]).map((ing, idx) => {
            const regex = /(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/;
            const match = regex.exec(ing);
            
            let name = ing;
            let amount = 1;
            let unit = 'item';
            
            if (match) {
              amount = parseFloat(match[1]) || 1;
              if (match[2]) unit = match[2];
              name = ing.replace(regex, '').trim();
            }
            
            if (name === ing) {
              amount = 1;
              unit = 'item';
            }
            
            const cost = parseFloat((Math.random() * 3 + 0.5).toFixed(2));
            return { name, amount, unit, cost };
          });
        }
        
        setIngredients(formattedIngredients);
        const initialAmounts = formattedIngredients.reduce((acc, ing, index) => ({
          ...acc,
          [index]: ing.amount,
        }), {});
        setIngredientAmounts(initialAmounts);
        
      } catch (error) {
        console.error('Error parsing recipe:', error);
      }
    }
  }, [params.recipe]);

  const adjustServings = (change: number) => {
    if (!recipe) return;
    
    const newServings = Math.max(1, servings + change);
    setServings(newServings);
    
    const baseServings = parseInt(recipe.servings, 10) || 2;
    const ratio = newServings / baseServings;
    
    const newAmounts = ingredients.reduce((acc, ing, index) => ({
      ...acc,
      [index]: Math.round(ing.amount * ratio * 10) / 10,
    }), {});
    setIngredientAmounts(newAmounts);
  };

  const adjustIngredient = (index: number, change: number) => {
    setIngredientAmounts(prev => ({
      ...prev,
      [index]: Math.max(0, (prev[index] || ingredients[index]?.amount || 0) + change),
    }));
  };

  const getTotalCost = () => {
    if (!ingredients.length) return "0.00";
    return ingredients.reduce((total, ing, index) => {
      const currentAmount = ingredientAmounts[index] || ing.amount;
      const ratio = currentAmount / ing.amount;
      return total + (ing.cost * ratio);
    }, 0).toFixed(2);
  };

  const getNutritionInfo = () => {
    const baseCalories = recipe?.calories ? parseInt(recipe.calories, 10) : 350;
    const base = {
      calories: baseCalories,
      protein: Math.round(baseCalories * 0.03),
      carbs: Math.round(baseCalories * 0.11),
      fats: Math.round(baseCalories * 0.04),
    };
    
    const baseServings = parseInt(recipe?.servings || '2', 10);
    const ratio = servings / baseServings;
    
    return {
      calories: Math.round(base.calories * ratio),
      protein: Math.round(base.protein * ratio),
      carbs: Math.round(base.carbs * ratio),
      fats: Math.round(base.fats * ratio),
    };
  };

  const nutrition = getNutritionInfo();

  const handleGoWithRecipe = () => {
    router.push('/(tabs)/home');
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#2D3748" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
        </View>
        <View style={[styles.content, {alignItems: 'center', justifyContent: 'center'}]}>
          <Text style={{fontSize: 16, color: '#718096'}}>Loading recipe details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{recipe.title}</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saved && styles.saveButtonActive]}
          onPress={() => setSaved(!saved)}>
          <Bookmark size={20} color={saved ? '#FFFFFF' : '#718096'} fill={saved ? '#FFFFFF' : 'none'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.recipeImage}>
            <Text style={styles.recipeEmoji}>{recipe.image || '🍝'}</Text>
          </View>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          
          <View style={styles.recipeMeta}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#718096" />
              <Text style={styles.metaText}>{recipe.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={16} color="#718096" />
              <Text style={styles.metaText}>{servings} servings</Text>
            </View>
            {recipe.cuisine && (
              <View style={styles.metaItem}>
                <Utensils size={16} color="#718096" />
                <Text style={styles.metaText}>{recipe.cuisine}</Text>
              </View>
            )}
          </View>

          {recipe.difficulty && (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
            </View>
          )}

          <View style={styles.servingsControl}>
            <Text style={styles.servingsLabel}>Adjust Servings</Text>
            <View style={styles.servingsButtons}>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(-1)}
                disabled={servings <= 1}>
                <Minus size={16} color="#7C3AED" />
              </TouchableOpacity>
              <Text style={styles.servingsNumber}>{servings}</Text>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(1)}>
                <Plus size={16} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoWithRecipe}>
            <Star size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Start Cooking</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setExpandedSteps(!expandedSteps)}>
            <BookOpen size={20} color="#7C3AED" />
            <Text style={styles.secondaryButtonText}>
              {expandedSteps ? 'Hide Instructions' : 'Show Instructions'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ingredients Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Scale size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Ingredients</Text>
            </View>
            <Text style={styles.sectionSubtitle}>{ingredients.length} items</Text>
          </View>
          
          {ingredients.length > 0 ? (
            <View style={styles.ingredientsList}>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientAmount}>
                      {ingredientAmounts[index] || ingredient.amount} {ingredient.unit}
                    </Text>
                  </View>
                  <View style={styles.ingredientControls}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustIngredient(index, -0.5)}>
                      <Minus size={12} color="#7C3AED" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustIngredient(index, 0.5)}>
                      <Plus size={12} color="#7C3AED" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No ingredients information available</Text>
          )}
        </View>

        {/* Nutrition Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Flame size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Nutrition</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Per serving</Text>
          </View>
          
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.fats}g</Text>
              <Text style={styles.nutritionLabel}>Fats</Text>
            </View>
          </View>
        </View>

        {/* Cost Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <DollarSign size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Cost Breakdown</Text>
            </View>
          </View>
          
          <View style={styles.costSummary}>
            <Text style={styles.costTotal}>Total: ${getTotalCost()}</Text>
            <Text style={styles.costPerServing}>${(parseFloat(getTotalCost()) / servings).toFixed(2)} per serving</Text>
          </View>
          
          {recipe.costBreakdown ? (
            <Text style={styles.costBreakdown}>{recipe.costBreakdown}</Text>
          ) : (
            <View style={styles.costDetails}>
              {ingredients.map((ing, index) => {
                const currentAmount = ingredientAmounts[index] || ing.amount;
                const ratio = currentAmount / ing.amount;
                const itemCost = (ing.cost * ratio).toFixed(2);
                return (
                  <View key={index} style={styles.costRow}>
                    <Text style={styles.costItem}>{ing.name}</Text>
                    <Text style={styles.costAmount}>${itemCost}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Instructions Section */}
        {expandedSteps && recipe.instructions && recipe.instructions.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <BookOpen size={20} color="#7C3AED" />
                <Text style={styles.sectionTitle}>Instructions</Text>
              </View>
              <Text style={styles.sectionSubtitle}>{recipe.instructions.length} steps</Text>
            </View>
            
            <View style={styles.instructionsList}>
              {recipeSteps.map((step, index) => (
                <View key={step.id} style={styles.instructionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                    {step.timer && (
                      <View style={styles.stepTimer}>
                        <Clock size={12} color="#7C3AED" />
                        <Text style={styles.stepTimerText}>{step.timer} minutes</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Order Section */}
        <View style={styles.orderCard}>
          <Text style={styles.orderTitle}>Missing ingredients?</Text>
          <Text style={styles.orderSubtitle}>Get them delivered in minutes</Text>
          
          <View style={styles.orderButtons}>
            <TouchableOpacity style={styles.orderButton}>
              <ShoppingCart size={18} color="#FFFFFF" />
              <Text style={styles.orderButtonText}>Order on Zepto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.orderButton, styles.orderButtonSecondary]}>
              <ShoppingCart size={18} color="#7C3AED" />
              <Text style={[styles.orderButtonText, styles.orderButtonTextSecondary]}>Order on Blinkit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  recipeImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  recipeEmoji: {
    fontSize: 48,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  difficultyBadge: {
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38A169',
    textTransform: 'capitalize',
  },
  servingsControl: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 16,
    width: '100%',
  },
  servingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  servingsButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  servingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  servingsNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    minWidth: 40,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  ingredientAmount: {
    fontSize: 12,
    color: '#718096',
  },
  ingredientControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  costSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  costTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  costPerServing: {
    fontSize: 12,
    color: '#718096',
  },
  costBreakdown: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  costDetails: {
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costItem: {
    fontSize: 14,
    color: '#2D3748',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  instructionsList: {
    gap: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#2D3748',
    lineHeight: 20,
    marginBottom: 4,
  },
  stepTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepTimerText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  stepIcon: {
    fontSize: 20,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#7C3AED',
    margin: 24,
    padding: 24,
    borderRadius: 20,
    marginBottom: 40,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  orderSubtitle: {
    fontSize: 14,
    color: '#EDE9FE',
    marginBottom: 20,
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
  },
  orderButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  orderButtonTextSecondary: {
    color: '#FFFFFF',
  },
});