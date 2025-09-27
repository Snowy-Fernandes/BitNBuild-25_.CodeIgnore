<<<<<<< HEAD
// RecipeDetailScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
=======
import React, { useState, useEffect } from 'react';
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
<<<<<<< HEAD
  Modal,
  FlatList,
  Alert,
  Linking,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Clock,
  Users,
  Plus,
  Minus,
  ShoppingCart,
  Star,
  Timer,
  Sparkles,
} from "lucide-react-native";

/**
 * Updated Recipe Detail screen (INR)
 *
 * - All prices displayed in ₹ (rupees)
 * - estimatePriceByName returns INR estimates when cost missing
 * - Robust numeric parsing retained
 *
 * Change API_BASE_URL to point to your backend if needed.
 */
const API_BASE_URL = "http://localhost:5000"; // <- update if needed

type Ingredient = { name: string; quantity?: string | number; unit?: string; cost?: number | string };
type Recipe = {
  id?: string;
  title?: string;
  image?: string;
  time?: string;
  servings?: string | number;
  calories?: string;
  source?: string;
  confidence?: string;
  ingredients?: Ingredient[];
  instructions?: string[];
  cuisine?: string;
  difficulty?: string;
  tags?: string[];
  nutritional_info?: Record<string, any>;
};

const defaultRecipeFallback: Recipe = {
  title: "Recipe Details",
  image: "🍽️",
  time: "30 min",
  servings: "2",
  ingredients: [],
  instructions: [],
};

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams() as any;
  const { recipe: recipeParam, recipes: recipesParam, id } = params || {};
=======
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, 
  Clock, 
  Users, 
  Plus, 
  Minus,
  ShoppingCart,
  Star,
  Utensils,
  Flame,
  DollarSign,
  BookOpen,
  Scale,
  Bookmark,
  ExternalLink,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Recipe {
  id: string;
  title: string;
  time: string;
  servings: string;
  calories: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  cuisine?: string;
  difficulty?: string;
  costBreakdown?: string;
}

interface IngredientItem {
  name: string;
  amount: number;
  unit: string;
  cost: number;
}

interface RecipeStep {
  id: number;
  instruction: string;
  icon: string;
  timer?: number;
}

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeSteps, setRecipeSteps] = useState<RecipeStep[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [servings, setServings] = useState(2);
  const [expandedSteps, setExpandedSteps] = useState(true);
  const [ingredientAmounts, setIngredientAmounts] = useState<Record<number, number>>({});
  const [saved, setSaved] = useState(false);

  // Function to open Zepto
  const openZepto = async () => {
    const zeptoUrl = 'https://www.zepto.com';
    const zeptoAppUrl = 'zepto://';
    
    try {
      // Try to open the app first
      const canOpen = await Linking.canOpenURL(zeptoAppUrl);
      if (canOpen) {
        await Linking.openURL(zeptoAppUrl);
      } else {
        // Fallback to website
        await Linking.openURL(zeptoUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open Zepto. Please make sure the app is installed or try again later.');
    }
  };

  // Function to open Blinkit
  const openBlinkit = async () => {
    const blinkitUrl = 'https://www.blinkit.com';
    const blinkitAppUrl = 'blinkit://';
    
    try {
      // Try to open the app first
      const canOpen = await Linking.canOpenURL(blinkitAppUrl);
      if (canOpen) {
        await Linking.openURL(blinkitAppUrl);
      } else {
        // Fallback to website
        await Linking.openURL(blinkitUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open Blinkit. Please make sure the app is installed or try again later.');
    }
  };

  // Function to open grocery delivery with recipe ingredients pre-searched
  const openGroceryWithIngredients = async (app: 'zepto' | 'blinkit') => {
    if (!recipe) return;
    
    // Create a search query with main ingredients
    const mainIngredients = ingredients.slice(0, 3).map(ing => ing.name).join(' ');
    const searchQuery = `${recipe.title} ${mainIngredients}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    let url = '';
    if (app === 'zepto') {
      url = `https://www.zepto.com/search?q=${encodedQuery}`;
    } else {
      url = `https://www.blinkit.com/search?q=${encodedQuery}`;
    }
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', `Could not open ${app}. Please try again.`);
    }
  };

  useEffect(() => {
    if (params.recipe) {
      try {
        const parsedRecipe: Recipe = JSON.parse(params.recipe as string);
        setRecipe(parsedRecipe);
        
        if (parsedRecipe.servings) {
          const initialServings = parseInt(parsedRecipe.servings, 10) || 2;
          setServings(initialServings);
        }
        
        const steps: RecipeStep[] = parsedRecipe.instructions.map((instruction, index) => {
          let icon = '🍳';
          const lowerInstruction = instruction.toLowerCase();
          
          if (lowerInstruction.includes('boil') || lowerInstruction.includes('water') || lowerInstruction.includes('simmer')) {
            icon = '💧';
          } else if (lowerInstruction.includes('chop') || lowerInstruction.includes('cut') || lowerInstruction.includes('slice')) {
            icon = '🔪';
          } else if (lowerInstruction.includes('mix') || lowerInstruction.includes('stir') || lowerInstruction.includes('combine')) {
            icon = '🥄';
          } else if (lowerInstruction.includes('bake') || lowerInstruction.includes('oven') || lowerInstruction.includes('roast')) {
            icon = '🔥';
          } else if (lowerInstruction.includes('fry') || lowerInstruction.includes('sauté') || lowerInstruction.includes('pan')) {
            icon = '🍳';
          } else if (lowerInstruction.includes('season') || lowerInstruction.includes('salt') || lowerInstruction.includes('pepper')) {
            icon = '🧂';
          } else if (lowerInstruction.includes('serve') || lowerInstruction.includes('plate') || lowerInstruction.includes('garnish')) {
            icon = '🍽️';
          }
          
          const timeRegex = /(\d+)[-\s]?(?:minute|min|minutes|hour|hr|hours)/i;
          const timeMatch = timeRegex.exec(instruction);
          const timer = timeMatch ? parseInt(timeMatch[1], 10) : undefined;
          
          return { id: index + 1, instruction, icon, timer };
        });
        setRecipeSteps(steps);
        
        let formattedIngredients: IngredientItem[] = [];
        if (Array.isArray(parsedRecipe.ingredients)) {
          formattedIngredients = (parsedRecipe.ingredients as string[]).map((ing, idx) => {
            const regex = /(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/;
            const match = regex.exec(ing);
            
            let name = ing;
            let amount = 1;
            let unit = 'item';
            
            if (match) {
              amount = parseFloat(match[1]) || 1;
              if (match[2]) unit = match[2];
              name = ing.replace(regex, '').trim();
            }
            
            if (name === ing) {
              amount = 1;
              unit = 'item';
            }
            
            const cost = parseFloat((Math.random() * 3 + 0.5).toFixed(2));
            return { name, amount, unit, cost };
          });
        }
        
        setIngredients(formattedIngredients);
        const initialAmounts = formattedIngredients.reduce((acc, ing, index) => ({
          ...acc,
          [index]: ing.amount,
        }), {});
        setIngredientAmounts(initialAmounts);
        
      } catch (error) {
        console.error('Error parsing recipe:', error);
      }
    }
  }, [params.recipe]);
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [servingsLocal, setServingsLocal] = useState<number | undefined>(undefined);
  const [ingredientAmounts, setIngredientAmounts] = useState<Record<number, number>>({});

  const [enhancing, setEnhancing] = useState(false);
  const [customEnhText, setCustomEnhText] = useState("");

  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderVendor, setOrderVendor] = useState<"zepto" | "blinkit" | null>(null);
  const [orderSelections, setOrderSelections] = useState<{ index: number; selected: boolean; qty: number }[]>([]);

  // safe parse helpers
  const toNumberSafe = (v: any, fallback = 0): number => {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "number") {
      return isFinite(v) ? v : fallback;
    }
    if (typeof v === "string") {
      const cleaned = v.trim().replace(/[,]/g, "").replace(/[^\d.\-]/g, " ");
      const match = cleaned.match(/-?\d*\.?\d+/);
      if (match) {
        const n = Number(match[0]);
        return isFinite(n) ? n : fallback;
      }
      return fallback;
    }
    try {
      const n = Number(v);
      return isFinite(n) ? n : fallback;
    } catch {
      return fallback;
    }
  };

  // basic INR estimates for common grocery items (used when ingredient.cost missing)
  const estimatePriceByName = (name: string): number => {
    if (!name) return 5;
    const n = name.toLowerCase();
    if (n.includes("tomato")) return 15; // per unit approx INR
    if (n.includes("onion")) return 10;
    if (n.includes("garlic")) return 5; // per clove approx
    if (n.includes("bell pepper")) return 25;
    if (n.includes("olive oil")) return 40; // per tbsp estimate
    if (n.includes("ghee")) return 45;
    if (n.includes("flour")) return 30; // per 100g chunk estimate
    if (n.includes("sugar")) return 20;
    if (n.includes("salt")) return 5;
    if (n.includes("cumin")) return 12;
    if (n.includes("turmeric")) return 10;
    if (n.includes("ginger")) return 8;
    // fallback small default
    return 20;
  };

  const tryParseJSON = (maybe: string | undefined) => {
    if (!maybe) return null;
    try {
      return JSON.parse(decodeURIComponent(maybe));
    } catch {
      try {
        return JSON.parse(maybe);
      } catch {
        return null;
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      if (recipesParam) {
        const parsed = tryParseJSON(recipesParam);
        if (Array.isArray(parsed)) {
          setRecipes(parsed);
          setSelectedIndex(0);
          initLocalStateForRecipe(parsed[0]);
          return;
        }
      }

      if (recipeParam) {
        const parsed = tryParseJSON(recipeParam);
        if (parsed) {
          setRecipes([parsed]);
          setSelectedIndex(0);
          initLocalStateForRecipe(parsed);
          return;
        }
      }

      if (id) {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/recipe/${encodeURIComponent(id)}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.success && json.recipe) {
            setRecipes([json.recipe]);
            setSelectedIndex(0);
            initLocalStateForRecipe(json.recipe);
          } else {
            Alert.alert("Not found", "Recipe not found on server");
            setRecipes([]);
          }
        } catch (err) {
          console.error("fetch recipe error", err);
          Alert.alert("Error", "Failed to fetch recipe from server");
        } finally {
          setLoading(false);
        }
        return;
      }

      setRecipes([]);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeParam, recipesParam, id]);

  useEffect(() => {
    const cur = recipes[selectedIndex];
    if (cur) initLocalStateForRecipe(cur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, recipes]);

  function initLocalStateForRecipe(recipe: Recipe) {
    const baseServings = Number(recipe.servings ?? 2) || 2;
    setServingsLocal(baseServings);

    const ingr = recipe.ingredients ?? [];
    const amounts = ingr.reduce((acc, ing, idx) => {
      const amt = toNumberSafe(ing.quantity, 1);
      acc[idx] = amt;
      return acc;
    }, {} as Record<number, number>);
    setIngredientAmounts(amounts);

    setOrderSelections(
      ingr.map((_, idx) => ({
        index: idx,
        selected: false,
        qty: amounts[idx] ?? 1,
      }))
    );
  }

  const current = recipes[selectedIndex] ?? defaultRecipeFallback;

  const handleEnhance = async (enhancementType: string, customText?: string) => {
    if (!current?.id) {
      Alert.alert("Cannot enhance", "Recipe ID is missing. Use id-based flow for enhancements.");
      return;
    }

    setEnhancing(true);
    try {
      const body: any = { recipeId: current.id, enhancementType };
      if (enhancementType === "custom" && customText) body.customInstructions = customText;

      const res = await fetch(`${API_BASE_URL}/extractor/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.recipe) {
        setRecipes((prev) => prev.map((r) => (r.id === json.recipe.id ? json.recipe : r)));
        const idx = recipes.findIndex((r) => r.id === json.recipe.id);
        if (idx >= 0) setSelectedIndex(idx);
        else {
          setRecipes((prev) => [...prev, json.recipe]);
          setSelectedIndex(recipes.length);
        }
        Alert.alert("Success", "Recipe enhanced successfully");
      } else {
        throw new Error(json.error || "Enhancement failed");
      }
    } catch (err: any) {
      console.error("enhance error", err);
      Alert.alert("Enhance error", err.message || String(err));
    } finally {
      setEnhancing(false);
    }
  };

  // servings adjusts amounts proportionally
  const adjustServings = (change: number) => {
<<<<<<< HEAD
    const currentServings = servingsLocal ?? Number(current.servings ?? 2) ?? 2;
    const newServings = Math.max(1, currentServings + change);
    setServingsLocal(newServings);

    const base = Number(current.servings ?? 2) || 2;
    const ratio = newServings / base;
    const newAmounts = (current.ingredients ?? []).reduce((acc, ing, idx) => {
      const original = ingredientAmounts[idx] ?? toNumberSafe(ing.quantity, 1);
      acc[idx] = Math.round(original * ratio * 10) / 10;
      return acc;
    }, {} as Record<number, number>);
=======
    if (!recipe) return;
    
    const newServings = Math.max(1, servings + change);
    setServings(newServings);
    
    const baseServings = parseInt(recipe.servings, 10) || 2;
    const ratio = newServings / baseServings;
    
    const newAmounts = ingredients.reduce((acc, ing, index) => ({
      ...acc,
      [index]: Math.round(ing.amount * ratio * 10) / 10,
    }), {});
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
    setIngredientAmounts(newAmounts);

    setOrderSelections((prev) => prev.map((s) => ({ ...s, qty: newAmounts[s.index] ?? s.qty })));
  };

  const adjustIngredient = (index: number, change: number) => {
<<<<<<< HEAD
    setIngredientAmounts((prev) => {
      const newVal = Math.max(0, (prev[index] ?? 1) + change);
      const copy = { ...prev, [index]: Math.round(newVal * 10) / 10 };
      return copy;
    });

    setOrderSelections((prev) => prev.map((s) => (s.index === index ? { ...s, qty: Math.max(0.1, Math.round(((ingredientAmounts[index] ?? 1) + change) * 10) / 10) } : s)));
=======
    setIngredientAmounts(prev => ({
      ...prev,
      [index]: Math.max(0, (prev[index] || ingredients[index]?.amount || 0) + change),
    }));
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
  };

  // compute total cost safely (INR)
  const getTotalCost = () => {
<<<<<<< HEAD
    const ingr = current.ingredients ?? [];
    const total = ingr.reduce((sum, ing, idx) => {
      const currentAmt = ingredientAmounts[idx] ?? toNumberSafe(ing.quantity, 1);
      const baseAmt = toNumberSafe(ing.quantity, 1);
      const ratio = baseAmt > 0 ? currentAmt / baseAmt : 1;

      const costProvided = toNumberSafe(ing.cost, NaN);
      const costPerBase = isFinite(costProvided) ? costProvided : estimatePriceByName(ing.name ?? "");
      const itemCost = costPerBase * ratio;

      return sum + (isFinite(itemCost) ? itemCost : 0);
    }, 0);

    return isFinite(total) ? total.toFixed(2) : "0.00";
  };

  const getNutritionInfo = () => {
    const base = { calories: Number(current.calories ?? 420), protein: 12, carbs: 45, fats: 18 };
    const baseServings = Number(current.servings ?? 2) || 2;
    const ratio = (servingsLocal ?? baseServings) / baseServings;
=======
    if (!ingredients.length) return "0.00";
    return ingredients.reduce((total, ing, index) => {
      const currentAmount = ingredientAmounts[index] || ing.amount;
      const ratio = currentAmount / ing.amount;
      return total + (ing.cost * ratio);
    }, 0).toFixed(2);
  };

  const getNutritionInfo = () => {
    const baseCalories = recipe?.calories ? parseInt(recipe.calories, 10) : 350;
    const base = {
      calories: baseCalories,
      protein: Math.round(baseCalories * 0.03),
      carbs: Math.round(baseCalories * 0.11),
      fats: Math.round(baseCalories * 0.04),
    };
    
    const baseServings = parseInt(recipe?.servings || '2', 10);
    const ratio = servings / baseServings;
    
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
    return {
      calories: Math.round(base.calories * ratio),
      protein: Math.round(base.protein * ratio),
      carbs: Math.round(base.carbs * ratio),
      fats: Math.round(base.fats * ratio),
    };
  };

  const nutrition = getNutritionInfo();

  const openOrderModal = (vendor: "zepto" | "blinkit") => {
    const ingr = current.ingredients ?? [];
    const selections = ingr.map((_, idx) => ({
      index: idx,
      selected: false,
      qty: Math.max(0.1, ingredientAmounts[idx] ?? toNumberSafe(current.ingredients?.[idx]?.quantity, 1)),
    }));
    setOrderSelections(selections);
    setOrderVendor(vendor);
    setOrderModalVisible(true);
  };

  const closeOrderModal = () => {
    setOrderModalVisible(false);
    setOrderVendor(null);
  };

  const toggleSelect = (idx: number) => {
    setOrderSelections((prev) => prev.map((s) => (s.index === idx ? { ...s, selected: !s.selected } : s)));
  };

  const changeOrderQty = (idx: number, delta: number) => {
    setOrderSelections((prev) => prev.map((s) => (s.index === idx ? { ...s, qty: Math.max(0.1, Math.round((s.qty + delta) * 10) / 10) } : s)));
  };

  const orderTotal = useMemo(() => {
    const ingr = current.ingredients ?? [];
    const total = orderSelections.filter((s) => s.selected).reduce((sum, s) => {
      const ing = ingr[s.index];
      const baseAmt = toNumberSafe(ing.quantity, 1);
      const ratio = baseAmt > 0 ? s.qty / baseAmt : 1;
      const costProvided = toNumberSafe(ing.cost, NaN);
      const costPerBase = isFinite(costProvided) ? costProvided : estimatePriceByName(ing.name ?? "");
      const itemCost = costPerBase * ratio;
      return sum + (isFinite(itemCost) ? itemCost : 0);
    }, 0);
    return isFinite(total) ? total.toFixed(2) : "0.00";
  }, [orderSelections, current, ingredientAmounts]);

  const confirmOrder = async () => {
    const chosen = orderSelections.filter((s) => s.selected);
    if (chosen.length === 0) {
      Alert.alert("No items selected", "Please select at least one ingredient to order.");
      return;
    }

    const ingr = current.ingredients ?? [];
    const names = chosen
      .map((c) => {
        const it = ingr[c.index];
        return `${it.name} ${c.qty} ${it.unit ?? ""}`.trim();
      })
      .join(", ");

    const query = encodeURIComponent(names + " grocery");
    const url = `https://www.google.com/search?q=${query}`;

    closeOrderModal();

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Cannot open browser", "Unable to open the browser to place order.");
      }
    } catch (err) {
      console.error("open link error", err);
      Alert.alert("Error", "Failed to open ordering link.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const renderRecipeTabs = () => {
    if (recipes.length <= 1) return null;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {recipes.map((r, idx) => (
          <TouchableOpacity
            key={r.id ?? idx}
            onPress={() => setSelectedIndex(idx)}
            style={[styles.tabBtn, idx === selectedIndex ? styles.tabBtnActive : undefined]}
          >
            <Text style={idx === selectedIndex ? styles.tabTextActive : styles.tabText}>{r.title?.slice(0, 20) ?? `Recipe ${idx + 1}`}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#2D3748" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
        </View>
        <View style={[styles.content, {alignItems: 'center', justifyContent: 'center'}]}>
          <Text style={{fontSize: 16, color: '#718096'}}>Loading recipe details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
<<<<<<< HEAD
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Back">
          <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {current?.title ?? "Recipe Details"}
        </Text>
=======
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{recipe.title}</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saved && styles.saveButtonActive]}
          onPress={() => setSaved(!saved)}>
          <Bookmark size={20} color={saved ? '#FFFFFF' : '#718096'} fill={saved ? '#FFFFFF' : 'none'} />
        </TouchableOpacity>
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
      </View>

      {renderRecipeTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.recipeImage}>
<<<<<<< HEAD
            <Text style={styles.recipeEmoji}>{current?.image ?? "🍝"}</Text>
          </View>
          <Text style={styles.recipeTitle}>{current?.title ?? "Mediterranean Pasta"}</Text>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.metaText}>Prep: {current?.time ?? "10 min"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Timer size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.metaText}>Cook: {current?.time ?? "25 min"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.metaText}>{servingsLocal ?? current?.servings ?? "2"} servings</Text>
=======
            <Text style={styles.recipeEmoji}>{recipe.image || '🍝'}</Text>
          </View>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          
          <View style={styles.recipeMeta}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#718096" />
              <Text style={styles.metaText}>{recipe.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={16} color="#718096" />
              <Text style={styles.metaText}>{servings} servings</Text>
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
            </View>
            {recipe.cuisine && (
              <View style={styles.metaItem}>
                <Utensils size={16} color="#718096" />
                <Text style={styles.metaText}>{recipe.cuisine}</Text>
              </View>
            )}
          </View>

          {recipe.difficulty && (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
            </View>
          )}

          <View style={styles.servingsControl}>
            <Text style={styles.servingsLabel}>Adjust Servings</Text>
            <View style={styles.servingsButtons}>
<<<<<<< HEAD
              <TouchableOpacity style={styles.servingsButton} onPress={() => adjustServings(-1)} disabled={(servingsLocal ?? Number(current?.servings ?? 2)) <= 1}>
                <Minus size={16} color="#6C8BE6" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.servingsNumber}>{servingsLocal ?? current?.servings ?? 2}</Text>
              <TouchableOpacity style={styles.servingsButton} onPress={() => adjustServings(1)}>
                <Plus size={16} color="#6C8BE6" strokeWidth={2} />
=======
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(-1)}
                disabled={servings <= 1}>
                <Minus size={16} color="#7C3AED" />
              </TouchableOpacity>
              <Text style={styles.servingsNumber}>{servings}</Text>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => adjustServings(1)}>
                <Plus size={16} color="#7C3AED" />
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
<<<<<<< HEAD
          <TouchableOpacity style={styles.seeFullButton} onPress={() => { /* placeholder */ }}>
            <Text style={styles.seeFullButtonText}>See Full Recipe</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.goWithButton} onPress={() => router.push("/(tabs)/home")}>
            <Text style={styles.goWithButtonText}>Go with this Recipe</Text>
          </TouchableOpacity>
        </View>

        {/* Ingredients */}
        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {(current.ingredients ?? []).length === 0 ? (
            <Text style={{ color: "#64748B" }}>No ingredients available.</Text>
          ) : (
            (current.ingredients ?? []).map((ingredient, index) => {
              const amt = ingredientAmounts[index] ?? toNumberSafe(ingredient.quantity, 1);
              const baseAmt = toNumberSafe(ingredient.quantity, 1);
              const ratio = baseAmt > 0 ? amt / baseAmt : 1;
              const costProvided = toNumberSafe(ingredient.cost, NaN);
              const costPerBase = isFinite(costProvided) ? costProvided : estimatePriceByName(ingredient.name ?? "");
              const itemCostNum = isFinite(costPerBase * ratio) ? costPerBase * ratio : 0;
              const itemCost = itemCostNum.toFixed(2);

              return (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientAmount}>
                      {amt} {ingredient.unit ?? ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 14, color: "#6C8BE6", fontWeight: "600" }}>₹{itemCost}</Text>
                    <View style={styles.ingredientControls}>
                      <TouchableOpacity style={styles.ingredientButton} onPress={() => adjustIngredient(index, -0.5)}>
                        <Minus size={12} color="#6C8BE6" strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.ingredientButton} onPress={() => adjustIngredient(index, 0.5)}>
                        <Plus size={12} color="#6C8BE6" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Cost breakdown */}
        <View style={styles.costSection}>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          <View style={styles.costCard}>
            <View style={styles.costHeader}>
              <Text style={styles.costTotal}>Total: ₹{getTotalCost()}</Text>
              <Text style={styles.costPer}>
                Per serving: ₹
                {(() => {
                  const total = Number(getTotalCost());
                  const serv = Number(servingsLocal ?? Number(current.servings ?? 2)) || 1;
                  const per = serv > 0 ? (total / serv).toFixed(2) : "0.00";
                  return per;
                })()}
              </Text>
            </View>
            {(current.ingredients ?? []).map((ing, index) => {
              const currentAmount = ingredientAmounts[index] ?? toNumberSafe(ing.quantity, 1);
              const baseAmt = toNumberSafe(ing.quantity, 1);
              const ratio = baseAmt > 0 ? currentAmount / baseAmt : 1;
              const costProvided = toNumberSafe(ing.cost, NaN);
              const costPerBase = isFinite(costProvided) ? costProvided : estimatePriceByName(ing.name ?? "");
              const itemCostNum = isFinite(costPerBase * ratio) ? costPerBase * ratio : 0;
              const itemCost = itemCostNum.toFixed(2);
              return (
                <View key={index} style={styles.costRow}>
                  <Text style={styles.costItem}>{ing.name}</Text>
                  <Text style={styles.costAmount}>₹{itemCost}</Text>
                </View>
              );
            })}
=======
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoWithRecipe}>
            <Star size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Start Cooking</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setExpandedSteps(!expandedSteps)}>
            <BookOpen size={20} color="#7C3AED" />
            <Text style={styles.secondaryButtonText}>
              {expandedSteps ? 'Hide Instructions' : 'Show Instructions'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ingredients Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Scale size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Ingredients</Text>
            </View>
            <Text style={styles.sectionSubtitle}>{ingredients.length} items</Text>
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
          </View>
          
          {ingredients.length > 0 ? (
            <View style={styles.ingredientsList}>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientAmount}>
                      {ingredientAmounts[index] || ingredient.amount} {ingredient.unit}
                    </Text>
                  </View>
                  <View style={styles.ingredientControls}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustIngredient(index, -0.5)}>
                      <Minus size={12} color="#7C3AED" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustIngredient(index, 0.5)}>
                      <Plus size={12} color="#7C3AED" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No ingredients information available</Text>
          )}
        </View>

<<<<<<< HEAD
        {/* Nutrition */}
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nutrition Breakdown</Text>
=======
        {/* Nutrition Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Flame size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Nutrition</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Per serving</Text>
          </View>
          
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.fats}g</Text>
              <Text style={styles.nutritionLabel}>Fats</Text>
            </View>
          </View>
        </View>

<<<<<<< HEAD
        {/* Substitutions & Instructions (same UI) */}
        <View style={styles.substitutionsSection}>
          <Text style={styles.sectionTitle}>Smart Substitutions</Text>
          <View style={styles.substitutionCard}>
            <View style={styles.substitutionHeader}>
              <Text style={styles.substitutionFrom}>Tomatoes</Text>
              <Text style={styles.substitutionArrow}>→</Text>
              <Text style={styles.substitutionTo}>Cherry Tomatoes</Text>
            </View>
            <Text style={styles.substitutionEffect}>Sweeter flavor, +10% antioxidants</Text>
          </View>
          <View style={styles.substitutionCard}>
            <View style={styles.substitutionHeader}>
              <Text style={styles.substitutionFrom}>Bell Peppers</Text>
              <Text style={styles.substitutionArrow}>→</Text>
              <Text style={styles.substitutionTo}>Zucchini</Text>
            </View>
            <Text style={styles.substitutionEffect}>Lower calories, softer texture</Text>
          </View>
        </View>

        {current.instructions && current.instructions.length > 0 ? (
          <View style={styles.stepsSection}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {current.instructions.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumberBubble}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepInstruction}>{step}</Text>
=======
        {/* Cost Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <DollarSign size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Cost Breakdown</Text>
            </View>
          </View>
          
          <View style={styles.costSummary}>
            <Text style={styles.costTotal}>Total: ${getTotalCost()}</Text>
            <Text style={styles.costPerServing}>${(parseFloat(getTotalCost()) / servings).toFixed(2)} per serving</Text>
          </View>
          
          {recipe.costBreakdown ? (
            <Text style={styles.costBreakdown}>{recipe.costBreakdown}</Text>
          ) : (
            <View style={styles.costDetails}>
              {ingredients.map((ing, index) => {
                const currentAmount = ingredientAmounts[index] || ing.amount;
                const ratio = currentAmount / ing.amount;
                const itemCost = (ing.cost * ratio).toFixed(2);
                return (
                  <View key={index} style={styles.costRow}>
                    <Text style={styles.costItem}>{ing.name}</Text>
                    <Text style={styles.costAmount}>${itemCost}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Instructions Section */}
        {expandedSteps && recipe.instructions && recipe.instructions.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <BookOpen size={20} color="#7C3AED" />
                <Text style={styles.sectionTitle}>Instructions</Text>
              </View>
              <Text style={styles.sectionSubtitle}>{recipe.instructions.length} steps</Text>
            </View>
            
            <View style={styles.instructionsList}>
              {recipeSteps.map((step, index) => (
                <View key={step.id} style={styles.instructionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                    {step.timer && (
                      <View style={styles.stepTimer}>
                        <Clock size={12} color="#7C3AED" />
                        <Text style={styles.stepTimerText}>{step.timer} minutes</Text>
                      </View>
                    )}
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
                  </View>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

<<<<<<< HEAD
        {/* Enhancements */}
        <Text style={styles.sectionTitle}>Enhance Recipe</Text>
        <View style={styles.enhRow}>
          <TouchableOpacity style={styles.enhBtn} onPress={() => handleEnhance("vegetarian")} disabled={enhancing}>
            <Text style={styles.enhBtnText}>Make Vegetarian</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.enhBtn} onPress={() => handleEnhance("spicier")} disabled={enhancing}>
            <Text style={styles.enhBtnText}>Make Spicier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.enhBtn} onPress={() => handleEnhance("double-portions")} disabled={enhancing}>
            <Text style={styles.enhBtnText}>Double Portions</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12 }}>
          <TextInput value={customEnhText} onChangeText={setCustomEnhText} placeholder="Custom change (e.g., reduce oil, swap ingredient)" style={styles.customInput} editable={!enhancing} />
          <TouchableOpacity style={[styles.enhBtn, { marginTop: 8 }]} onPress={() => handleEnhance("custom", customEnhText)} disabled={!customEnhText.trim() || enhancing}>
            <Text style={styles.enhBtnText}>Apply Custom Change</Text>
          </TouchableOpacity>
        </View>

        {/* Order */}
        <View style={styles.orderSection}>
          <Text style={styles.orderTitle}>Missing ingredients?</Text>
          <View style={styles.orderButtons}>
            <TouchableOpacity style={styles.orderButton} onPress={() => openOrderModal("zepto")}>
              <ShoppingCart size={16} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.orderButtonText}>Order on Zepto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.orderButton} onPress={() => openOrderModal("blinkit")}>
              <ShoppingCart size={16} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.orderButtonText}>Order on Blinkit</Text>
=======
        {/* Order Section - Now with functional buttons */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <ShoppingCart size={24} color="#FFFFFF" />
            <View>
              <Text style={styles.orderTitle}>Missing ingredients?</Text>
              <Text style={styles.orderSubtitle}>Get them delivered in minutes</Text>
            </View>
          </View>
          
          <View style={styles.orderButtons}>
            <TouchableOpacity 
              style={styles.orderButton}
              onPress={() => openGroceryWithIngredients('zepto')}>
              <View style={styles.orderButtonContent}>
                <Text style={styles.orderButtonLogo}>Z</Text>
                <View style={styles.orderButtonInfo}>
                  <Text style={styles.orderButtonTitle}>Zepto</Text>
                  <Text style={styles.orderButtonSubtitle}>10-15 min delivery</Text>
                </View>
                <ExternalLink size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.orderButton, styles.orderButtonSecondary]}
              onPress={() => openGroceryWithIngredients('blinkit')}>
              <View style={styles.orderButtonContent}>
                <Text style={[styles.orderButtonLogo, styles.orderButtonLogoSecondary]}>B</Text>
                <View style={styles.orderButtonInfo}>
                  <Text style={[styles.orderButtonTitle, styles.orderButtonTitleSecondary]}>Blinkit</Text>
                  <Text style={[styles.orderButtonSubtitle, styles.orderButtonSubtitleSecondary]}>10 min delivery</Text>
                </View>
                <ExternalLink size={16} color="#7C3AED" />
              </View>
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.finalAction}>
<<<<<<< HEAD
          <TouchableOpacity style={styles.finalGoButton} onPress={() => router.push("/(tabs)/home")}>
            <Star size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.finalGoButtonText}>Go with this Recipe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.chatbotFloat} onPress={() => router.push("/chatbot")}>
        <Text style={styles.chatbotIcon}>💬</Text>
      </TouchableOpacity>

      {/* Order Modal */}
      <Modal visible={orderModalVisible} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>{orderVendor === "zepto" ? "Order on Zepto" : "Order on Blinkit"}</Text>
              <TouchableOpacity onPress={closeOrderModal} style={modalStyles.closeBtn}>
                <Text style={{ fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={modalStyles.subtitle}>Choose ingredients to order</Text>

            <FlatList
              data={orderSelections}
              keyExtractor={(item) => String(item.index)}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => {
                const ing = current.ingredients?.[item.index] ?? { name: "Unknown", unit: "", quantity: 1, cost: 0 };
                const currentAmount = item.qty;
                const baseAmt = toNumberSafe(ing.quantity, 1);
                const ratio = baseAmt > 0 ? currentAmount / baseAmt : 1;
                const costProvided = toNumberSafe(ing.cost, NaN);
                const costPerBase = isFinite(costProvided) ? costProvided : estimatePriceByName(ing.name ?? "");
                const cost = isFinite(costPerBase * ratio) ? (costPerBase * ratio).toFixed(2) : "0.00";

                return (
                  <View style={modalStyles.itemRow}>
                    <TouchableOpacity onPress={() => toggleSelect(item.index)} style={modalStyles.checkbox}>
                      {item.selected ? <Text style={modalStyles.check}>✓</Text> : null}
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.itemName}>{ing.name}</Text>
                      <Text style={modalStyles.itemSub}>
                        {currentAmount} {ing.unit ?? ""} • ₹{cost}
                      </Text>
                    </View>

                    <View style={modalStyles.qtyControls}>
                      <TouchableOpacity onPress={() => changeOrderQty(item.index, -0.5)} style={modalStyles.qtyBtn}>
                        <Minus size={12} color="#6C8BE6" strokeWidth={2} />
                      </TouchableOpacity>
                      <Text style={modalStyles.qtyText}>{currentAmount}</Text>
                      <TouchableOpacity onPress={() => changeOrderQty(item.index, 0.5)} style={modalStyles.qtyBtn}>
                        <Plus size={12} color="#6C8BE6" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />

            <View style={modalStyles.footer}>
              <Text style={modalStyles.totalText}>Total: ₹{orderTotal}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={modalStyles.cancelBtn} onPress={closeOrderModal}>
                  <Text style={modalStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.confirmBtn} onPress={confirmOrder}>
                  <Text style={modalStyles.confirmText}>Confirm & Open {orderVendor === "zepto" ? "Zepto" : "Blinkit"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
=======
          <TouchableOpacity
            style={styles.finalGoButton}
            onPress={handleGoWithRecipe}>
            <Star size={20} color="#FFFFFF" />
            <Text style={styles.finalGoButtonText}>Start Cooking This Recipe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
    </SafeAreaView>
  );
}

/* Styles (unchanged layout & visuals) */
const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { flex: 1, backgroundColor: "#F6F8FB" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EFF3FF", alignItems: "center", justifyContent: "center", marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1F2937", flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  heroSection: { alignItems: "center", marginBottom: 24 },
  recipeImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#EFF3FF", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  recipeEmoji: { fontSize: 48 },
  recipeTitle: { fontSize: 24, fontWeight: "bold", color: "#1F2937", textAlign: "center", marginBottom: 16 },
  metaInfo: { flexDirection: "row", gap: 20, marginBottom: 20 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  servingsControl: { flexDirection: "row", alignItems: "center", gap: 16 },
  servingsLabel: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  servingsButtons: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF3FF", borderRadius: 20, padding: 4 },
  servingsButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  servingsNumber: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginHorizontal: 16, minWidth: 20, textAlign: "center" },
  actionButtons: { flexDirection: "row", gap: 12, marginBottom: 32 },
  seeFullButton: { flex: 1, backgroundColor: "#EFF3FF", borderRadius: 12, padding: 16, alignItems: "center", justifyContent: "center", minHeight: 56 },
  seeFullButtonText: { fontSize: 16, fontWeight: "600", color: "#6C8BE6" },
  goWithButton: { flex: 1, backgroundColor: "#6C8BE6", borderRadius: 12, padding: 16, alignItems: "center", justifyContent: "center", minHeight: 56 },
  goWithButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#1F2937", marginBottom: 16 },
  ingredientsSection: { marginBottom: 32 },
  ingredientRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: "#EFF3FF" },
  ingredientInfo: { flex: 1 },
  ingredientName: { fontSize: 16, fontWeight: "500", color: "#1F2937", marginBottom: 2 },
  ingredientAmount: { fontSize: 14, color: "#6B7280" },
  ingredientControls: { flexDirection: "row", gap: 8 },
  ingredientButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#EFF3FF", alignItems: "center", justifyContent: "center" },
  costSection: { marginBottom: 32 },
  costCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#EFF3FF" },
  costHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#EFF3FF" },
  costTotal: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  costPer: { fontSize: 14, color: "#6B7280" },
  costRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  costItem: { fontSize: 14, color: "#1F2937" },
  costAmount: { fontSize: 14, fontWeight: "500", color: "#6C8BE6" },
  nutritionSection: { marginBottom: 32 },
  nutritionGrid: { flexDirection: "row", gap: 12 },
  nutritionCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#EFF3FF" },
  nutritionValue: { fontSize: 18, fontWeight: "bold", color: "#6C8BE6", marginBottom: 4 },
  nutritionLabel: { fontSize: 12, color: "#6B7280", textAlign: "center" },
  substitutionsSection: { marginBottom: 32 },
  substitutionCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#EFF3FF" },
  substitutionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  substitutionFrom: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  substitutionArrow: { fontSize: 16, color: "#6C8BE6", marginHorizontal: 8 },
  substitutionTo: { fontSize: 14, fontWeight: "600", color: "#6C8BE6" },
  substitutionEffect: { fontSize: 12, color: "#6B7280", fontStyle: "italic" },
  stepsSection: { marginBottom: 32 },
  stepCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#EFF3FF" },
  stepHeader: { flexDirection: "row", gap: 16 },
  stepNumberBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF3FF", alignItems: "center", justifyContent: "center" },
  stepNumberText: { color: "#6C8BE6", fontWeight: "700" },
  stepInstruction: { fontSize: 14, color: "#1F2937", lineHeight: 20, marginBottom: 8 },
  enhRow: { flexDirection: "row", gap: 8, marginVertical: 8 },
  enhBtn: { flex: 1, backgroundColor: "#6C8BE6", padding: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  enhBtnText: { color: "#fff", fontWeight: "700" },
  customInput: { marginTop: 8, backgroundColor: "#fff", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#EEF2FF" },
  orderSection: { marginBottom: 32 },
  orderTitle: { fontSize: 18, fontWeight: "600", color: "#1F2937", marginBottom: 16, textAlign: "center" },
  orderButtons: { flexDirection: "row", gap: 12 },
  orderButton: { flex: 1, backgroundColor: "#EFF3FF", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 56 },
  orderButtonText: { fontSize: 14, fontWeight: "600", color: "#6C8BE6" },
  finalAction: { marginBottom: 40 },
  finalGoButton: { backgroundColor: "#6C8BE6", borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 64 },
  finalGoButtonText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  chatbotFloat: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#6C8BE6", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  chatbotIcon: { fontSize: 24 },
  tabsRow: { borderBottomWidth: 1, borderBottomColor: "#EEF2FF", paddingVertical: 8, marginBottom: 8 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8, backgroundColor: "#fff" },
  tabBtnActive: { backgroundColor: "#6C8BE6" },
  tabText: { color: "#334155", fontWeight: "600" },
  tabTextActive: { color: "#fff", fontWeight: "700" },
});

/* Modal styles */
const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "75%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 8 },
  subtitle: { color: "#64748B", marginBottom: 12 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  checkbox: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0", marginRight: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  check: { fontWeight: "700", color: "#6C8BE6" },
  itemName: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  itemSub: { fontSize: 12, color: "#64748B" },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EFF3FF", alignItems: "center", justifyContent: "center" },
  qtyText: { minWidth: 36, textAlign: "center" },
  footer: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalText: { fontSize: 16, fontWeight: "700" },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0" },
  cancelText: { color: "#334155", fontWeight: "600" },
  confirmBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: "#6C8BE6" },
  confirmText: { color: "#fff", fontWeight: "700" },
});
=======
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  recipeImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  recipeEmoji: {
    fontSize: 48,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  difficultyBadge: {
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38A169',
    textTransform: 'capitalize',
  },
  servingsControl: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 16,
    width: '100%',
  },
  servingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  servingsButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  servingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  servingsNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    minWidth: 40,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
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
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  ingredientAmount: {
    fontSize: 12,
    color: '#718096',
  },
  ingredientControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  costSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  costTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  costPerServing: {
    fontSize: 12,
    color: '#718096',
  },
  costBreakdown: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  costDetails: {
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costItem: {
    fontSize: 14,
    color: '#2D3748',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  instructionsList: {
    gap: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#2D3748',
    lineHeight: 20,
    marginBottom: 4,
  },
  stepTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepTimerText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  stepIcon: {
    fontSize: 20,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#7C3AED',
    margin: 24,
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderSubtitle: {
    fontSize: 14,
    color: '#EDE9FE',
  },
  orderButtons: {
    gap: 12,
  },
  orderButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  orderButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  orderButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderButtonLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  orderButtonLogoSecondary: {
    backgroundColor: '#FFFFFF',
    color: '#7C3AED',
  },
  orderButtonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  orderButtonTitleSecondary: {
    color: '#FFFFFF',
  },
  orderButtonSubtitle: {
    fontSize: 12,
    color: '#718096',
  },
  orderButtonSubtitleSecondary: {
    color: '#EDE9FE',
  },
  finalAction: {
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  finalGoButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 64,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  finalGoButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
>>>>>>> 1045d37a227593f1994cfeb1f9ae2bc1c5d0438d
