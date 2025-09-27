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
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Camera, Upload, Mic, Plus, X, Clock, Users, Search, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// Configuration - Use your actual backend URL
const API_BASE_URL = 'http://192.168.1.100:8001';

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

  const makeApiCall = async (endpoint: string, method: string, data?: any): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on ' + API_BASE_URL);
      }
      throw error;
    }
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
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
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        Alert.alert('Connection Error', `Cannot connect to backend server at ${API_BASE_URL}.`);
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
        } else {
          throw new Error(response.error || 'Failed to extract ingredients from photo');
        }
      }
    } catch (error: any) {
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
        Alert.alert('Connection Error', `Cannot connect to backend server at ${API_BASE_URL}.`);
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
        } else {
          throw new Error(response.error || 'Failed to extract ingredients from photo');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to extract ingredients from photo');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handleVoiceInput = () => {
    Alert.alert('Voice Input', 'Voice recognition will be available soon');
  };

  const openRecipeDetail = (recipe: Recipe) => {
    router.push({
      pathname: '/recipe-detail',
      params: { 
        recipe: JSON.stringify(recipe),
        from: 'fridge'
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#2D3748" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>What's in My Fridge</Text>
          <Text style={styles.headerSubtitle}>AI-powered recipe suggestions</Text>
        </View>
        <View style={styles.headerIcon}>
          <Sparkles size={20} color="#7C3AED" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Input Section */}
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Add Your Ingredients</Text>
          <Text style={styles.inputSubtitle}>Upload a photo or add ingredients manually</Text>
          
          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePhotoUpload}
              disabled={loading}>
              <View style={styles.photoButtonIcon}>
                <Upload size={22} color="#7C3AED" />
              </View>
              <Text style={styles.photoButtonText}>Upload Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
              disabled={loading}>
              <View style={styles.photoButtonIcon}>
                <Camera size={22} color="#7C3AED" />
              </View>
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or add manually</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#A0AEC0" style={styles.searchIcon} />
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type ingredients (tomato, onion, chicken...)"
                placeholderTextColor="#A0AEC0"
                returnKeyType="done"
                onSubmitEditing={addIngredient}
                editable={!loading}
              />
            </View>
            <TouchableOpacity
              style={[styles.addButton, (!inputText.trim() || loading) && styles.addButtonDisabled]}
              onPress={addIngredient}
              disabled={!inputText.trim() || loading}>
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.loadingText}>{loadingStatus}</Text>
          </View>
        )}

        {/* Ingredients List */}
        {ingredients.length > 0 && (
          <View style={styles.ingredientsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Ingredients</Text>
              <Text style={styles.ingredientCount}>{ingredients.length} items</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ingredientsScroll}>
              <View style={styles.ingredientChips}>
                {ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientChip}>
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                    <TouchableOpacity
                      onPress={() => removeIngredient(index)}
                      disabled={loading}
                      style={styles.removeButton}>
                      <X size={14} color="#718096" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Recipe Results */}
        {showResults && recipes.length > 0 && (
          <View style={styles.recipesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recipe Suggestions</Text>
              <Text style={styles.recipeCount}>{recipes.length} recipes</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipesScroll}>
              <View style={styles.recipeCards}>
                {recipes.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.recipeCard}
                    onPress={() => openRecipeDetail(recipe)}>
                    <View style={styles.recipeImage}>
                      <Text style={styles.recipeEmoji}>{recipe.image}</Text>
                    </View>
                    <View style={styles.recipeContent}>
                      <Text style={styles.recipeTitle}>{recipe.title}</Text>
                      <View style={styles.recipeMeta}>
                        <View style={styles.metaItem}>
                          <Clock size={12} color="#718096" />
                          <Text style={styles.metaText}>{recipe.time}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Users size={12} color="#718096" />
                          <Text style={styles.metaText}>{recipe.servings}</Text>
                        </View>
                      </View>
                      <Text style={styles.recipeCalories}>{recipe.calories} calories</Text>
                      {recipe.cuisine && (
                        <View style={styles.cuisineTag}>
                          <Text style={styles.cuisineText}>{recipe.cuisine}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Help Section */}
        {!loading && !showResults && (
          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Sparkles size={24} color="#7C3AED" />
            </View>
            <Text style={styles.helpTitle}>How It Works</Text>
            <View style={styles.helpSteps}>
              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.helpText}>Take a photo of your ingredients or add them manually</Text>
              </View>
              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.helpText}>AI will analyze and suggest perfect recipes</Text>
              </View>
              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.helpText}>Tap on a recipe to view full details and instructions</Text>
              </View>
            </View>
          </View>
        )}
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
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  inputSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 24,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginLeft: 16,
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#2D3748',
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  ingredientsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  ingredientCount: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  ingredientsScroll: {
    flexGrow: 0,
  },
  ingredientChips: {
    flexDirection: 'row',
    gap: 8,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ingredientText: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
  },
  removeButton: {
    padding: 2,
  },
  recipesSection: {
    margin: 16,
  },
  recipeCount: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  recipesScroll: {
    flexGrow: 0,
  },
  recipeCards: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 16,
  },
  recipeCard: {
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  recipeEmoji: {
    fontSize: 48,
  },
  recipeContent: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#718096',
  },
  recipeCalories: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
    marginBottom: 8,
  },
  cuisineTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cuisineText: {
    fontSize: 10,
    color: '#38A169',
    fontWeight: '600',
  },
  helpCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 20,
  },
  helpSteps: {
    gap: 16,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
});