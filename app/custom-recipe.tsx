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
import { ChevronLeft, Mic, Sparkles, Clock, Users } from 'lucide-react-native';

const sampleRecipes = [
  {
    id: 1,
    title: 'Spicy Thai Basil Chicken',
    time: '20 min',
    servings: '3',
    calories: '385',
    image: '🍗',
    description: 'Aromatic stir-fry with fresh basil',
  },
  {
    id: 2,
    title: 'Creamy Mushroom Risotto',
    time: '35 min',
    servings: '4',
    calories: '420',
    image: '🍄',
    description: 'Rich and comforting Italian classic',
  },
];

export default function CustomRecipeScreen() {
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleVoiceInput = () => {
    if (isRecording) {
      setIsRecording(false);
      setPrompt('I want something spicy with chicken and vegetables');
      Alert.alert('Voice Input', 'Voice recorded successfully!');
    } else {
      setIsRecording(true);
      Alert.alert('Voice Input', 'Voice recording will be available soon');
      // Simulate recording
      setTimeout(() => {
        setIsRecording(false);
        setPrompt('I want something spicy with chicken and vegetables');
      }, 2000);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      Alert.alert('Please enter a recipe idea', 'Tell me what you\'d like to cook!');
      return;
    }

    setGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setGenerating(false);
      setShowResults(true);
    }, 2000);
  };

  const openRecipeDetail = (recipe: any) => {
    router.push({
      pathname: '/recipe-detail',
      params: { 
        recipeId: recipe.id,
        from: 'custom',
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
        <Text style={styles.headerTitle}>Generate Recipe</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What's on your mind?</Text>
        <Text style={styles.subtitle}>
          Describe what you'd like to cook and I'll create the perfect recipe
        </Text>

        <View style={styles.inputSection}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="I want to cook something..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Recipe prompt input"
            />
          </View>

          <View style={styles.inputActions}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonActive,
              ]}
              onPress={handleVoiceInput}
              accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice input'}
              accessibilityRole="button">
              <Mic 
                size={24} 
                color={isRecording ? '#FFFFFF' : '#6C8BE6'} 
                strokeWidth={2} 
              />
              {isRecording && <View style={styles.recordingDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.generateButton,
                (!prompt.trim() || generating) && styles.generateButtonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={!prompt.trim() || generating}
              accessibilityLabel="Generate recipe"
              accessibilityRole="button">
              {generating ? (
                <Text style={styles.generateButtonText}>Generating...</Text>
              ) : (
                <>
                  <Sparkles size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.generateButtonText}>Generate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingAnimation} />
              <Text style={styles.recordingText}>Listening...</Text>
            </View>
          )}
        </View>

        <View style={styles.quickPrompts}>
          <Text style={styles.quickPromptsTitle}>Quick Ideas</Text>
          <View style={styles.promptChips}>
            {[
              'Healthy lunch under 30 mins',
              'Comfort food for rainy day',
              'Impressive dinner for guests',
              'Quick breakfast with eggs',
              'Vegetarian pasta dish',
              'Spicy Asian stir-fry',
            ].map((promptText, index) => (
              <TouchableOpacity
                key={index}
                style={styles.promptChip}
                onPress={() => setPrompt(promptText)}
                accessibilityLabel={`Quick prompt: ${promptText}`}
                accessibilityRole="button">
                <Text style={styles.promptChipText}>{promptText}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {showResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Generated Recipes</Text>
            <Text style={styles.resultsSubtitle}>Based on: "{prompt}"</Text>
            
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
                    <Text style={styles.recipeDescription}>{recipe.description}</Text>
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
              ))}
            </View>

            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={handleGenerate}
              accessibilityLabel="Generate more recipes"
              accessibilityRole="button">
              <Sparkles size={16} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.regenerateButtonText}>Generate More</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      
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
  textInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFF3FF',
    marginBottom: 16,
  },
  textInput: {
    padding: 20,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  voiceButtonActive: {
    backgroundColor: '#6C8BE6',
  },
  recordingDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#6C8BE6',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
  },
  recordingAnimation: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  quickPrompts: {
    marginBottom: 32,
  },
  quickPromptsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  promptChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#EFF3FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  promptChipText: {
    fontSize: 14,
    color: '#6C8BE6',
    fontWeight: '500',
  },
  resultsSection: {
    marginBottom: 40,
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
    fontStyle: 'italic',
  },
  recipeGrid: {
    gap: 16,
    marginBottom: 24,
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
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
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
  regenerateButton: {
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
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