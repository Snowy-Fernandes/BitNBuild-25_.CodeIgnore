import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
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
  Timer,
} from 'lucide-react-native';

const recipeSteps = [
  {
    id: 1,
    instruction: 'Heat olive oil in a large pan over medium heat',
    svg: '🔥',
    timer: 2,
  },
  {
    id: 2,
    instruction: 'Add minced garlic and diced onions, cook until fragrant',
    svg: '🧄',
    timer: 3,
  },
  {
    id: 3,
    instruction: 'Add tomatoes and bell peppers, stir well',
    svg: '🍅',
    timer: 5,
  },
  {
    id: 4,
    instruction: 'Season with salt, pepper, and herbs to taste',
    svg: '🧂',
    timer: 1,
  },
  {
    id: 5,
    instruction: 'Simmer for 10-15 minutes until vegetables are tender',
    svg: '⏰',
    timer: 15,
  },
];

const ingredients = [
  { name: 'Tomatoes', amount: 3, unit: 'medium', cost: 2.50 },
  { name: 'Onions', amount: 1, unit: 'large', cost: 1.20 },
  { name: 'Garlic', amount: 4, unit: 'cloves', cost: 0.50 },
  { name: 'Bell Peppers', amount: 2, unit: 'medium', cost: 3.00 },
  { name: 'Olive Oil', amount: 2, unit: 'tbsp', cost: 0.80 },
];

const substitutions = [
  {
    ingredient: 'Tomatoes',
    substitute: 'Cherry Tomatoes',
    effect: 'Sweeter flavor, +10% antioxidants',
  },
  {
    ingredient: 'Bell Peppers',
    substitute: 'Zucchini',
    effect: 'Lower calories, softer texture',
  },
];

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams();
  const [servings, setServings] = useState(2);
  const [expandedSteps, setExpandedSteps] = useState(true);
  const [ingredientAmounts, setIngredientAmounts] = useState(
    ingredients.reduce((acc, ing, index) => ({
      ...acc,
      [index]: ing.amount,
    }), {})
  );

  const adjustServings = (change: number) => {
    const newServings = Math.max(1, servings + change);
    setServings(newServings);
    
    // Adjust ingredient amounts proportionally
    const ratio = newServings / 2; // Base recipe is for 2 servings
    const newAmounts = ingredients.reduce((acc, ing, index) => ({
      ...acc,
      [index]: Math.round(ing.amount * ratio * 10) / 10,
    }), {});
    setIngredientAmounts(newAmounts);
  };

  const adjustIngredient = (index: number, change: number) => {
    setIngredientAmounts(prev => ({
      ...prev,
      [index]: Math.max(0, (prev[index] || ingredients[index].amount) + change),
    }));
  };

  const getTotalCost = () => {
    return ingredients.reduce((total, ing, index) => {
      const currentAmount = ingredientAmounts[index] || ing.amount;
      const ratio = currentAmount / ing.amount;
      return total + (ing.cost * ratio);
    }, 0).toFixed(2);
  };

  const getNutritionInfo = () => {
    const base = {
      calories: 420,
      protein: 12,
      carbs: 45,
      fats: 18,
    };
    const ratio = servings / 2;
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Back"
          accessibilityRole="button">
          <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {params.title || 'Recipe Details'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.recipeImage}>
            <Text style={styles.recipeEmoji}>🍝</Text>
          </View>
          <Text style={styles.recipeTitle}>{params.title || 'Mediterranean Pasta'}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.metaText}>Prep: 10 min</Text>
            </View>
            <View style={styles.metaItem}>
              <Timer size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.metaText}>Cook: {params.time || '25 min'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.metaText}>{servings} servings</Text>
            </View>
          </View>

          <View style={styles.servingsControl}>
            <Text style={styles.servingsLabel}>Servings:</Text>
            <View style={styles.servingsButtons}>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(-1)}
                disabled={servings <= 1}
                accessibilityLabel="Decrease servings"
                accessibilityRole="button">
                <Minus size={16} color="#6C8BE6" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.servingsNumber}>{servings}</Text>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(1)}
                accessibilityLabel="Increase servings"
                accessibilityRole="button">
                <Plus size={16} color="#6C8BE6" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.seeFullButton}
            onPress={() => setExpandedSteps(!expandedSteps)}
            accessibilityLabel="See full recipe"
            accessibilityRole="button">
            <Text style={styles.seeFullButtonText}>
              {expandedSteps ? 'Hide Steps' : 'See Full Recipe'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.goWithButton}
            onPress={handleGoWithRecipe}
            accessibilityLabel="Go with this recipe"
            accessibilityRole="button">
            <Text style={styles.goWithButtonText}>Go with this Recipe</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                <Text style={styles.ingredientAmount}>
                  {ingredientAmounts[index] || ingredient.amount} {ingredient.unit}
                </Text>
              </View>
              <View style={styles.ingredientControls}>
                <TouchableOpacity
                  style={styles.ingredientButton}
                  onPress={() => adjustIngredient(index, -0.5)}
                  accessibilityLabel={`Decrease ${ingredient.name}`}
                  accessibilityRole="button">
                  <Minus size={12} color="#6C8BE6" strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ingredientButton}
                  onPress={() => adjustIngredient(index, 0.5)}
                  accessibilityLabel={`Increase ${ingredient.name}`}
                  accessibilityRole="button">
                  <Plus size={12} color="#6C8BE6" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.costSection}>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          <View style={styles.costCard}>
            <View style={styles.costHeader}>
              <Text style={styles.costTotal}>Total: ${getTotalCost()}</Text>
              <Text style={styles.costPer}>Per serving: ${(getTotalCost() / servings).toFixed(2)}</Text>
            </View>
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
        </View>

        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nutrition Breakdown</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionValue}>{nutrition.fats}g</Text>
              <Text style={styles.nutritionLabel}>Fats</Text>
            </View>
          </View>
        </View>

        <View style={styles.substitutionsSection}>
          <Text style={styles.sectionTitle}>Smart Substitutions</Text>
          {substitutions.map((sub, index) => (
            <TouchableOpacity key={index} style={styles.substitutionCard}>
              <View style={styles.substitutionHeader}>
                <Text style={styles.substitutionFrom}>{sub.ingredient}</Text>
                <Text style={styles.substitutionArrow}>→</Text>
                <Text style={styles.substitutionTo}>{sub.substitute}</Text>
              </View>
              <Text style={styles.substitutionEffect}>{sub.effect}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {expandedSteps && (
          <View style={styles.stepsSection}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipeSteps.map((step, index) => (
              <View key={step.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIcon}>
                    <Text style={styles.stepSvg}>{step.svg}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepNumber}>Step {index + 1}</Text>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                    {step.timer && (
                      <View style={styles.stepTimer}>
                        <Timer size={12} color="#6C8BE6" strokeWidth={2} />
                        <Text style={styles.stepTimerText}>{step.timer} min</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.orderSection}>
          <Text style={styles.orderTitle}>Missing ingredients?</Text>
          <View style={styles.orderButtons}>
            <TouchableOpacity
              style={styles.orderButton}
              accessibilityLabel="Order from Zepto"
              accessibilityRole="button">
              <ShoppingCart size={16} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.orderButtonText}>Order on Zepto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.orderButton}
              accessibilityLabel="Order from Blinkit"
              accessibilityRole="button">
              <ShoppingCart size={16} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.orderButtonText}>Order on Blinkit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.finalAction}>
          <TouchableOpacity
            style={styles.finalGoButton}
            onPress={handleGoWithRecipe}
            accessibilityLabel="Go with this recipe"
            accessibilityRole="button">
            <Star size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.finalGoButtonText}>Go with this Recipe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.chatbotFloat}
        onPress={() => router.push('/chatbot')}
        accessibilityLabel="Open chatbot"
        accessibilityRole="button">
        <Text style={styles.chatbotIcon}>💬</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recipeImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recipeEmoji: {
    fontSize: 48,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  servingsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  servingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  servingsButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF3FF',
    borderRadius: 20,
    padding: 4,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  seeFullButton: {
    flex: 1,
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  seeFullButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  goWithButton: {
    flex: 1,
    backgroundColor: '#6C8BE6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  goWithButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  ingredientsSection: {
    marginBottom: 32,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  ingredientControls: {
    flexDirection: 'row',
    gap: 8,
  },
  ingredientButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  costSection: {
    marginBottom: 32,
  },
  costCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  costHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF3FF',
  },
  costTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  costPer: {
    fontSize: 14,
    color: '#6B7280',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costItem: {
    fontSize: 14,
    color: '#1F2937',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C8BE6',
  },
  nutritionSection: {
    marginBottom: 32,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C8BE6',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  substitutionsSection: {
    marginBottom: 32,
  },
  substitutionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  substitutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  substitutionFrom: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  substitutionArrow: {
    fontSize: 16,
    color: '#6C8BE6',
    marginHorizontal: 8,
  },
  substitutionTo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  substitutionEffect: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  stepsSection: {
    marginBottom: 32,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  stepHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSvg: {
    fontSize: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C8BE6',
    marginBottom: 4,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  stepTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepTimerText: {
    fontSize: 12,
    color: '#6C8BE6',
    fontWeight: '500',
  },
  orderSection: {
    marginBottom: 32,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderButton: {
    flex: 1,
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  finalAction: {
    marginBottom: 40,
  },
  finalGoButton: {
    backgroundColor: '#6C8BE6',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 64,
  },
  finalGoButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chatbotFloat: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C8BE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  chatbotIcon: {
    fontSize: 24,
  },
});