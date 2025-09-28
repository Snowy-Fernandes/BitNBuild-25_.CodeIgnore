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
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
const [userId, setUserId] = useState('demo-user-id'); // Replace with actual user ID from auth
import { 
  ChevronLeft, 
  MessageCircle,
  Camera,
  Upload,
  Sparkles,
  Clock,
  Users,
  Edit3,
  AlertCircle,
  Type,
  Image as ImageIcon,
  Plus,
  X,
  Zap,
  Leaf,
  Utensils,
  ChefHat,
} from 'lucide-react-native';

// Configuration - Use your actual backend URL
const API_BASE_URL = 'http://localhost:5000'; // For iOS simulator
// const API_BASE_URL = 'http://10.0.2.2:5000'; // For Android emulator
// const API_BASE_URL = 'http://192.168.x.x:5000'; // For physical device

interface Recipe {
  id: string;
  title: string;
  image: string;
  time: string;
  servings: string;
  calories: string;
  source: string;
  confidence: string;
  ingredients?: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  instructions?: string[];
  cuisine?: string;
  difficulty?: string;
  tags?: string[];
  nutritional_info?: {
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
}

interface ApiResponse {
  success: boolean;
  recipe?: Recipe;
  recipes?: Recipe[];
  error?: string;
  message?: string;
}

type TabType = 'image' | 'text';

interface EnhancementOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  action: string;
}

export default function RecipeExtractorScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [dishName, setDishName] = useState('');
  const [extractedRecipes, setExtractedRecipes] = useState<Recipe[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [enhanceModalVisible, setEnhanceModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [customEnhancementText, setCustomEnhancementText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Enhancement options
  const enhancementOptions: EnhancementOption[] = [
    {
      id: 'vegetarian',
      title: 'Make Vegetarian',
      description: 'Convert to vegetarian-friendly recipe',
      icon: Leaf,
      color: '#10B981',
      action: 'vegetarian',
    },
    {
      id: 'non-vegetarian',
      title: 'Add Non-Veg',
      description: 'Add meat/protein options',
      icon: Utensils,
      color: '#EF4444',
      action: 'non-vegetarian',
    },
    {
      id: 'healthier',
      title: 'Make Healthier',
      description: 'Reduce calories and add nutrition',
      icon: Zap,
      color: '#F59E0B',
      action: 'healthier',
    },
    {
      id: 'spicier',
      title: 'Add More Spice',
      description: 'Increase spice level and heat',
      icon: ChefHat,
      color: '#DC2626',
      action: 'spicier',
    },
    {
      id: 'portions',
      title: 'Double Portions',
      description: 'Scale recipe for more servings',
      icon: Plus,
      color: '#7C3AED',
      action: 'double-portions',
    },
    {
      id: 'custom',
      title: 'Custom Changes',
      description: 'Describe your specific modifications',
      icon: Edit3,
      color: '#6C8BE6',
      action: 'custom',
    },
  ];

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
      if (error.message && error.message.includes('Network request failed')) {
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

  // Photo upload and processing
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
        setExtracting(true);
        setExtractionStatus('Analyzing photo...');

        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const response = await makeApiCall('/extractor/photo', 'POST', {
          image: base64Image
        });

        if (response.success && response.recipe) {
          setExtractedRecipes([response.recipe]);
          setShowResults(true);
          Alert.alert('Success', 'Recipe extracted successfully from photo!');
        } else {
          throw new Error(response.error || 'Failed to extract recipe from photo');
        }
      }
    } catch (error: any) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', error.message || 'Failed to extract recipe from photo');
    } finally {
      setExtracting(false);
      setExtractionStatus('');
    }
  };

  // Camera capture
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
        setExtracting(true);
        setExtractionStatus('Analyzing photo...');

        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const response = await makeApiCall('/extractor/photo', 'POST', {
          image: base64Image
        });

        if (response.success && response.recipe) {
          setExtractedRecipes([response.recipe]);
          setShowResults(true);
          Alert.alert('Success', 'Recipe extracted successfully from photo!');
        } else {
          throw new Error(response.error || 'Failed to extract recipe from photo');
        }
      }
    } catch (error: any) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', error.message || 'Failed to extract recipe from photo');
    } finally {
      setExtracting(false);
      setExtractionStatus('');
    }
  };

  // Dish name generation
  const handleDishNameExtract = async () => {
    if (!dishName.trim()) {
      Alert.alert('Input Required', 'Please enter a dish name');
      return;
    }

    try {
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        Alert.alert(
          'Connection Error', 
          `Cannot connect to backend server at ${API_BASE_URL}. Please make sure the server is running.`
        );
        return;
      }

      setExtracting(true);
      setExtractionStatus('Generating recipe...');

      const response = await makeApiCall('/extractor/dish-name', 'POST', {
        dishName: dishName.trim()
      });

      if (response.success && response.recipe) {
        setExtractedRecipes([response.recipe]);
        setShowResults(true);
        Alert.alert('Success', 'Recipe generated successfully!');
      } else {
        throw new Error(response.error || 'Failed to generate recipe');
      }
    } catch (error: any) {
      console.error('Dish name extraction error:', error);
      Alert.alert('Error', error.message || 'Failed to generate recipe');
    } finally {
      setExtracting(false);
      setExtractionStatus('');
    }
  };

  // Open recipe detail
  const openRecipeDetail = (recipe: Recipe) => {
    // Navigate to recipe detail screen with all recipe data
    router.push({
      pathname: '/recipe-detail',
      params: {
        recipe: JSON.stringify(recipe), // Pass the entire recipe object as string
        from: 'extractor'
      }
    });
  };

  // Open enhance modal
  const openEnhanceModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setEnhanceModalVisible(true);
    setShowCustomInput(false);
    setCustomEnhancementText('');
  };

  // Close enhance modal
  const closeEnhanceModal = () => {
    setEnhanceModalVisible(false);
    setSelectedRecipe(null);
    setShowCustomInput(false);
    setCustomEnhancementText('');
  };

  // Handle enhancement option selection
  const handleEnhancementOption = (option: EnhancementOption) => {
    if (option.action === 'custom') {
      setShowCustomInput(true);
    } else {
      applyEnhancement(option.action);
    }
  };

  // Apply custom enhancement
  const applyCustomEnhancement = () => {
    if (!customEnhancementText.trim()) {
      Alert.alert('Input Required', 'Please describe the changes you want to make.');
      return;
    }
    applyEnhancement('custom', customEnhancementText.trim());
  };

  // Apply enhancement
  const applyEnhancement = async (enhancementType: string, customText?: string) => {
    if (!selectedRecipe) return;

    try {
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        Alert.alert(
          'Connection Error', 
          `Cannot connect to backend server at ${API_BASE_URL}. Please make sure the server is running.`
        );
        return;
      }

      closeEnhanceModal();
      setExtracting(true);
      setExtractionStatus('Enhancing recipe...');

      const enhancementData: any = {
        recipeId: selectedRecipe.id,
        enhancementType,
      };

      if (customText) {
        enhancementData.customInstructions = customText;
      }

      const response = await makeApiCall('/extractor/enhance', 'POST', enhancementData);

      if (response.success && response.recipe) {
        setExtractedRecipes(prev => 
          prev.map(recipe => 
            recipe.id === selectedRecipe.id ? response.recipe! : recipe
          )
        );
        Alert.alert('Success', 'Recipe enhanced successfully!');
      } else {
        throw new Error(response.error || 'Failed to enhance recipe');
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      Alert.alert('Error', error.message || 'Failed to enhance recipe');
    } finally {
      setExtracting(false);
      setExtractionStatus('');
    }
  };
// Save recipe to database
const saveRecipeToDatabase = async (recipe: Recipe): Promise<boolean> => {
  try {
    console.log('Attempting to save recipe to database:', recipe.title);
    
    const response = await makeApiCall('/extractor/save', 'POST', {
      recipe: recipe,
      user_id: userId
    });

    if (response.success) {
      console.log('Recipe saved successfully with ID:', response.recipe_id);
      return true;
    } else {
      console.error('Save failed:', response.error);
      return false;
    }
  } catch (error: any) {
    console.error('Error saving recipe:', error);
    return false;
  }
};
  // Tab configurations (URL removed)
  const tabs = [
    {
      id: 'image' as TabType,
      title: 'Image',
      icon: ImageIcon,
      description: 'Upload or take photos',
    },
    {
      id: 'text' as TabType,
      title: 'Text',
      icon: Type,
      description: 'Enter dish name',
    },
  ];

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'image':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Photo Analysis</Text>
            <Text style={styles.tabSubtitle}>
              Take a photo or upload from gallery to extract recipe information
            </Text>
            
            <View style={styles.imageUploadArea}>
              <View style={styles.uploadIcon}>
                <ImageIcon size={48} color="#6C8BE6" strokeWidth={1.5} />
              </View>
              <Text style={styles.uploadMainText}>Upload Food Photo</Text>
              <Text style={styles.uploadSubText}>
                Clear, well-lit photos work best for accurate extraction
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTakePhoto}
                disabled={extracting}>
                <Camera size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.primaryButtonText}>
                  {extracting ? 'Processing...' : 'Take Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handlePhotoUpload}
                disabled={extracting}>
                <Upload size={20} color="#6C8BE6" strokeWidth={2} />
                <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'text':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Dish Name Generator</Text>
            <Text style={styles.tabSubtitle}>
              Enter any dish name and we'll generate a complete recipe for you
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Dish Name</Text>
              <TextInput
                style={styles.textInput}
                value={dishName}
                onChangeText={setDishName}
                placeholder="e.g., Chicken Tikka Masala, Pasta Carbonara, Thai Green Curry"
                placeholderTextColor="#9CA3AF"
                editable={!extracting}
                multiline={false}
                autoCapitalize="words"
              />
              <Text style={styles.inputHint}>
                Be specific for better results. Include cuisine type if known.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!dishName.trim() || extracting) && styles.primaryButtonDisabled,
              ]}
              onPress={handleDishNameExtract}
              disabled={!dishName.trim() || extracting}>
              <Sparkles size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.primaryButtonText}>
                {extracting ? 'Generating...' : 'Generate Recipe'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // Render enhancement modal
  const renderEnhancementModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={enhanceModalVisible}
      onRequestClose={closeEnhanceModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enhance Recipe</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeEnhanceModal}>
              <X size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Recipe Info */}
          {selectedRecipe && (
            <View style={styles.selectedRecipeInfo}>
              <Text style={styles.selectedRecipeTitle}>
                {selectedRecipe.title}
              </Text>
              <Text style={styles.selectedRecipeSubtitle}>
                Choose how you'd like to enhance this recipe
              </Text>
            </View>
          )}

          {!showCustomInput ? (
            <>
              {/* Enhancement Options */}
              <ScrollView style={styles.enhancementOptions} showsVerticalScrollIndicator={false}>
                {enhancementOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.enhancementOption}
                      onPress={() => handleEnhancementOption(option)}>
                      <View style={[styles.enhancementIcon, { backgroundColor: `${option.color}15` }]}>
                        <IconComponent size={24} color={option.color} strokeWidth={2} />
                      </View>
                      <View style={styles.enhancementContent}>
                        <Text style={styles.enhancementTitle}>{option.title}</Text>
                        <Text style={styles.enhancementDescription}>{option.description}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <>
              {/* Custom Enhancement Input */}
              <View style={styles.customInputSection}>
                <Text style={styles.customInputLabel}>Describe Your Changes</Text>
                <TextInput
                  style={styles.customTextInput}
                  value={customEnhancementText}
                  onChangeText={setCustomEnhancementText}
                  placeholder="E.g., 'Make it spicier with more chili', 'Add Mediterranean herbs', 'Reduce cooking time'"
                  placeholderTextColor="#9CA3AF"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.customInputHint}>
                  Be specific about what changes you want to make to the recipe
                </Text>
              </View>

              {/* Custom Input Actions */}
              <View style={styles.customInputActions}>
                <TouchableOpacity
                  style={styles.backToOptionsButton}
                  onPress={() => setShowCustomInput(false)}>
                  <Text style={styles.backToOptionsButtonText}>Back to Options</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.applyCustomButton,
                    !customEnhancementText.trim() && styles.applyCustomButtonDisabled
                  ]}
                  onPress={applyCustomEnhancement}
                  disabled={!customEnhancementText.trim()}>
                  <Sparkles size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.applyCustomButtonText}>Apply Changes</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Back to home"
          accessibilityRole="button">
          <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Extractor</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setActiveTab(tab.id)}
                accessibilityLabel={`${tab.title} tab`}
                accessibilityRole="tab">
                <View style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                  <IconComponent 
                    size={20} 
                    color={isActive ? '#6C8BE6' : '#9CA3AF'} 
                    strokeWidth={2} 
                  />
                </View>
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab.title}
                </Text>
                <Text style={[styles.tabDescription, isActive && styles.activeTabDescription]}>
                  {tab.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
        </TouchableOpacity>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Extraction Status */}
        {extracting && (
          <View style={styles.extractingIndicator}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6C8BE6" />
              <Text style={styles.extractingText}>
                {extractionStatus || 'Processing...'}
              </Text>
            </View>
            {extractionStatus.includes('photo') && (
              <Text style={styles.extractingSubtext}>
                Using AI vision to identify ingredients and cooking methods
              </Text>
            )}
            {extractionStatus.includes('recipe') && (
              <Text style={styles.extractingSubtext}>
                Creating detailed instructions and ingredient list
              </Text>
            )}
            {extractionStatus.includes('Enhancing') && (
              <Text style={styles.extractingSubtext}>
                Applying your requested modifications to the recipe
              </Text>
            )}
          </View>
        )}

        {/* Results Section */}
        {showResults && extractedRecipes.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Extracted Recipe</Text>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>
                  {extractedRecipes.length} result{extractedRecipes.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            
            <View style={styles.recipeGrid}>
              {extractedRecipes.map((recipe) => (
                <View key={recipe.id} style={styles.recipeCard}>
                  <TouchableOpacity
                    style={styles.recipeCardContent}
                    onPress={() => openRecipeDetail(recipe)}>
                    <View style={styles.recipeImageContainer}>
                      <Text style={styles.recipeEmoji}>{recipe.image}</Text>
                    </View>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeTitle}>{recipe.title}</Text>
                      <Text style={styles.recipeSource}>
                        {recipe.source} • {recipe.confidence} match
                      </Text>
                      <View style={styles.recipeMeta}>
                        <View style={styles.metaItem}>
                          <Clock size={12} color="#6B7280" strokeWidth={2} />
                          <Text style={styles.metaText}>{recipe.time}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Users size={12} color="#6B7280" strokeWidth={2} />
                          <Text style={styles.metaText}>{recipe.servings}</Text>
                        </View>
                        <Text style={styles.caloriesText}>{recipe.calories}</Text>
                      </View>
                      {recipe.cuisine && (
                        <Text style={styles.cuisineTag}>{recipe.cuisine}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.enhanceButton}
                      onPress={() => openEnhanceModal(recipe)}
                      disabled={extracting}>
                      <Sparkles size={16} color="#6C8BE6" strokeWidth={2} />
                      <Text style={styles.enhanceButtonText}>Enhance</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => openRecipeDetail(recipe)}>
                      <Text style={styles.viewButtonText}>View Recipe</Text>
                    </TouchableOpacity>
                  </View>

                  {recipe.tags && recipe.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {recipe.tags.slice(0, 3).map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Help Section */}
        {!extracting && !showResults && (
          <View style={styles.helpSection}>
            <View style={styles.helpHeader}>
              <AlertCircle size={20} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.helpTitle}>Tips for Best Results</Text>
            </View>
            
            <View style={styles.tipsList}>
              {activeTab === 'image' && (
                <>
                  <Text style={styles.tipItem}>• Use clear, well-lit photos</Text>
                  <Text style={styles.tipItem}>• Ensure food is clearly visible</Text>
                  <Text style={styles.tipItem}>• Avoid blurry or dark images</Text>
                </>
              )}
              {activeTab === 'text' && (
                <>
                  <Text style={styles.tipItem}>• Be specific with dish names</Text>
                  <Text style={styles.tipItem}>• Include cuisine type when possible</Text>
                  <Text style={styles.tipItem}>• Use common dish names for better accuracy</Text>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Enhancement Modal */}
      {renderEnhancementModal()}

    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  
  // Connection Test Button
  connectionTestButton: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  connectionTestText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // ... (rest of your styles remain the same - they are correct)
  // Tabs
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabIcon: {
    marginBottom: 4,
  },
  activeTabIcon: {},
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 2,
  },
  activeTabText: {
    color: '#6C8BE6',
    fontWeight: '600',
  },
  tabDescription: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  activeTabDescription: {
    color: '#6C8BE6',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Tab Content
  tabContent: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  tabSubtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 32,
  },

  // Image Upload Area
  imageUploadArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    marginBottom: 16,
  },
  uploadMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  uploadSubText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Input Container
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  urlInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  urlInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 12,
  },
  inputHint: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },

  // Buttons
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6C8BE6',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C8BE6',
  },

  // Extraction Indicator
  extractingIndicator: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  extractingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  extractingSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Results Section
  resultsSection: {
    marginBottom: 32,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  resultsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Recipe Grid
  recipeGrid: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeCardContent: {
    flexDirection: 'row',
    padding: 20,
  },
  recipeImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  recipeSource: {
    fontSize: 12,
    color: '#6C8BE6',
    fontWeight: '500',
    marginBottom: 12,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  caloriesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  cuisineTag: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },

  // Card Actions
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  enhanceButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomLeftRadius: 16,
  },
  enhanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#6C8BE6',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomRightRadius: 16,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Help Section
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRecipeInfo: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedRecipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  selectedRecipeSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Enhancement Options
  enhancementOptions: {
    flex: 1,
    paddingHorizontal: 24,
  },
  enhancementOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  enhancementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  enhancementContent: {
    flex: 1,
  },
  enhancementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  enhancementDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Custom Input Section
  customInputSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  customTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 120,
    marginBottom: 8,
  },
  customInputHint: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  customInputActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  backToOptionsButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToOptionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  applyCustomButton: {
    flex: 2,
    backgroundColor: '#6C8BE6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyCustomButtonDisabled: {
    opacity: 0.5,
  },
  applyCustomButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Floating Button
  chatbotFloat: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C8BE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C8BE6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});