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
import { 
  ChevronLeft, 
  MessageCircle,
  Camera,
  Upload,
  Link,
  Sparkles,
  Clock,
  Users,
  Edit3,
} from 'lucide-react-native';

const extractedRecipes = [
  {
    id: 1,
    title: 'Extracted Butter Chicken',
    image: '🍛',
    time: '45 min',
    servings: '4',
    calories: '520',
    source: 'Photo analysis',
    confidence: '95%',
  },
  {
    id: 2,
    title: 'Margherita Pizza (from URL)',
    image: '🍕',
    time: '30 min',
    servings: '2',
    calories: '380',
    source: 'Zomato URL',
    confidence: '98%',
  },
];

export default function RecipeExtractorScreen() {
  const [dishName, setDishName] = useState('');
  const [zomatoUrl, setZomatoUrl] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handlePhotoUpload = () => {
    Alert.alert('Photo Upload', 'Camera/gallery access will be available soon');
    simulateExtraction();
  };

  const handleExtract = () => {
    if (!dishName.trim() && !zomatoUrl.trim()) {
      Alert.alert('Input Required', 'Please enter a dish name or Zomato URL');
      return;
    }
    simulateExtraction();
  };

  const simulateExtraction = () => {
    setExtracting(true);
    setTimeout(() => {
      setExtracting(false);
      setShowResults(true);
    }, 2500);
  };

  const openRecipeDetail = (recipe: any) => {
    router.push({
      pathname: '/recipe-detail',
      params: {
        recipeId: recipe.id,
        from: 'extractor',
        title: recipe.title,
        time: recipe.time,
        servings: recipe.servings,
        calories: recipe.calories,
      }
    });
  };

  const modifyRecipe = (recipe: any) => {
    Alert.alert(
      'Modify Recipe',
      'Recipe modification will open an editing interface',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit Recipe', onPress: () => openRecipeDetail(recipe) },
      ]
    );
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
        <Text style={styles.headerTitle}>Recipe Extractor</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Extract recipes from any source</Text>
        <Text style={styles.subtitle}>
          Upload photos, enter dish names, or paste restaurant URLs
        </Text>

        <View style={styles.inputSection}>
          <View style={styles.photoSection}>
            <Text style={styles.sectionLabel}>Photo Analysis</Text>
            <View style={styles.photoControls}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePhotoUpload}
                accessibilityLabel="Upload photo from gallery"
                accessibilityRole="button">
                <Upload size={20} color="#6C8BE6" strokeWidth={2} />
                <Text style={styles.photoButtonText}>Upload Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePhotoUpload}
                accessibilityLabel="Take photo with camera"
                accessibilityRole="button">
                <Camera size={20} color="#6C8BE6" strokeWidth={2} />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or enter manually</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.textSection}>
            <Text style={styles.sectionLabel}>Dish Name</Text>
            <TextInput
              style={styles.textInput}
              value={dishName}
              onChangeText={setDishName}
              placeholder="e.g., Chicken Tikka Masala, Pasta Carbonara"
              placeholderTextColor="#6B7280"
              accessibilityLabel="Dish name input"
            />
          </View>

          <View style={styles.textSection}>
            <Text style={styles.sectionLabel}>Restaurant URL</Text>
            <View style={styles.urlInputContainer}>
              <Link size={20} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.urlInput}
                value={zomatoUrl}
                onChangeText={setZomatoUrl}
                placeholder="Paste Zomato, Swiggy, or restaurant URL"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Restaurant URL input"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.extractButton,
              (!dishName.trim() && !zomatoUrl.trim() || extracting) && styles.extractButtonDisabled,
            ]}
            onPress={handleExtract}
            disabled={(!dishName.trim() && !zomatoUrl.trim()) || extracting}
            accessibilityLabel="Extract recipe"
            accessibilityRole="button">
            {extracting ? (
              <Text style={styles.extractButtonText}>Extracting...</Text>
            ) : (
              <>
                <Sparkles size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.extractButtonText}>Extract Recipe</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {extracting && (
          <View style={styles.extractingIndicator}>
            <View style={styles.extractingAnimation} />
            <Text style={styles.extractingText}>Analyzing and extracting recipe...</Text>
          </View>
        )}

        {showResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Extracted Recipes</Text>
            <Text style={styles.resultsSubtitle}>
              Found {extractedRecipes.length} recipe{extractedRecipes.length !== 1 ? 's' : ''}
            </Text>
            
            <View style={styles.recipeGrid}>
              {extractedRecipes.map((recipe) => (
                <View key={recipe.id} style={styles.recipeCard}>
                  <TouchableOpacity
                    style={styles.recipeCardContent}
                    onPress={() => openRecipeDetail(recipe)}
                    accessibilityLabel={`Recipe: ${recipe.title}`}
                    accessibilityRole="button">
                    <View style={styles.recipeImage}>
                      <Text style={styles.recipeEmoji}>{recipe.image}</Text>
                    </View>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeTitle}>{recipe.title}</Text>
                      <Text style={styles.recipeSource}>
                        From {recipe.source} • {recipe.confidence} match
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
                        <Text style={styles.caloriesText}>{recipe.calories} cal</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modifyButton}
                    onPress={() => modifyRecipe(recipe)}
                    accessibilityLabel="Modify recipe"
                    accessibilityRole="button">
                    <Edit3 size={16} color="#6C8BE6" strokeWidth={2} />
                    <Text style={styles.modifyButtonText}>Modify Recipe</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Pro Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}></Text>
              <Text style={styles.tipText}>
                Clear, well-lit photos work best for extraction
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}></Text>
              <Text style={styles.tipText}>
                URLs from popular food apps give highest accuracy
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}></Text>
              <Text style={styles.tipText}>
                Be specific with dish names for better results
              </Text>
            </View>
          </View>
        </View>
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
  inputSection: {
    marginBottom: 32,
  },
  photoSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  photoControls: {
    flexDirection: 'row',
    gap: 12,
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
  textSection: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#EFF3FF',
    minHeight: 56,
  },
  urlInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EFF3FF',
    minHeight: 56,
  },
  urlInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  extractButton: {
    backgroundColor: '#6C8BE6',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  extractButtonDisabled: {
    opacity: 0.5,
  },
  extractButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  extractingIndicator: {
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  extractingAnimation: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C8BE6',
    marginBottom: 12,
  },
  extractingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  resultsSection: {
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  recipeGrid: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFF3FF',
    overflow: 'hidden',
  },
  recipeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    marginBottom: 4,
  },
  recipeSource: {
    fontSize: 12,
    color: '#BFAFF7',
    fontWeight: '500',
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 12,
    fontWeight: '500',
    color: '#6C8BE6',
  },
  modifyButton: {
    backgroundColor: '#EFF3FF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F6F8FB',
  },
  modifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipEmoji: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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