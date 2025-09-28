import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  PermissionsAndroid,
  Platform
} from 'react-native';
import { ChevronLeft, Mic, Sparkles, Clock, Users, ShoppingCart, Zap, ChevronRight, X, Bookmark, Share, Heart, Download, Play, CheckCircle, ChefHat, ArrowLeft } from 'lucide-react-native';
import { supabase, saveRecipeToSupabase, isRecipeSaved, SavedRecipe } from '../backend/lib/supabase';
import { voiceService, VoiceRecognitionResult } from '../backend/lib/voiceService';

const { width, height } = Dimensions.get('window');

interface Recipe {
  id: number;
  title: string;
  time: string;
  servings: string;
  calories: string;
  image: string;
  description: string;
  ingredients?: string[];
  instructions?: string[];
  external_links?: {
    zepto: string;
    blinkit: string;
  };
  cuisine?: string;
  dietary?: string;
  difficulty?: string;
  variety_description?: string;
  variation_level?: number;
}

interface Option {
  id: string;
  name: string;
  icon: string;
}

interface Constraints {
  dietary: string;
  cuisine: string;
  difficulty: string;
}

export default function CustomRecipeScreen() {
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'preferences' | 'results'>('input');
  const [generating, setGenerating] = useState(false);
  const [selectedConstraints, setSelectedConstraints] = useState<Constraints>({
    dietary: 'regular', // Default to regular (not vegan)
    cuisine: 'fusion',
    difficulty: 'medium'
  });
  const [options, setOptions] = useState<{
    dietary: Option[];
    cuisine: Option[];
    difficulty: Option[];
  }>({
    dietary: [],
    cuisine: [],
    difficulty: []
  });
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const bookmarkRotate = useRef(new Animated.Value(0)).current;
  const recordingAnimation = useRef(new Animated.Value(0)).current;
  const voiceButtonScale = useRef(new Animated.Value(1)).current;

  const recordingTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadOptions();
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      voiceService.destroy();
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start recording timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } else {
      // Stop animations and timer
      recordingAnimation.setValue(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [isRecording]);

  const loadOptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/options');
      const data = await response.json();
      setOptions({
        dietary: data.dietary || [],
        cuisine: data.cuisine || [],
        difficulty: data.difficulty || []
      });
    } catch (error) {
      console.error('Failed to load options:', error);
      setOptions({
        dietary: [
          { id: 'regular', name: 'No Restrictions', icon: '🍽️' },
          { id: 'vegetarian', name: 'Vegetarian', icon: '🥕' },
          { id: 'vegan', name: 'Vegan', icon: '🌱' },
          { id: 'gluten-free', name: 'Gluten-Free', icon: '🌾' }
        ],
        cuisine: [
          { id: 'italian', name: 'Italian', icon: '🍝' },
          { id: 'indian', name: 'Indian', icon: '🍛' },
          { id: 'mexican', name: 'Mexican', icon: '🌮' },
          { id: 'asian', name: 'Asian', icon: '🍜' },
          { id: 'mediterranean', name: 'Mediterranean', icon: '🥗' },
          { id: 'fusion', name: 'Fusion', icon: '🌍' }
        ],
        difficulty: [
          { id: 'easy', name: 'Easy', icon: '⭐' },
          { id: 'medium', name: 'Medium', icon: '⭐⭐' },
          { id: 'hard', name: 'Hard', icon: '⭐⭐⭐' }
        ]
      });
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      await stopVoiceRecording();
    } else {
      await startVoiceRecording();
    }
  };

  const startVoiceRecording = async () => {
    try {
      // Button press animation
      Animated.sequence([
        Animated.timing(voiceButtonScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(voiceButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setIsRecording(true);
      setRecognitionResult('');
      setRecordingTime(0);

      const success = await voiceService.startListening(
        (result: VoiceRecognitionResult) => {
          if (result.isFinal && result.text) {
            setRecognitionResult(result.text);
            setPrompt(result.text);
            stopVoiceRecording();
            
            Alert.alert('✅ Voice Input Complete', 'Your recipe idea has been processed!', [
              { 
                text: 'OK', 
                onPress: () => {
                  if (result.text.length > 10) {
                    handleInitialGenerate();
                  }
                }
              }
            ]);
          }
        },
        (error: string) => {
          console.error('Voice recognition error:', error);
          Alert.alert('Voice Recognition Error', error);
          setIsRecording(false);
        }
      );

      if (!success) {
        setIsRecording(false);
      }

    } catch (error) {
      console.error('Voice recording error:', error);
      Alert.alert('Error', 'Failed to start voice recording');
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      await voiceService.stopListening();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  const handleInitialGenerate = () => {
    if (!prompt.trim()) {
      Alert.alert('Please enter a recipe idea', 'Tell me what you\'d like to cook!');
      return;
    }
    setCurrentStep('preferences');
  };

  const handleFinalGenerate = async () => {
    setGenerating(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          constraints: selectedConstraints
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const recipes = data.recipes || [];
        setGeneratedRecipes(recipes.slice(0, 5));
        setCurrentStep('results');
      } else {
        Alert.alert('Error', 'Failed to generate recipe. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server. Using sample recipes.');
      setGeneratedRecipes([
        {
          id: 1,
          title: 'Classic Chicken Mushroom Pasta',
          time: '25 min',
          servings: '2',
          calories: '450',
          image: '🍝',
          description: 'Creamy pasta with chicken and mushrooms - your specified ingredients',
          ingredients: [
            '200g pasta',
            '200g chicken breast',
            '200g mushrooms',
            '2 cloves garlic',
            '1 cup cream',
            '2 tbsp parmesan',
            'Salt and pepper to taste'
          ],
          instructions: [
            'Cook pasta according to package instructions',
            'Sauté garlic and mushrooms until golden',
            'Add chicken and cook until done',
            'Stir in cream and parmesan',
            'Simmer until creamy, combine with pasta and serve'
          ],
          external_links: {
            zepto: 'https://www.zeptonow.com/search?q=pasta+chicken+mushrooms',
            blinkit: 'https://blinkit.com/search?q=pasta+chicken+mushrooms'
          },
          variety_description: 'Classic preparation with your specified ingredients',
          variation_level: 0,
          dietary: 'regular'
        },
        {
          id: 2,
          title: 'Chicken Mushroom Risotto',
          time: '35 min',
          servings: '3',
          calories: '520',
          image: '🍚',
          description: 'Creamy risotto with chicken and mushrooms with creative additions',
          ingredients: [
            '200g arborio rice',
            '300g chicken thighs',
            '300g mixed mushrooms',
            '1 onion',
            '500ml chicken stock',
            '1/2 cup white wine',
            '1/2 cup parmesan',
            '2 tbsp butter'
          ],
          instructions: [
            'Sauté onion until translucent',
            'Add rice and toast for 2 minutes',
            'Deglaze with white wine',
            'Gradually add warm stock, stirring constantly',
            'Add chicken and mushrooms in final 10 minutes',
            'Finish with parmesan and butter'
          ],
          variety_description: 'Creative twist with complementary flavors',
          variation_level: 1,
          dietary: 'regular'
        },
        {
          id: 3,
          title: 'Asian-style Chicken Mushroom Stir Fry',
          time: '20 min',
          servings: '2',
          calories: '380',
          image: '🍜',
          description: 'Asian-inspired stir fry with unique ingredient pairings',
          ingredients: [
            '400g chicken breast',
            '250g shiitake mushrooms',
            '2 tbsp soy sauce',
            '1 tbsp sesame oil',
            '2 cloves garlic',
            '1 tsp ginger',
            '1 bell pepper',
            '2 tbsp oyster sauce',
            '1 tsp chili flakes'
          ],
          instructions: [
            'Slice chicken and vegetables thinly',
            'Heat sesame oil in wok',
            'Add garlic and ginger, stir for 30 seconds',
            'Add chicken and cook until done',
            'Add vegetables and sauces, stir fry until tender'
          ],
          variety_description: 'Innovative combination with unique pairings',
          variation_level: 2,
          dietary: 'regular'
        },
        {
          id: 4,
          title: 'Gourmet Chicken Mushroom Creation',
          time: '45 min',
          servings: '2',
          calories: '580',
          image: '👨‍🍳',
          description: 'Premium gourmet experience with sophisticated flavors',
          ingredients: [
            '200g fresh pasta',
            '300g free-range chicken',
            '300g wild mushrooms',
            '3 cloves garlic',
            '1/2 cup white wine',
            '1/2 cup crème fraîche',
            '2 tbsp truffle oil',
            'Aged parmesan',
            'Fresh thyme'
          ],
          instructions: [
            'Sauté wild mushrooms in butter until golden',
            'Add garlic and fresh thyme',
            'Deglaze with white wine and reduce',
            'Add crème fraîche and simmer until thickened',
            'Toss with fresh pasta and chicken'
          ],
          variety_description: 'Gourmet version with premium ingredients',
          variation_level: 3,
          dietary: 'regular'
        },
        {
          id: 5,
          title: 'Ultimate Chicken Mushroom Experience',
          time: '50 min',
          servings: '4',
          calories: '620',
          image: '✨',
          description: 'Exotic fusion experience with complex flavor profile',
          ingredients: [
            '400g chicken thighs',
            '400g mixed exotic mushrooms',
            '1 cup coconut milk',
            '2 tbsp red curry paste',
            '1 tbsp fish sauce',
            '1 lime',
            'Thai basil',
            '2 cups jasmine rice',
            '1 lemongrass stalk'
          ],
          instructions: [
            'Cook jasmine rice with lemongrass',
            'Sauté mushrooms until caramelized',
            'Add red curry paste and cook until fragrant',
            'Add coconut milk and chicken, simmer',
            'Serve over rice with lime and basil'
          ],
          variety_description: 'Ultimate fusion experience with exotic elements',
          variation_level: 4,
          dietary: 'regular'
        }
      ]);
      setCurrentStep('results');
    }
    
    setGenerating(false);
  };

  // ... rest of the functions (openRecipeDetail, checkIfRecipeSaved, etc.) remain the same
  // but remove vegan-specific logic

  const openRecipeDetail = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetail(true);
    checkIfRecipeSaved(recipe);
    setCompletedSteps([]);
  };

  const checkIfRecipeSaved = async (recipe: Recipe) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsBookmarked(false);
        return;
      }

      const { isSaved } = await isRecipeSaved(recipe.title, user.id);
      setIsBookmarked(isSaved);
    } catch (error) {
      console.error('Error checking if recipe is saved:', error);
      setIsBookmarked(false);
    }
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Failed to open link: ' + err.message);
    });
  };

  const toggleBookmark = async (recipe: Recipe) => {
    setSavingRecipe(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert(
          'Login Required',
          'Please log in to save recipes',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => {
              console.log('Navigate to login');
            }}
          ]
        );
        return;
      }

      if (isBookmarked) {
        // Remove from saved recipes
        const { data: savedRecipes } = await supabase
          .from('saved_recipes')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', recipe.title);

        if (savedRecipes && savedRecipes.length > 0) {
          await supabase
            .from('saved_recipes')
            .delete()
            .eq('id', savedRecipes[0].id);
        }

        setIsBookmarked(false);
        setSavedRecipes(prev => prev.filter(r => r.id !== recipe.id));
        Alert.alert('Recipe Removed', 'Recipe has been removed from your saved recipes');
      } else {
        // Save to Supabase
        const savedRecipe: SavedRecipe = {
          user_id: user.id,
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
          cook_time: recipe.time,
          servings: recipe.servings,
          calories: recipe.calories,
          image: recipe.image,
          cuisine: recipe.cuisine || selectedConstraints.cuisine,
          dietary: recipe.dietary || selectedConstraints.dietary,
          difficulty: recipe.difficulty || selectedConstraints.difficulty,
          external_links: recipe.external_links,
          variety_description: recipe.variety_description,
          variation_level: recipe.variation_level || 0,
        };

        const { data, error } = await saveRecipeToSupabase(savedRecipe);

        if (error) {
          throw error;
        }

        setIsBookmarked(true);
        setSavedRecipes(prev => [...prev, recipe]);
        
        // Animation
        Animated.sequence([
          Animated.timing(bookmarkRotate, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bookmarkRotate, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();

        Alert.alert('Recipe Saved!', `${recipe.title} has been added to your saved recipes.`);
      }
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', error.message || 'Failed to save recipe. Please try again.');
    } finally {
      setSavingRecipe(false);
    }
  };

  const toggleLike = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
    
    setIsLiked(!isLiked);
  };

  const toggleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const shareRecipe = async (recipe: Recipe) => {
    const shareText = `Check out this recipe: ${recipe.title}\n\nDescription: ${recipe.description}\n\nCook Time: ${recipe.time}\nServings: ${recipe.servings}\nCalories: ${recipe.calories}`;
    
    Alert.alert('Share Recipe', shareText, [
      { text: 'OK', style: 'default' }
    ]);
  };

  const handleBack = () => {
    if (currentStep === 'preferences') {
      setCurrentStep('input');
    } else if (currentStep === 'results') {
      setCurrentStep('input');
      setGeneratedRecipes([]);
    }
  };

  const getVariationColor = (level: number) => {
    const colors = ['#4F46E5', '#059669', '#7C3AED', '#D97706', '#DC2626'];
    return colors[level] || colors[0];
  };

  const getVariationBadge = (level: number) => {
    const badges = ['Classic', 'Creative', 'Innovative', 'Gourmet', 'Ultimate'];
    return badges[level] || 'Recipe';
  };

  const renderOptionChips = (category: keyof Constraints, options: Option[]) => (
    <View style={styles.chipsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.optionChip,
            selectedConstraints[category] === option.id && styles.optionChipSelected
          ]}
          onPress={() => setSelectedConstraints(prev => ({
            ...prev,
            [category]: option.id
          }))}
        >
          <Text style={styles.optionChipIcon}>{option.icon}</Text>
          <Text style={[
            styles.optionChipText,
            selectedConstraints[category] === option.id && styles.optionChipTextSelected
          ]}>
            {option.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInputStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>What would you like to cook?</Text>
      <Text style={styles.subtitle}>
        Describe your perfect recipe and we'll create 5 unique variations for you
      </Text>

      <View style={styles.inputSection}>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="e.g., I want to cook a quick pasta with chicken and mushrooms..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {recognitionResult && (
            <View style={styles.voiceResultContainer}>
              <Text style={styles.voiceResultLabel}>🎤 Voice input detected:</Text>
              <Text style={styles.voiceResultText}>{recognitionResult}</Text>
              <TouchableOpacity 
                style={styles.editResultButton}
                onPress={() => setPrompt(recognitionResult)}
              >
                <Text style={styles.editResultButtonText}>Use this text</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inputActions}>
          <Animated.View style={{ transform: [{ scale: voiceButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonActive,
              ]}
              onPress={handleVoiceInput}
            >
              <Animated.View style={{
                transform: [{
                  scale: recordingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.3]
                  })
                }]
              }}>
                <Mic 
                  size={20} 
                  color={isRecording ? '#FFFFFF' : '#6366F1'} 
                  strokeWidth={2} 
                />
              </Animated.View>
              {isRecording && <View style={styles.recordingDot} />}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.generateButton,
              !prompt.trim() && styles.generateButtonDisabled,
            ]}
            onPress={handleInitialGenerate}
            disabled={!prompt.trim()}
          >
            <Sparkles size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.generateButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Animated.View style={[
              styles.recordingPulse,
              {
                opacity: recordingAnimation,
                transform: [{
                  scale: recordingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2]
                  })
                }]
              }
            ]} />
            <Text style={styles.recordingText}>
              🎤 Listening... {recordingTime}s (Speak now)
            </Text>
            <Text style={styles.recordingHint}>
              Speak clearly about ingredients, cuisine, or cooking style
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Ideas</Text>
        <View style={styles.promptChips}>
          {[
            'Healthy lunch under 30 mins',
            'Comfort food for rainy day',
            'Impressive dinner for guests',
            'Quick breakfast with eggs',
          ].map((promptText, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptChip}
              onPress={() => setPrompt(promptText)}
            >
              <Text style={styles.promptChipText}>{promptText}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  const renderPreferencesStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Customize Your Recipe</Text>
      <Text style={styles.subtitle}>
        "{prompt}"
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Preference</Text>
        {renderOptionChips('dietary', options.dietary)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuisine Type</Text>
        {renderOptionChips('cuisine', options.cuisine)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Difficulty Level</Text>
        {renderOptionChips('difficulty', options.difficulty)}
      </View>

      <TouchableOpacity
        style={[styles.generateButton, generating && styles.generateButtonDisabled]}
        onPress={handleFinalGenerate}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Sparkles size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.generateButtonText}>Generate 5 Recipes</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderResultsStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Your Recipe Options</Text>
      <Text style={styles.subtitle}>
        Based on: "{prompt}"
      </Text>

      <View style={styles.recipesGrid}>
        {generatedRecipes.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            style={styles.recipeCard}
            onPress={() => openRecipeDetail(recipe)}
          >
            <View style={styles.recipeCardContent}>
              <View style={styles.recipeImageContainer}>
                <Text style={styles.recipeEmoji}>{recipe.image}</Text>
                <View
                  style={[
                    styles.variationBadge,
                    { backgroundColor: getVariationColor(recipe.variation_level || 0) }
                  ]}
                >
                  <Text style={styles.variationBadgeText}>
                    {getVariationBadge(recipe.variation_level || 0)}
                  </Text>
                </View>
                <View style={styles.dietaryLabel}>
                  <Text style={styles.dietaryLabelText}>
                    {recipe.dietary?.toUpperCase() || 'REGULAR'}
                  </Text>
                </View>
              </View>

              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <Text style={styles.recipeDescription} numberOfLines={2}>
                  {recipe.description}
                </Text>
                {recipe.variety_description && (
                  <Text style={styles.varietyDescription}>
                    {recipe.variety_description}
                  </Text>
                )}
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
              </View>

              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.resultsFooter}>
        <Text style={styles.resultsFooterText}>
          🎯 Recipe 1 uses your exact ingredients • Recipe 2-5 get progressively creative
        </Text>

        <TouchableOpacity
          style={styles.newSearchButton}
          onPress={() => {
            setCurrentStep('input');
            setPrompt('');
            setGeneratedRecipes([]);
            setRecognitionResult('');
          }}
        >
          <Text style={styles.newSearchButtonText}>Create Another Recipe</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderRecipeDetailModal = () => (
    <Modal
      visible={showRecipeDetail}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowRecipeDetail(false)}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.modalContainer}>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {selectedRecipe && (
            <>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowRecipeDetail(false)}
                >
                  <ArrowLeft size={24} color="#374151" strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>Recipe Details</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={styles.headerActionButton}
                    onPress={() => shareRecipe(selectedRecipe)}
                  >
                    <Share size={20} color="#6B7280" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Hero Section */}
              <View style={styles.heroContainer}>
                <View style={styles.heroContent}>
                  <View style={styles.heroIcon}>
                    <Text style={styles.heroEmoji}>{selectedRecipe.image}</Text>
                  </View>
                  
                  <View style={styles.recipeTagsContainer}>
                    <View
                      style={[
                        styles.heroVariationBadge,
                        { backgroundColor: getVariationColor(selectedRecipe.variation_level || 0) }
                      ]}
                    >
                      <Text style={styles.heroVariationText}>
                        {getVariationBadge(selectedRecipe.variation_level || 0)}
                      </Text>
                    </View>
                    <View style={styles.dietaryTag}>
                      <Text style={styles.dietaryTagText}>
                        {selectedRecipe.dietary?.toUpperCase() || 'REGULAR'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.heroTitle}>{selectedRecipe.title}</Text>
                  <Text style={styles.heroDescription}>{selectedRecipe.description}</Text>
                  
                  {selectedRecipe.variety_description && (
                    <View style={styles.varietyContainer}>
                      <Sparkles size={14} color="#6366F1" strokeWidth={2} />
                      <Text style={styles.varietyText}>
                        {selectedRecipe.variety_description}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsSection}>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Clock size={20} color="#6366F1" strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>{selectedRecipe.time}</Text>
                  <Text style={styles.statLabel}>Cook Time</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Users size={20} color="#059669" strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>{selectedRecipe.servings}</Text>
                  <Text style={styles.statLabel}>Servings</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Zap size={20} color="#DC2626" strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>{selectedRecipe.calories}</Text>
                  <Text style={styles.statLabel}>Calories</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionSection}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, isLiked && styles.actionBtnLiked]}
                    onPress={toggleLike}
                  >
                    <Heart 
                      size={18} 
                      color={isLiked ? "#FFFFFF" : "#EF4444"} 
                      fill={isLiked ? "#EF4444" : "none"}
                      strokeWidth={2} 
                    />
                    <Text style={[styles.actionBtnText, isLiked && styles.actionBtnTextActive]}>
                      {isLiked ? 'Loved' : 'Love'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ 
                  transform: [{ rotate: bookmarkRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })}]
                }}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, isBookmarked && styles.actionBtnBookmarked]}
                    onPress={() => toggleBookmark(selectedRecipe)}
                    disabled={savingRecipe}
                  >
                    {savingRecipe ? (
                      <ActivityIndicator size="small" color={isBookmarked ? "#FFFFFF" : "#6366F1"} />
                    ) : (
                      <>
                        <Bookmark 
                          size={18} 
                          color={isBookmarked ? "#FFFFFF" : "#6366F1"} 
                          fill={isBookmarked ? "#6366F1" : "none"}
                          strokeWidth={2} 
                        />
                        <Text style={[styles.actionBtnText, isBookmarked && styles.actionBtnTextActive]}>
                          {isBookmarked ? 'Saved' : 'Save'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity style={styles.actionBtn}>
                  <Download size={18} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.actionBtnText}>Export</Text>
                </TouchableOpacity>
              </View>

              {/* Tabs */}
              <View style={styles.tabNavigation}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'ingredients' && styles.activeTabButton]}
                  onPress={() => setActiveTab('ingredients')}
                >
                  <ChefHat size={16} color={activeTab === 'ingredients' ? "#FFFFFF" : "#6B7280"} strokeWidth={2} />
                  <Text style={[styles.tabButtonText, activeTab === 'ingredients' && styles.activeTabButtonText]}>
                    Ingredients
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'instructions' && styles.activeTabButton]}
                  onPress={() => setActiveTab('instructions')}
                >
                  <Play size={16} color={activeTab === 'instructions' ? "#FFFFFF" : "#6B7280"} strokeWidth={2} />
                  <Text style={[styles.tabButtonText, activeTab === 'instructions' && styles.activeTabButtonText]}>
                    Instructions
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              <View style={styles.tabContent}>
                {activeTab === 'ingredients' ? (
                  <View style={styles.ingredientsContent}>
                    <Text style={styles.contentTitle}>Ingredients ({selectedRecipe.ingredients?.length || 0})</Text>
                    {selectedRecipe.ingredients?.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientItem}>
                        <View style={styles.ingredientBullet} />
                        <Text style={styles.ingredientText}>{ingredient}</Text>
                      </View>
                    ))}
                    
                    {/* Shopping */}
                    <View style={styles.shoppingSection}>
                      <Text style={styles.shoppingSectionTitle}>Get Ingredients Delivered</Text>
                      <View style={styles.deliveryButtons}>
                        <TouchableOpacity 
                          style={styles.deliveryButton}
                          onPress={() => selectedRecipe.external_links?.zepto && openExternalLink(selectedRecipe.external_links.zepto)}
                        >
                          <ShoppingCart size={16} color="#FFFFFF" strokeWidth={2} />
                          <Text style={styles.deliveryButtonText}>Zepto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deliveryButton}
                          onPress={() => selectedRecipe.external_links?.blinkit && openExternalLink(selectedRecipe.external_links.blinkit)}
                        >
                          <ShoppingCart size={16} color="#FFFFFF" strokeWidth={2} />
                          <Text style={styles.deliveryButtonText}>Blinkit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.instructionsContent}>
                    <Text style={styles.contentTitle}>Instructions ({selectedRecipe.instructions?.length || 0} steps)</Text>
                    {selectedRecipe.instructions?.map((instruction, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.instructionStep}
                        onPress={() => toggleStepComplete(index)}
                      >
                        <View style={styles.stepNumber}>
                          {completedSteps.includes(index) ? (
                            <CheckCircle size={24} color="#059669" strokeWidth={2} />
                          ) : (
                            <View style={styles.stepCircle}>
                              <Text style={styles.stepText}>{index + 1}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[
                          styles.instructionText,
                          completedSteps.includes(index) && styles.instructionTextCompleted
                        ]}>
                          {instruction}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    
                    <View style={styles.progressSection}>
                      <Text style={styles.progressText}>
                        Progress: {completedSteps.length} of {selectedRecipe.instructions?.length || 0} steps completed
                      </Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${((completedSteps.length / (selectedRecipe.instructions?.length || 1)) * 100)}%` }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        {currentStep !== 'input' && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color="#374151" strokeWidth={2} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>AI Recipe Generator</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentStep === 'input' && renderInputStep()}
        {currentStep === 'preferences' && renderPreferencesStep()}
        {currentStep === 'results' && renderResultsStep()}
      </ScrollView>

      {renderRecipeDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: 32,
  },
  textInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
  },
  voiceResultContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  voiceResultLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceResultText: {
    fontSize: 14,
    color: '#059669',
    fontStyle: 'italic',
  },
  editResultButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  editResultButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  voiceButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 56,
  },
  voiceButtonActive: {
    backgroundColor: '#6366F1',
  },
  recordingDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  generateButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    gap: 12,
    position: 'relative',
  },
  recordingPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    opacity: 0.3,
  },
  recordingText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingHint: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  promptChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  promptChipText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  optionChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  optionChipIcon: {
    fontSize: 16,
  },
  optionChipText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  recipesGrid: {
    gap: 16,
    marginBottom: 24,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recipeCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 16,
  },
  recipeImageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  recipeEmoji: {
    fontSize: 40,
  },
  variationBadge: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  variationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  dietaryLabel: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#6366F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dietaryLabelText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  recipeInfo: {
    flex: 1,
    gap: 4,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  recipeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  varietyDescription: {
    fontSize: 12,
    color: '#6366F1',
    fontStyle: 'italic',
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
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
  caloriesText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  resultsFooter: {
    alignItems: 'center',
    gap: 16,
  },
  resultsFooterText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  newSearchButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  newSearchButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
  },
  heroContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: width - 40,
  },
  heroIcon: {
    marginBottom: 12,
  },
  heroEmoji: {
    fontSize: 64,
  },
  recipeTagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  heroVariationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroVariationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dietaryTag: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dietaryTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  varietyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  varietyText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  actionBtnLiked: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  actionBtnBookmarked: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  actionBtnTextActive: {
    color: '#6366F1',
  },
  tabNavigation: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: '#6366F1',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  ingredientsContent: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  ingredientText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  shoppingSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  shoppingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  deliveryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  deliveryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsContent: {
    gap: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  stepNumber: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 24,
  },
  instructionTextCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  progressSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
});

// export default CustomRecipeScreen;