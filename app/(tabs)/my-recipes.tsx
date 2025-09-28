import React, { useState, useEffect } from 'react';
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
  Filter,
  Clock,
  Users,
  Heart,
  BookOpen,
  Play,
  Pause,
  SkipForward,
  ChefHat,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import Svg, { Path, Circle, Rect, G, Polygon } from 'react-native-svg';

// Custom Recipe SVG Icons
const PastaIcon = ({ size = 32, color = "#6C8BE6" }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="12" fill={color} fillOpacity="0.1" />
    <Path
      d="M8 12C8 12 10 8 16 8C22 8 24 12 24 12C24 16 22 20 16 20C10 20 8 16 8 12Z"
      fill={color}
      fillOpacity="0.3"
    />
    <Path d="M12 14L20 14M12 16L20 16M12 18L20 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const ChickenIcon = ({ size = 32, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="12" fill={color} fillOpacity="0.1" />
    <Path
      d="M12 10C12 8 14 6 16 6C18 6 20 8 20 10C20 12 22 14 24 16C22 18 20 20 18 22C16 24 14 22 12 20C10 18 8 16 10 14C12 12 12 10 12 10Z"
      fill={color}
      fillOpacity="0.3"
    />
    <Circle cx="15" cy="12" r="1" fill={color} />
    <Path d="M10 14C8 16 8 18 10 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const MushroomIcon = ({ size = 32, color = "#10B981" }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="12" fill={color} fillOpacity="0.1" />
    <Path
      d="M16 10C12 10 9 12 9 16C9 16 12 18 16 18C20 18 23 16 23 16C23 12 20 10 16 10Z"
      fill={color}
      fillOpacity="0.3"
    />
    <Rect x="15" y="18" width="2" height="6" fill={color} rx="1" />
    <Circle cx="13" cy="14" r="1" fill={color} />
    <Circle cx="19" cy="14" r="1" fill={color} />
  </Svg>
);

const SaladIcon = ({ size = 32, color = "#22C55E" }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="12" fill={color} fillOpacity="0.1" />
    <Path
      d="M8 18C8 14 11 10 16 10C21 10 24 14 24 18C24 22 21 24 16 24C11 24 8 22 8 18Z"
      fill={color}
      fillOpacity="0.2"
    />
    <Circle cx="12" cy="16" r="2" fill={color} fillOpacity="0.5" />
    <Circle cx="20" cy="16" r="2" fill={color} fillOpacity="0.5" />
    <Circle cx="16" cy="14" r="1.5" fill={color} fillOpacity="0.7" />
    <Circle cx="14" cy="19" r="1" fill={color} />
    <Circle cx="18" cy="19" r="1" fill={color} />
  </Svg>
);

const filterOptions = ['All', 'Veg', 'Non-Veg', 'Others'];

// Enhanced recipes with detailed cooking instructions
const savedRecipes = [
  {
    id: 1,
    title: 'Classic Vegan Mushroom Pasta',
    iconType: 'mushroom',
    time: '25 min',
    servings: '4',
    tags: ['Veg', 'Quick', 'Comfort'],
    dateAdded: '2 days ago',
    isFavorite: true,
    cookingSteps: [
      'Gather your ingredients: 200g pasta, 300g fresh mushrooms, 2 cloves garlic, 1 medium onion, 2 tablespoons olive oil, salt, black pepper, and fresh parsley for garnish.',
      'Bring a large pot of salted water to a rolling boil. Add a tablespoon of salt to the water for flavor.',
      'While the water is heating, clean and slice the mushrooms. Finely chop the onion and mince the garlic cloves.',
      'Heat olive oil in a large pan over medium heat. Make sure the pan is large enough to hold the pasta later.',
      'Add the chopped onions to the pan and sauté for 3-4 minutes until they become translucent and soft.',
      'Add the minced garlic and cook for another minute until fragrant. Be careful not to burn the garlic.',
      'Add the sliced mushrooms to the pan. Cook for 8-10 minutes, stirring occasionally, until they release their moisture and turn golden brown.',
      'Meanwhile, add the pasta to the boiling water and cook according to package instructions until al dente.',
      'Season the mushroom mixture with salt and freshly ground black pepper to taste.',
      'Drain the pasta, but reserve about half a cup of the starchy pasta water. This will help create the sauce.',
      'Add the drained pasta directly to the mushroom mixture in the pan.',
      'Toss everything together, adding a splash of the reserved pasta water to create a light, creamy sauce that coats the pasta.',
      'Garnish with freshly chopped parsley and serve immediately while hot. Enjoy your delicious vegan mushroom pasta!'
    ],
    ingredients: [
      '200g pasta',
      '300g mushrooms',
      '2 cloves garlic',
      '1 onion',
      '2 tbsp olive oil',
      'Salt and pepper',
      'Fresh parsley'
    ]
  },
  {
    id: 2,
    title: 'Spicy Thai Chicken',
    iconType: 'chicken',
    time: '30 min',
    servings: '3',
    tags: ['Non-Veg', 'Spicy', 'Asian'],
    dateAdded: '5 days ago',
    isFavorite: false,
    cookingSteps: [
      'Prepare the ingredients: 500g chicken breast, 2 tbsp vegetable oil, 3 cloves garlic, 1 tbsp ginger, 2 red chilies, 1 bell pepper, 1 onion, 3 tbsp soy sauce, 1 tbsp fish sauce, 1 tsp sugar, and fresh basil leaves.',
      'Cut the chicken breast into bite-sized pieces and season with a pinch of salt.',
      'Heat vegetable oil in a wok or large frying pan over high heat.',
      'Add minced garlic and grated ginger, stir-fry for 30 seconds until fragrant.',
      'Add the chicken pieces and cook for 5-6 minutes until golden brown and cooked through.',
      'Slice the bell pepper and onion into thin strips. Chop the red chilies.',
      'Add the vegetables to the wok and stir-fry for 3-4 minutes until they start to soften but remain crisp.',
      'In a small bowl, mix together soy sauce, fish sauce, and sugar.',
      'Pour the sauce mixture over the chicken and vegetables. Stir well to combine.',
      'Add the chopped chilies and fresh basil leaves. Cook for another minute.',
      'Taste and adjust seasoning if needed. Serve hot with steamed jasmine rice.'
    ],
    ingredients: [
      '500g chicken breast',
      '3 cloves garlic',
      '1 tbsp ginger',
      '2 red chilies',
      '1 bell pepper',
      '3 tbsp soy sauce',
      '1 tbsp fish sauce',
      'Fresh basil'
    ]
  },
  {
    id: 3,
    title: 'Mediterranean Pasta',
    iconType: 'pasta',
    time: '20 min',
    servings: '4',
    tags: ['Veg', 'Quick', 'Mediterranean'],
    dateAdded: '1 week ago',
    isFavorite: true,
    cookingSteps: [
      'Gather: 250g pasta, 2 tbsp olive oil, 3 cloves garlic, 1 cup cherry tomatoes, 1/2 cup black olives, 2 tbsp capers, fresh basil, and parmesan cheese.',
      'Cook pasta in salted boiling water according to package directions.',
      'Meanwhile, heat olive oil in a large pan over medium heat.',
      'Add sliced garlic and cook until fragrant, about 1 minute.',
      'Add halved cherry tomatoes and cook until they start to burst, about 5 minutes.',
      'Stir in olives and capers, cook for 2 more minutes.',
      'Drain pasta, reserving 1/4 cup pasta water.',
      'Add pasta to the sauce with pasta water and toss to combine.',
      'Garnish with fresh basil and grated parmesan before serving.'
    ],
    ingredients: [
      '250g pasta',
      '2 tbsp olive oil',
      '3 cloves garlic',
      '1 cup cherry tomatoes',
      '1/2 cup black olives',
      '2 tbsp capers',
      'Fresh basil',
      'Parmesan cheese'
    ]
  },
  {
    id: 4,
    title: 'Quinoa Buddha Bowl',
    iconType: 'salad',
    time: '20 min',
    servings: '2',
    tags: ['Veg', 'Healthy', 'Bowl'],
    dateAdded: '1 week ago',
    isFavorite: false,
    cookingSteps: [
      'Cook 1 cup quinoa according to package instructions.',
      'Prepare vegetables: chop avocado, cucumber, cherry tomatoes, and red cabbage.',
      'Make dressing: mix 3 tbsp olive oil, 1 tbsp lemon juice, 1 tsp honey, salt and pepper.',
      'Assemble bowls with quinoa base and arranged vegetables.',
      'Drizzle with dressing and add toppings like sesame seeds or chickpeas.',
      'Serve immediately for fresh, crisp vegetables.'
    ],
    ingredients: [
      '1 cup quinoa',
      '1 avocado',
      '1 cucumber',
      '1 cup cherry tomatoes',
      '1/2 red cabbage',
      '3 tbsp olive oil',
      '1 tbsp lemon juice'
    ]
  },
];

const RecipeIcon = ({ iconType, size = 32 }) => {
  switch (iconType) {
    case 'pasta':
      return <PastaIcon size={size} />;
    case 'chicken':
      return <ChickenIcon size={size} />;
    case 'mushroom':
      return <MushroomIcon size={size} />;
    case 'salad':
      return <SaladIcon size={size} />;
    default:
      return <PastaIcon size={size} />;
  }
};

// Cooking Screen Component
const CookingScreen = ({ recipe, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(true);

  // Simulated TTS function - Replace with actual TTS library
  const speak = async (text: string) => {
    try {
      // Check if we're in a browser environment (for web TTS)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Web TTS API
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => {
          setIsPlaying(false);
          setTtsAvailable(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        // React Native TTS simulation
        setTtsAvailable(false);
        Alert.alert('Cooking Instruction', text, [
          { text: 'OK', onPress: () => setIsPlaying(false) }
        ]);
        setIsPlaying(true);
        // Simulate speech duration
        setTimeout(() => setIsPlaying(false), 3000);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setTtsAvailable(false);
      Alert.alert('Cooking Instruction', text);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const playStep = async () => {
    if (!recipe?.cookingSteps?.[currentStep]) return;
    
    const stepText = `Step ${currentStep + 1}: ${recipe.cookingSteps[currentStep]}`;
    await speak(stepText);
  };

  const nextStep = async () => {
    stopSpeech(); // Stop current speech
    
    if (currentStep < recipe.cookingSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Auto-play next step after a short delay
      setTimeout(async () => {
        const stepText = `Step ${newStep + 1}: ${recipe.cookingSteps[newStep]}`;
        await speak(stepText);
      }, 500);
    } else {
      const completionText = 'Congratulations! You have completed the recipe. Enjoy your meal!';
      await speak(completionText);
      setTimeout(() => {
        Alert.alert('🎉 Recipe Completed!', 'Great job! Your dish is ready to serve.');
        onClose();
      }, 2000);
    }
  };

  const previousStep = async () => {
    stopSpeech(); // Stop current speech
    
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      
      // Auto-play previous step after a short delay
      setTimeout(async () => {
        const stepText = `Step ${newStep + 1}: ${recipe.cookingSteps[newStep]}`;
        await speak(stepText);
      }, 500);
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      await playStep();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  return (
    <SafeAreaView style={styles.cookingContainer}>
      <View style={styles.cookingHeader}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ChevronLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.cookingTitle}>Cooking: {recipe.title}</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            Step {currentStep + 1} of {recipe.cookingSteps.length}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / recipe.cookingSteps.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView style={styles.instructionsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.currentStepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>Step {currentStep + 1}</Text>
            {isPlaying ? (
              <Volume2 size={20} color="#6C8BE6" />
            ) : (
              <VolumeX size={20} color="#9CA3AF" />
            )}
          </View>
          <Text style={styles.instructionText}>
            {recipe.cookingSteps[currentStep]}
          </Text>
        </View>

        <View style={styles.ingredientsCard}>
          <Text style={styles.sectionTitle}>📋 Ingredients Needed</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.ingredientText}>• {ingredient}</Text>
          ))}
        </View>
      </ScrollView>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, currentStep === 0 && styles.disabledButton]}
          onPress={previousStep}
          disabled={currentStep === 0}
        >
          <SkipForward size={20} color={currentStep === 0 ? "#9CA3AF" : "#6C8BE6"} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={[styles.controlText, currentStep === 0 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.playButton]}
          onPress={togglePlayPause}
        >
          {isPlaying ? <Pause size={20} color="#FFFFFF" /> : <Play size={20} color="#FFFFFF" />}
          <Text style={[styles.controlText, styles.playText]}>
            {isPlaying ? 'Pause' : 'Play Step'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, currentStep === recipe.cookingSteps.length - 1 && styles.finishButton]}
          onPress={nextStep}
        >
          <SkipForward size={20} color={currentStep === recipe.cookingSteps.length - 1 ? "#FFFFFF" : "#6C8BE6"} />
          <Text style={[styles.controlText, currentStep === recipe.cookingSteps.length - 1 && styles.finishText]}>
            {currentStep === recipe.cookingSteps.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TTS Status Indicator */}
      {!ttsAvailable && (
        <View style={styles.ttsWarning}>
          <Text style={styles.ttsWarningText}>
            🔈 TTS not available. Using text display. Install react-native-tts for audio.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const EmptyState = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}>
      <BookOpen size={48} color="#BFAFF7" strokeWidth={1.5} />
    </View>
    <Text style={styles.emptyTitle}>No saved recipes yet</Text>
    <Text style={styles.emptySubtitle}>
      Start cooking and save your favorite recipes to see them here
    </Text>
    <TouchableOpacity
      style={styles.emptyAction}
      onPress={() => router.push('/(tabs)/home')}
      accessibilityLabel="Explore recipes"
      accessibilityRole="button">
      <Text style={styles.emptyActionText}>Explore Recipes</Text>
    </TouchableOpacity>
  </View>
);

export default function MyRecipesScreen() {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [recipes, setRecipes] = useState(savedRecipes);
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [showCookingScreen, setShowCookingScreen] = useState(false);

  const filteredRecipes = recipes.filter(recipe => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Others') {
      return !recipe.tags.includes('Veg') && !recipe.tags.includes('Non-Veg');
    }
    return recipe.tags.includes(selectedFilter);
  });

  const toggleFavorite = (recipeId: number) => {
    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isFavorite: !recipe.isFavorite }
          : recipe
      )
    );
  };

  const startCooking = (recipe: any) => {
    setCookingRecipe(recipe);
    setShowCookingScreen(true);
  };

  if (showCookingScreen && cookingRecipe) {
    return (
      <CookingScreen 
        recipe={cookingRecipe} 
        onClose={() => setShowCookingScreen(false)} 
      />
    );
  }

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
        <Text style={styles.headerTitle}>My Recipes</Text>
        <TouchableOpacity
          style={styles.filterButton}
          accessibilityLabel="Filter recipes"
          accessibilityRole="button">
          <Filter size={20} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
                accessibilityLabel={`Filter by ${filter}`}
                accessibilityRole="button">
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.filterTextActive,
                  ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {filteredRecipes.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollView 
            style={styles.recipesList}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.resultsCount}>
              {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
            </Text>
            
            {filteredRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.recipeCard}>
                <View style={styles.recipeImage}>
                  <RecipeIcon iconType={recipe.iconType} size={32} />
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(recipe.id)}
                    accessibilityLabel={
                      recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'
                    }
                    accessibilityRole="button">
                    <Heart
                      size={16}
                      color={recipe.isFavorite ? '#FF6B6B' : '#6B7280'}
                      fill={recipe.isFavorite ? '#FF6B6B' : 'none'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <Text style={styles.recipeDateAdded}>{recipe.dateAdded}</Text>
                  
                  <View style={styles.recipeMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={12} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.metaText}>{recipe.time}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={12} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.metaText}>{recipe.servings}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <ChefHat size={12} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.metaText}>{recipe.cookingSteps.length} steps</Text>
                    </View>
                  </View>
                  
                  <View style={styles.recipeTags}>
                    {recipe.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <TouchableOpacity
                    style={styles.cookButton}
                    onPress={() => startCooking(recipe)}
                    accessibilityLabel={`Start cooking ${recipe.title}`}
                    accessibilityRole="button">
                    <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.cookButtonText}>Start Cooking</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
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
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  filtersContainer: {
    marginBottom: 24,
  },
  filters: {
    gap: 8,
    paddingRight: 24,
  },
  filterChip: {
    backgroundColor: '#EFF3FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#6C8BE6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  recipesList: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFF3FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  recipeDateAdded: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#6B7280',
  },
  recipeTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6C8BE6',
  },
  cookButton: {
    backgroundColor: '#6C8BE6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyAction: {
    backgroundColor: '#6C8BE6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Cooking Screen Styles
  cookingContainer: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  cookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFF3FF',
  },
  cookingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  stepIndicator: {
    backgroundColor: '#EFF3FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C8BE6',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#EFF3FF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C8BE6',
    borderRadius: 3,
  },
  instructionsContainer: {
    flex: 1,
    padding: 20,
  },
  currentStepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFF3FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  ingredientsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFF3FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  ingredientText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFF3FF',
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#EFF3FF',
    flex: 1,
    minHeight: 50,
  },
  playButton: {
    backgroundColor: '#6C8BE6',
  },
  finishButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  playText: {
    color: '#FFFFFF',
  },
  finishText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  ttsWarning: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  ttsWarningText: {
    color: '#856404',
    fontSize: 12,
    textAlign: 'center',
  },
});


