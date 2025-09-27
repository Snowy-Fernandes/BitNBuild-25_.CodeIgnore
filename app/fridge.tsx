import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Camera, Upload, Mic, Plus, X, Clock, Users } from 'lucide-react-native';

const sampleIngredients = ['Tomatoes', 'Onions', 'Garlic', 'Bell Peppers', 'Spinach'];

const sampleRecipes = [
  {
    id: 1,
    title: 'Mediterranean Pasta',
    time: '25 min',
    servings: '4',
    calories: '420',
    image: '🍝',
    ingredients: ['Tomatoes', 'Garlic', 'Onions'],
  },
  {
    id: 2,
    title: 'Veggie Stir Fry',
    time: '15 min',
    servings: '2',
    calories: '280',
    image: '🥢',
    ingredients: ['Bell Peppers', 'Onions', 'Garlic'],
  },
];

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [showResults, setShowResults] = useState(false);

  const addIngredient = () => {
    if (inputText.trim()) {
      setIngredients([...ingredients, inputText.trim()]);
      setInputText('');
      setShowResults(true);
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addSampleIngredients = () => {
    setIngredients(sampleIngredients);
    setShowResults(true);
  };

  const handlePhotoUpload = () => {
    Alert.alert('Photo Upload', 'Camera feature will be available soon');
    addSampleIngredients();
  };

  const handleVoiceInput = () => {
    Alert.alert('Voice Input', 'Voice recognition will be available soon');
    addSampleIngredients();
  };

  const openRecipeDetail = (recipe: any) => {
    router.push({
      pathname: '/recipe-detail',
      params: { 
        recipeId: recipe.id,
        from: 'fridge',
        title: recipe.title,
        time: recipe.time,
        servings: recipe.servings,
        calories: recipe.calories,
      }
    });
  };

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
        <Text style={styles.headerTitle}>What's in My Fridge</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Show me your ingredients</Text>
        <Text style={styles.subtitle}>Upload a photo or add them manually</Text>

        <View style={styles.inputSection}>
          <View style={styles.photoControls}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePhotoUpload}
              accessibilityLabel="Upload photo of ingredients"
              accessibilityRole="button">
              <Upload size={20} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.photoButtonText}>Upload Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePhotoUpload}
              accessibilityLabel="Take photo of ingredients"
              accessibilityRole="button">
              <Camera size={20} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or add manually</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type ingredients..."
              placeholderTextColor="#6B7280"
              returnKeyType="done"
              onSubmitEditing={addIngredient}
              accessibilityLabel="Ingredient input"
            />
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceInput}
              accessibilityLabel="Voice input"
              accessibilityRole="button">
              <Mic size={20} color="#6C8BE6" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={addIngredient}
              disabled={!inputText.trim()}
              accessibilityLabel="Add ingredient"
              accessibilityRole="button">
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {ingredients.length > 0 && (
          <View style={styles.ingredientsList}>
            <Text style={styles.ingredientsTitle}>Your Ingredients</Text>
            <View style={styles.ingredientChips}>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientChip}>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                  <TouchableOpacity
                    onPress={() => removeIngredient(index)}
                    accessibilityLabel={`Remove ${ingredient}`}
                    accessibilityRole="button">
                    <X size={16} color="#6B7280" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {showResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Recipe Suggestions</Text>
            <View style={styles.recipeGrid}>
              {sampleRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => openRecipeDetail(recipe)}
                  accessibilityLabel={`Recipe: ${recipe.title}`}
                  accessibilityRole="button">
                  <View style={styles.recipeImage}>
                    <Text style={styles.recipeEmoji}>{recipe.image}</Text>
                  </View>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <View style={styles.recipeMeta}>
                      <View style={styles.metaItem}>
                        <Clock size={12} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.metaText}>{recipe.time}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Users size={12} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.metaText}>{recipe.servings}</Text>
                      </View>
                    </View>
                    <Text style={styles.caloriesText}>{recipe.calories} cal</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
  },
  inputSection: {
    marginBottom: 32,
  },
  photoControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 64,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EFF3FF',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 14,
    marginHorizontal: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#EFF3FF',
    minHeight: 56,
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C8BE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientsList: {
    marginBottom: 32,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  ingredientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  ingredientText: {
    fontSize: 14,
    color: '#1F2937',
  },
  resultsSection: {
    marginBottom: 40,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  recipeGrid: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recipeEmoji: {
    fontSize: 32,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  caloriesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C8BE6',
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