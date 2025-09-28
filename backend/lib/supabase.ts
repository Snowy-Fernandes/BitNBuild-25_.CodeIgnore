import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = 'https://vynrbwiatteznxfifixc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bnJid2lhdHRlem54ZmlmaXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTI1MzksImV4cCI6MjA3NDU2ODUzOX0.Z4L2nxoAqyqkSE-kMkyTvnfAGGWT1k9pSOOY7utOxIU';

// Storage adapter for Expo SecureStore (native)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    try {
      return SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
      return Promise.resolve();
    }
  },
  removeItem: (key: string) => {
    try {
      return SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
      return Promise.resolve();
    }
  },
};

const WebStorageAdapter = {
  getItem: async (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  },
};

// Enhanced error handling and logging
const supabaseOptions = {
  auth: {
    storage: Platform.OS === 'web' ? WebStorageAdapter : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce' as const,
    debug: false,
  },
  global: {
    headers: {
      'x-application-name': 'gourmetnet-app',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Recipe Interface
export interface SavedRecipe {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cook_time: string;
  servings: string;
  calories: string;
  image: string;
  cuisine: string;
  dietary: string;
  difficulty: string;
  external_links?: {
    zepto: string;
    blinkit: string;
  };
  variety_description?: string;
  variation_level?: number;
  created_at?: string;
}

// Helper function to check if user has a profile
export const checkUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { hasProfile: false, displayName: null };
      }
      throw error;
    }

    return { 
      hasProfile: true, 
      displayName: data.display_name,
      profileData: data
    };
  } catch (error) {
    console.error('Error checking user profile:', error);
    return { hasProfile: false, displayName: null, error };
  }
};

// Helper function to create or update user profile
export const upsertUserProfile = async (profileData: {
  id: string;
  display_name?: string;
  num_people?: number;
  allergies?: string[];
  height?: number | null;
  weight?: number | null;
  medications?: string | null;
}) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return { data: null, error };
  }
};

// Helper function to get user profile with error handling
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { 
          data: {
            id: userId,
            display_name: null,
            num_people: 2,
            allergies: [],
            height: null,
            weight: null,
            medications: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, 
          error: null 
        };
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { data: null, error };
  }
};

// Save recipe to Supabase
export const saveRecipeToSupabase = async (recipe: SavedRecipe) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be logged in to save recipes');
    }

    const recipeData = {
      user_id: user.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      calories: recipe.calories,
      image: recipe.image,
      cuisine: recipe.cuisine,
      dietary: recipe.dietary,
      difficulty: recipe.difficulty,
      external_links: recipe.external_links || null,
      variety_description: recipe.variety_description || null,
      variation_level: recipe.variation_level || 0,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('saved_recipes')
      .insert([recipeData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving recipe to Supabase:', error);
    return { data: null, error };
  }
};

// Check if recipe is already saved
export const isRecipeSaved = async (recipeTitle: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', userId)
      .eq('title', recipeTitle)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { isSaved: false, error: null };
      }
      throw error;
    }

    return { isSaved: !!data, error: null };
  } catch (error) {
    console.error('Error checking if recipe is saved:', error);
    return { isSaved: false, error };
  }
};

// Get user's saved recipes
export const getSavedRecipes = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting saved recipes:', error);
    return { data: null, error };
  }
};

// Delete saved recipe
export const deleteSavedRecipe = async (recipeId: string) => {
  try {
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', recipeId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting saved recipe:', error);
    return { error };
  }
};

// Update saved recipe
export const updateSavedRecipe = async (recipeId: string, updates: Partial<SavedRecipe>) => {
  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating saved recipe:', error);
    return { data: null, error };
  }
};

// Get recipe by ID
export const getRecipeById = async (recipeId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting recipe by ID:', error);
    return { data: null, error };
  }
};