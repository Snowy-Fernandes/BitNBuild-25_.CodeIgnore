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
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  ChevronLeft, 
  MessageCircle,
  Camera,
  Upload,
  Sparkles,
  AlertCircle,
  Type,
  Image as ImageIcon,
  X,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

// Configuration - Use your actual backend URL
const API_BASE_URL = 'http://localhost:5000'; // For iOS simulator
// const API_BASE_URL = 'http://10.0.2.2:5000'; // For Android emulator
// const API_BASE_URL = 'http://192.168.x.x:5000'; // For physical device

interface NutritionData {
  id: string;
  description: string;
  totalCalories: number;
  macros: {
    protein: { value: number; percentage: number };
    carbs: { value: number; percentage: number };
    fats: { value: number; percentage: number };
  };
  micronutrients: Array<{
    name: string;
    value: string;
    daily: string;
  }>;
  identifiedIngredients: Array<{
    id: number;
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
  suggestions: Array<{
    id: number;
    type: 'reduce' | 'add' | 'balance';
    title: string;
    description: string;
    impact: string;
    icon: string;
  }>;
  confidence?: string;
  analysisTime?: string;
  image?: string;
}

interface ApiResponse {
  success: boolean;
  data?: NutritionData;
  error?: string;
  message?: string;
}

type TabType = 'image' | 'text';

export default function NutritionExtractorScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [foodDescription, setFoodDescription] = useState('');
  const [extractedNutrition, setExtractedNutrition] = useState<NutritionData | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on ' + API_BASE_URL);
      }
      
      throw error;
    }
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  };

  // Photo upload and processing
  const handlePhotoUpload = async () => {
    try {
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
        setAnalyzing(true);
        setAnalysisStatus('Analyzing food image...');
        setSelectedImage(result.assets[0].uri);

        const base64Image = result.assets[0].base64;
        
        const response = await makeApiCall('/api/analyze-nutrition', 'POST', {
          imageBase64: base64Image
        });

        if (response.success && response.data) {
          setExtractedNutrition(response.data);
          setShowResults(true);
          Alert.alert('Success', 'Nutrition analysis completed successfully!');
        } else {
          throw new Error(response.error || 'Failed to analyze nutrition from photo');
        }
      }
    } catch (error: any) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', error.message || 'Failed to analyze nutrition from photo');
    } finally {
      setAnalyzing(false);
      setAnalysisStatus('');
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
        setAnalyzing(true);
        setAnalysisStatus('Analyzing food image...');
        setSelectedImage(result.assets[0].uri);

        const base64Image = result.assets[0].base64;
        
        const response = await makeApiCall('/api/analyze-nutrition', 'POST', {
          imageBase64: base64Image
        });

        if (response.success && response.data) {
          setExtractedNutrition(response.data);
          setShowResults(true);
          Alert.alert('Success', 'Nutrition analysis completed successfully!');
        } else {
          throw new Error(response.error || 'Failed to analyze nutrition from photo');
        }
      }
    } catch (error: any) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', error.message || 'Failed to analyze nutrition from photo');
    } finally {
      setAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  // Text description analysis
  const handleTextAnalysis = async () => {
    if (!foodDescription.trim()) {
      Alert.alert('Input Required', 'Please describe the food you want to analyze');
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

      setAnalyzing(true);
      setAnalysisStatus('Analyzing food description...');

      const response = await makeApiCall('/api/analyze-nutrition', 'POST', {
        description: foodDescription.trim()
      });

      if (response.success && response.data) {
        setExtractedNutrition(response.data);
        setShowResults(true);
        Alert.alert('Success', 'Nutrition analysis completed successfully!');
      } else {
        throw new Error(response.error || 'Failed to analyze nutrition from description');
      }
    } catch (error: any) {
      console.error('Text analysis error:', error);
      Alert.alert('Error', error.message || 'Failed to analyze nutrition from description');
    } finally {
      setAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  // Macro Circle Component
  const MacroCircle = ({ macro, color, label }: { macro: any; color: string; label: string }) => (
    <View style={styles.macroCircle}>
      <View style={[styles.macroRing, { borderColor: color }]}>
        <Text style={styles.macroValue}>{macro.value}g</Text>
      </View>
      <Text style={styles.macroLabel}>{macro.percentage}%</Text>
      <Text style={styles.macroTitle}>{label}</Text>
    </View>
  );

  // Tab configurations
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
      description: 'Describe your food',
    },
  ];

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'image':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Food Image Analysis</Text>
            <Text style={styles.tabSubtitle}>
              Take a photo or upload from gallery to analyze nutrition content
            </Text>
            
            <View style={styles.imageUploadArea}>
              {selectedImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}>
                    <X size={16} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.uploadIcon}>
                    <ImageIcon size={48} color="#6C8BE6" strokeWidth={1.5} />
                  </View>
                  <Text style={styles.uploadMainText}>Upload Food Photo</Text>
                  <Text style={styles.uploadSubText}>
                    Clear, well-lit photos of meals work best for accurate analysis
                  </Text>
                </>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTakePhoto}
                disabled={analyzing}>
                <Camera size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.primaryButtonText}>
                  {analyzing ? 'Processing...' : 'Take Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handlePhotoUpload}
                disabled={analyzing}>
                <Upload size={20} color="#6C8BE6" strokeWidth={2} />
                <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'text':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Food Description Analysis</Text>
            <Text style={styles.tabSubtitle}>
              Describe your meal and we'll provide detailed nutrition analysis
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Food Description</Text>
              <TextInput
                style={styles.textInput}
                value={foodDescription}
                onChangeText={setFoodDescription}
                placeholder="e.g., Grilled chicken breast with brown rice and steamed vegetables, 200g salmon with quinoa salad, etc."
                placeholderTextColor="#9CA3AF"
                editable={!analyzing}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.inputHint}>
                Be specific about ingredients, quantities, and preparation methods for better accuracy.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!foodDescription.trim() || analyzing) && styles.primaryButtonDisabled,
              ]}
              onPress={handleTextAnalysis}
              disabled={!foodDescription.trim() || analyzing}>
              <Sparkles size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.primaryButtonText}>
                {analyzing ? 'Analyzing...' : 'Analyze Nutrition'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

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
        <Text style={styles.headerTitle}>Nutrition Analyzer</Text>
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
                ? 'Backend is connected successfully!' 
                : 'Cannot connect to backend. Please check if the server is running.'
            );
          }}>
        </TouchableOpacity>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Analysis Status */}
        {analyzing && (
          <View style={styles.analyzingIndicator}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6C8BE6" />
              <Text style={styles.analyzingText}>
                {analysisStatus || 'Analyzing...'}
              </Text>
            </View>
            {analysisStatus.includes('image') && (
              <Text style={styles.analyzingSubtext}>
                Using AI vision to identify food items and estimate nutrition
              </Text>
            )}
            {analysisStatus.includes('description') && (
              <Text style={styles.analyzingSubtext}>
                Analyzing nutritional content based on your description
              </Text>
            )}
          </View>
        )}

        {/* Results Section */}
        {showResults && extractedNutrition && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Nutrition Analysis</Text>
            </View>
            
            {/* Meal Description */}
            <View style={styles.mealDescriptionCard}>
              <Text style={styles.mealDescriptionTitle}>Meal Description</Text>
              <Text style={styles.mealDescriptionText}>"{extractedNutrition.description}"</Text>
            </View>

            {/* Calories Overview */}
            <View style={styles.caloriesCard}>
              <Text style={styles.caloriesTitle}>Total Calories</Text>
              <Text style={styles.caloriesValue}>{extractedNutrition.totalCalories}</Text>
              <Text style={styles.caloriesSubtitle}>Estimated Energy Content</Text>
            </View>

            {/* Macros Grid */}
            <View style={styles.macrosSection}>
              <Text style={styles.sectionTitle}>Macronutrients</Text>
              <View style={styles.macrosGrid}>
                <MacroCircle 
                  macro={extractedNutrition.macros.protein} 
                  color="#6C8BE6" 
                  label="Protein" 
                />
                <MacroCircle 
                  macro={extractedNutrition.macros.carbs} 
                  color="#BFAFF7" 
                  label="Carbs" 
                />
                <MacroCircle 
                  macro={extractedNutrition.macros.fats} 
                  color="#F59E0B" 
                  label="Fats" 
                />
              </View>
            </View>

            {/* Ingredients */}
            <View style={styles.ingredientsSection}>
              <Text style={styles.sectionTitle}>Identified Ingredients</Text>
              {extractedNutrition.identifiedIngredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientCard}>
                  <View style={styles.ingredientHeader}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientQuantity}>{ingredient.quantity}</Text>
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

            {/* Micronutrients */}
            <View style={styles.microSection}>
              <Text style={styles.sectionTitle}>Micronutrients</Text>
              <View style={styles.microGrid}>
                {extractedNutrition.micronutrients.map((micro, index) => (
                  <View key={index} style={styles.microCard}>
                    <Text style={styles.microName}>{micro.name}</Text>
                    <Text style={styles.microValue}>{micro.value}</Text>
                    <Text style={styles.microDaily}>{micro.daily} daily</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Suggestions */}
            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionTitle}>Smart Suggestions</Text>
              {extractedNutrition.suggestions.map((suggestion) => (
                <View key={suggestion.id} style={styles.suggestionCard}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                      <Text style={styles.suggestionDescription}>
                        {suggestion.description}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.suggestionImpact}>
                    Impact: {suggestion.impact}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.newAnalysisButton}
                onPress={() => {
                  setShowResults(false);
                  setExtractedNutrition(null);
                  setSelectedImage(null);
                  setFoodDescription('');
                }}>
                <Camera size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Help Section */}
        {!analyzing && !showResults && (
          <View style={styles.helpSection}>
            <View style={styles.helpHeader}>
              <AlertCircle size={20} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.helpTitle}>Tips for Best Results</Text>
            </View>
            
            <View style={styles.tipsList}>
              {activeTab === 'image' && (
                <>
                  <Text style={styles.tipItem}>• Use clear, well-lit photos of your meal</Text>
                  <Text style={styles.tipItem}>• Ensure food is clearly visible and not blurry</Text>
                  <Text style={styles.tipItem}>• Include the entire meal in the frame</Text>
                  <Text style={styles.tipItem}>• Avoid shadows covering the food</Text>
                </>
              )}
              {activeTab === 'text' && (
                <>
                  <Text style={styles.tipItem}>• Be specific about ingredients and quantities</Text>
                  <Text style={styles.tipItem}>• Include cooking methods (grilled, fried, etc.)</Text>
                  <Text style={styles.tipItem}>• Mention portion sizes when possible</Text>
                  <Text style={styles.tipItem}>• Include sauces and dressings</Text>
                </>
              )}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: Platform.OS === 'android' ? 4 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 3 : undefined,
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
  
  // Tabs
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: Platform.OS === 'android' ? 2 : 0,
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
    minWidth: screenWidth * 0.35,
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

  // Image Upload Area with improved design
  imageUploadArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    minHeight: 200,
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  uploadedImage: {
    width: screenWidth * 0.7,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: (screenWidth * 0.15) - 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 120,
    textAlignVertical: 'top',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
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
    elevation: Platform.OS === 'android' ? 3 : 0,
    shadowColor: Platform.OS === 'ios' ? '#6C8BE6' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 4 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 8 : undefined,
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
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C8BE6',
  },

  // Analysis Indicator
  analyzingIndicator: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  analyzingSubtext: {
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Meal Description
  mealDescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
  },
  mealDescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  mealDescriptionText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Calories Card with gradient-like effect
  caloriesCard: {
    backgroundColor: '#6C8BE6',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    elevation: Platform.OS === 'android' ? 4 : 0,
    shadowColor: Platform.OS === 'ios' ? '#6C8BE6' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 6 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 12 : undefined,
  },
  caloriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  caloriesValue: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  caloriesSubtitle: {
    fontSize: 14,
    color: '#E2E8F0',
  },

  // Sections
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },

  // Macros with improved spacing
  macrosSection: {
    marginBottom: 28,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
  },
  macroCircle: {
    alignItems: 'center',
  },
  macroRing: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    borderRadius: screenWidth * 0.1,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  macroLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Ingredients with improved cards
  ingredientsSection: {
    marginBottom: 28,
  },
  ingredientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: '#6C8BE6',
    fontWeight: '500',
  },
  ingredientNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C8BE6',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Micronutrients with responsive grid
  microSection: {
    marginBottom: 28,
  },
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  microCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: (screenWidth - 64) / 2, // Two columns with margins
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
  },
  microName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  microValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C8BE6',
    marginBottom: 4,
  },
  microDaily: {
    fontSize: 10,
    color: '#64748B',
  },

  // Suggestions with enhanced styling
  suggestionsSection: {
    marginBottom: 28,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  suggestionImpact: {
    fontSize: 12,
    color: '#BFAFF7',
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // Action Section - simplified
  actionSection: {
    marginTop: 8,
  },
  newAnalysisButton: {
    backgroundColor: '#6C8BE6',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: Platform.OS === 'android' ? 3 : 0,
    shadowColor: Platform.OS === 'ios' ? '#6C8BE6' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 4 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 8 : undefined,
  },
  newAnalysisButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Help Section with improved styling
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },

  // Floating Button with improved positioning
  chatbotFloat: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 30 : 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C8BE6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 6 : 0,
    shadowColor: Platform.OS === 'ios' ? '#6C8BE6' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 4 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 8 : undefined,
  },
});