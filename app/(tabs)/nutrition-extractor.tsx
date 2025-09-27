import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ChevronLeft, 
  MessageCircle,
  Camera,
  Upload,
  TrendingDown,
  Plus,
  Minus,
} from 'lucide-react-native';

const nutritionData = {
  totalCalories: 520,
  macros: {
    protein: { value: 28, percentage: 22 },
    carbs: { value: 45, percentage: 35 },
    fats: { value: 25, percentage: 43 },
  },
  micronutrients: [
    { name: 'Vitamin C', value: '45mg', daily: '75%' },
    { name: 'Iron', value: '8.2mg', daily: '46%' },
    { name: 'Calcium', value: '240mg', daily: '24%' },
    { name: 'Fiber', value: '12g', daily: '48%' },
  ],
  identifiedIngredients: [
    {
      id: 1,
      name: 'Chicken Breast',
      quantity: '150g',
      calories: 248,
      protein: 25,
      carbs: 0,
      fats: 3,
    },
    {
      id: 2,
      name: 'Brown Rice',
      quantity: '100g',
      calories: 180,
      protein: 3,
      carbs: 35,
      fats: 2,
    },
    {
      id: 3,
      name: 'Mixed Vegetables',
      quantity: '80g',
      calories: 92,
      protein: 0,
      carbs: 10,
      fats: 20,
    },
  ],
  suggestions: [
    {
      id: 1,
      type: 'reduce',
      title: 'Reduce sodium',
      description: 'Consider using herbs instead of salt for flavoring',
      impact: 'Better heart health',
      icon: '🧂',
    },
    {
      id: 2,
      type: 'add',
      title: 'Add more fiber',
      description: 'Include a side of leafy greens or beans',
      impact: 'Better digestion',
      icon: '🥬',
    },
    {
      id: 3,
      type: 'balance',
      title: 'Balance protein',
      description: 'Great protein content for muscle maintenance',
      impact: 'Optimal nutrition',
      icon: '💪',
    },
  ],
};

export default function NutritionExtractorScreen() {
  const [showResults, setShowResults] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handlePhotoUpload = () => {
    Alert.alert('Photo Upload', 'Camera/gallery access will be available soon');
    simulateAnalysis();
  };

  const simulateAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setShowResults(true);
    }, 2500);
  };

  const adjustQuantity = (ingredientId: number, change: number) => {
    Alert.alert(
      'Adjust Quantity',
      `This will recalculate nutrition values based on the new quantity. Feature coming soon!`
    );
  };

  const MacroCircle = ({ macro, color }: { macro: any, color: string }) => (
    <View style={styles.macroCircle}>
      <View style={[styles.macroRing, { borderColor: color }]}>
        <Text style={styles.macroValue}>{macro.value}g</Text>
      </View>
      <Text style={styles.macroLabel}>{macro.percentage}%</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Back to home"
          accessibilityRole="button">
          <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Extractor</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Analyze your meal</Text>
        <Text style={styles.subtitle}>
          Upload a photo to get detailed nutrition breakdown
        </Text>

        {!showResults && (
          <View style={styles.uploadSection}>
            <View style={styles.photoControls}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePhotoUpload}
                accessibilityLabel="Upload photo from gallery"
                accessibilityRole="button">
                <Upload size={24} color="#6C8BE6" strokeWidth={2} />
                <Text style={styles.photoButtonText}>Upload from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePhotoUpload}
                accessibilityLabel="Take photo with camera"
                accessibilityRole="button">
                <Camera size={24} color="#6C8BE6" strokeWidth={2} />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.exampleSection}>
              <Text style={styles.exampleTitle}>Works best with:</Text>
              <View style={styles.exampleGrid}>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleEmoji}>🍽️</Text>
                  <Text style={styles.exampleText}>Complete meals</Text>
                </View>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleEmoji}>🥗</Text>
                  <Text style={styles.exampleText}>Salads & bowls</Text>
                </View>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleEmoji}>🍕</Text>
                  <Text style={styles.exampleText}>Single dishes</Text>
                </View>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleEmoji}>🥪</Text>
                  <Text style={styles.exampleText}>Sandwiches</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {analyzing && (
          <View style={styles.analyzingIndicator}>
            <View style={styles.analyzingAnimation} />
            <Text style={styles.analyzingText}>Analyzing nutrition content...</Text>
          </View>
        )}

        {showResults && (
          <View style={styles.resultsSection}>
            <View style={styles.overviewCard}>
              <View style={styles.caloriesDisplay}>
                <Text style={styles.caloriesNumber}>{nutritionData.totalCalories}</Text>
                <Text style={styles.caloriesLabel}>Total Calories</Text>
              </View>

              <View style={styles.macrosGrid}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroTitle}>Protein</Text>
                  <MacroCircle macro={nutritionData.macros.protein} color="#6C8BE6" />
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroTitle}>Carbs</Text>
                  <MacroCircle macro={nutritionData.macros.carbs} color="#BFAFF7" />
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroTitle}>Fats</Text>
                  <MacroCircle macro={nutritionData.macros.fats} color="#EFF3FF" />
                </View>
              </View>
            </View>

            <View style={styles.ingredientsSection}>
              <Text style={styles.sectionTitle}>Identified Ingredients</Text>
              {nutritionData.identifiedIngredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientCard}>
                  <View style={styles.ingredientHeader}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                      <Text style={styles.ingredientQuantity}>{ingredient.quantity}</Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => adjustQuantity(ingredient.id, -10)}
                        accessibilityLabel={`Decrease ${ingredient.name} quantity`}
                        accessibilityRole="button">
                        <Minus size={12} color="#6C8BE6" strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => adjustQuantity(ingredient.id, 10)}
                        accessibilityLabel={`Increase ${ingredient.name} quantity`}
                        accessibilityRole="button">
                        <Plus size={12} color="#6C8BE6" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.ingredientNutrition}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{ingredient.calories}</Text>
                      <Text style={styles.nutritionLabel}>cal</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{ingredient.protein}g</Text>
                      <Text style={styles.nutritionLabel}>protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{ingredient.carbs}g</Text>
                      <Text style={styles.nutritionLabel}>carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{ingredient.fats}g</Text>
                      <Text style={styles.nutritionLabel}>fats</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.microSection}>
              <Text style={styles.sectionTitle}>Micronutrients</Text>
              <View style={styles.microGrid}>
                {nutritionData.micronutrients.map((micro, index) => (
                  <View key={index} style={styles.microCard}>
                    <Text style={styles.microName}>{micro.name}</Text>
                    <Text style={styles.microValue}>{micro.value}</Text>
                    <Text style={styles.microDaily}>{micro.daily} daily</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionTitle}>Smart Suggestions</Text>
              {nutritionData.suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionCard}
                  accessibilityLabel={suggestion.title}
                  accessibilityRole="button">
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                      <Text style={styles.suggestionDescription}>
                        {suggestion.description}
                      </Text>
                    </View>
                    {suggestion.type === 'reduce' && (
                      <View style={styles.suggestionBadge}>
                        <TrendingDown size={12} color="#FFFFFF" strokeWidth={2} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.suggestionImpact}>
                    Impact: {suggestion.impact}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.analyzeAnotherButton}
              onPress={() => setShowResults(false)}
              accessibilityLabel="Analyze another meal"
              accessibilityRole="button">
              <Camera size={16} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.analyzeAnotherText}>Analyze Another Meal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.chatbotFloat}
        onPress={() => router.push('/chatbot')}
        accessibilityLabel="Open chatbot"
        accessibilityRole="button">
        <MessageCircle size={24} color="#FFFFFF" strokeWidth={2} />
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  uploadSection: {
    marginBottom: 32,
  },
  photoControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#EFF3FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
    marginTop: 8,
  },
  exampleSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  exampleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  exampleItem: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  exampleEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  analyzingIndicator: {
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  analyzingAnimation: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C8BE6',
    marginBottom: 12,
  },
  analyzingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  resultsSection: {
    marginBottom: 40,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  caloriesDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  caloriesNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6C8BE6',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  macroCircle: {
    alignItems: 'center',
  },
  macroRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6B7280',
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
  ingredientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  quantityControls: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6C8BE6',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  microSection: {
    marginBottom: 32,
  },
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  microCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  microName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  microValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6C8BE6',
    marginBottom: 2,
  },
  microDaily: {
    fontSize: 10,
    color: '#6B7280',
  },
  suggestionsSection: {
    marginBottom: 32,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  suggestionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C8BE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionImpact: {
    fontSize: 11,
    color: '#BFAFF7',
    fontStyle: 'italic',
  },
  analyzeAnotherButton: {
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  chatbotFloat: {
    position: 'absolute',
    bottom: 80,
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
});