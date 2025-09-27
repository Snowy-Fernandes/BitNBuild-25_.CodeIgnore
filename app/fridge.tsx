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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Camera, Upload, Mic, Plus, X, Clock, Users } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// Configuration - Use your actual backend URL
const API_BASE_URL = 'http://192.168.1.101:8001'; // For iOS simulator
// const API_BASE_URL = 'http://10.0.2.2:5000'; // For Android emulator
// const API_BASE_URL = 'http://192.168.x.x:5000'; // For physical device

interface Recipe {
  id: string;
  title: string;
  time: string;
  servings: string;
  calories: string;
  image: string;
  ingredients: string[];
  instructions?: string[];
  cuisine?: string;
  difficulty?: string;
  costBreakdown?: string;
}

interface ApiResponse {
  success: boolean;
  ingredients?: string[];
  recipes?: Recipe[];
  error?: string;
  message?: string;
}

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  // Improved API call function with better error handling
  const makeApiCall = async (endpoint: string, method: string, data?: any): Promise<ApiResponse> => {
    try {
      console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('API Success Response:', result);
      return result as ApiResponse;

    } catch (error: any) {
      console.error('API Call Failed:', error);
      
      // More specific error messages
      if (error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on ' + API_BASE_URL);
      }
      
      throw error;
    }
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  };

  const addIngredient = async () => {
    if (inputText.trim()) {
      const newIngredients = [...ingredients, inputText.trim()];
      setIngredients(newIngredients);
      setInputText('');
      
      try {
        setLoading(true);
        setLoadingStatus('Finding recipes...');
        
        const response = await makeApiCall('/fridge/text', 'POST', {
          ingredients: newIngredients
        });
        
        if (response.success && response.recipes) {
          setRecipes(response.recipes);
          setShowResults(true);
        } else {
          throw new Error(response.error || 'Failed to get recipe suggestions');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to get recipe suggestions');
      } finally {
        setLoading(false);
        setLoadingStatus('');
      }
    }
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
    
    if (newIngredients.length > 0) {
      // Update recipes with new ingredient list
      updateRecipesWithIngredients(newIngredients);
    } else {
      setShowResults(false);
      setRecipes([]);
    }
  };

  const updateRecipesWithIngredients = async (ingredientsList: string[]) => {
    try {
      setLoading(true);
      setLoadingStatus('Updating recipes...');
      
      const response = await makeApiCall('/fridge/text', 'POST', {
        ingredients: ingredientsList
      });
      
      if (response.success && response.recipes) {
        setRecipes(response.recipes);
        setShowResults(true);
      } else {
        throw new Error(response.error || 'Failed to update recipe suggestions');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update recipe suggestions');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handlePhotoUpload = async () => {
    try {
      // Test connection first
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        Alert.alert(
          'Connection Error', 
          `Cannot connect to backend server at ${API_BASE_URL}. Please make sure the server is running.`
        );
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        setLoadingStatus('Analyzing photo...');

        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const response = await makeApiCall('/fridge/photo', 'POST', {
          image: base64Image
        });

        if (response.success && response.ingredients) {
          setIngredients(response.ingredients);
          if (response.recipes) {
            setRecipes(response.recipes);
            setShowResults(true);
          }
          Alert.alert('Success', 'Ingredients detected from photo!');
        } else {
          throw new Error(response.error || 'Failed to extract ingredients from photo');
        }
      }
    } catch (error: any) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', error.message || 'Failed to extract ingredients from photo');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        Alert.alert(
          'Connection Error', 
          `Cannot connect to backend server at ${API_BASE_URL}. Please make sure the server is running.`
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        setLoadingStatus('Analyzing photo...');

        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const response = await makeApiCall('/fridge/photo', 'POST', {
          image: base64Image
        });

        if (response.success && response.ingredients) {
          setIngredients(response.ingredients);
          if (response.recipes) {
            setRecipes(response.recipes);
            setShowResults(true);
          }
          Alert.alert('Success', 'Ingredients detected from photo!');
        } else {
          throw new Error(response.error || 'Failed to extract ingredients from photo');
        }
      }
    } catch (error: any) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', error.message || 'Failed to extract ingredients from photo');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handleVoiceInput = () => {
    Alert.alert('Voice Input', 'Voice recognition will be available soon');
    // In a real app, you'd implement speech-to-text here
  };

  const openRecipeDetail = (recipe: Recipe) => {
    router.push({
      pathname: '/recipe-detail',
      params: { 
        recipe: JSON.stringify(recipe), // Pass the entire recipe object as string
        from: 'fridge'
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
        {/* Connection Test Button - For debugging */}
        <TouchableOpacity 
          style={styles.connectionTestButton}
          onPress={async () => {
            const isConnected = await testBackendConnection();
            Alert.alert(
              'Connection Test', 
              isConnected 
                ? '✅ Backend is connected successfully!' 
                : '❌ Cannot connect to backend. Please check if the server is running.'
            );
          }}>
          <Text style={styles.connectionTestText}>Test Backend Connection</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Show me your ingredients</Text>
        <Text style={styles.subtitle}>Upload a photo or add them manually</Text>

        <View style={styles.inputSection}>
          <View style={styles.photoControls}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePhotoUpload}
              disabled={loading}
              accessibilityLabel="Upload photo of ingredients"
              accessibilityRole="button">
              <Upload size={20} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.photoButtonText}>
                {loading ? 'Processing...' : 'Upload Photo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
              disabled={loading}
              accessibilityLabel="Take photo of ingredients"
              accessibilityRole="button">
              <Camera size={20} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.photoButtonText}>
                {loading ? 'Processing...' : 'Take Photo'}
              </Text>
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
              editable={!loading}
              accessibilityLabel="Ingredient input"
            />
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceInput}
              disabled={loading}
              accessibilityLabel="Voice input"
              accessibilityRole="button">
              <Mic size={20} color="#6C8BE6" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.addButton,
                (!inputText.trim() || loading) && { opacity: 0.5 }
              ]}
              onPress={addIngredient}
              disabled={!inputText.trim() || loading}
              accessibilityLabel="Add ingredient"
              accessibilityRole="button">
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6C8BE6" />
            <Text style={styles.loadingText}>{loadingStatus || 'Processing...'}</Text>
          </View>
        )}

        {ingredients.length > 0 && (
          <View style={styles.ingredientsList}>
            <Text style={styles.ingredientsTitle}>Your Ingredients</Text>
            <View style={styles.ingredientChips}>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientChip}>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                  <TouchableOpacity
                    onPress={() => removeIngredient(index)}
                    disabled={loading}
                    accessibilityLabel={`Remove ${ingredient}`}
                    accessibilityRole="button">
                    <X size={16} color="#6B7280" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {showResults && recipes.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Recipe Suggestions</Text>
            <View style={styles.recipeGrid}>
              {recipes.map((recipe) => (
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
                    {recipe.costBreakdown && (
                      <Text style={styles.costText}>{recipe.costBreakdown}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Help Section when no results */}
        {!loading && !showResults && (
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>How to Use</Text>
            <Text style={styles.helpText}>
              1. Take a photo of your ingredients or add them manually
            </Text>
            <Text style={styles.helpText}>
              2. We'll identify what you have and suggest recipes
            </Text>
            <Text style={styles.helpText}>
              3. Tap on a recipe to view full details
            </Text>
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
  // Connection Test Button
  connectionTestButton: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  connectionTestText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
  // Loading Indicator
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginBottom: 24,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#6C8BE6',
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
  costText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // Help Section
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
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