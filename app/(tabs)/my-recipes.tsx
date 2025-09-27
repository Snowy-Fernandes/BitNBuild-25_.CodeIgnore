import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
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

const savedRecipes = [
  {
    id: 1,
    title: 'Mediterranean Pasta',
    iconType: 'pasta',
    time: '25 min',
    servings: '4',
    tags: ['Veg', 'Quick'],
    dateAdded: '2 days ago',
    isFavorite: true,
  },
  {
    id: 2,
    title: 'Spicy Thai Chicken',
    iconType: 'chicken',
    time: '30 min',
    servings: '3',
    tags: ['Non-Veg', 'Spicy'],
    dateAdded: '5 days ago',
    isFavorite: false,
  },
  {
    id: 3,
    title: 'Mushroom Risotto',
    iconType: 'mushroom',
    time: '35 min',
    servings: '4',
    tags: ['Veg', 'Comfort'],
    dateAdded: '1 week ago',
    isFavorite: true,
  },
  {
    id: 4,
    title: 'Quinoa Buddha Bowl',
    iconType: 'salad',
    time: '20 min',
    servings: '2',
    tags: ['Veg', 'Healthy'],
    dateAdded: '1 week ago',
    isFavorite: false,
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

  const filteredRecipes = recipes.filter(recipe => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Others') {
      return !recipe.tags.includes('Veg') && !recipe.tags.includes('Non-Veg');
    }
    return recipe.tags.includes(selectedFilter);
  });

  const toggleFavorite = (recipeId) => {
    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isFavorite: !recipe.isFavorite }
          : recipe
      )
    );
  };

  const openRecipeDetail = (recipe) => {
    router.push({
      pathname: '/recipe-detail',
      params: {
        recipeId: recipe.id,
        from: 'my-recipes',
        title: recipe.title,
        time: recipe.time,
        servings: recipe.servings,
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
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => openRecipeDetail(recipe)}
                accessibilityLabel={`Recipe: ${recipe.title}`}
                accessibilityRole="button">
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
                  </View>
                  
                  <View style={styles.recipeTags}>
                    {recipe.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    color: '#6B7280',
  },
  recipeTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
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