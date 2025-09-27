// RecipeDetailScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
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
    setIngredientAmounts(newAmounts);

    setOrderSelections((prev) => prev.map((s) => ({ ...s, qty: newAmounts[s.index] ?? s.qty })));
  };

  const adjustIngredient = (index: number, change: number) => {
    setIngredientAmounts((prev) => {
      const newVal = Math.max(0, (prev[index] ?? 1) + change);
      const copy = { ...prev, [index]: Math.round(newVal * 10) / 10 };
      return copy;
    });

    setOrderSelections((prev) => prev.map((s) => (s.index === index ? { ...s, qty: Math.max(0.1, Math.round(((ingredientAmounts[index] ?? 1) + change) * 10) / 10) } : s)));
  };

  // compute total cost safely (INR)
  const getTotalCost = () => {
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Back">
          <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {current?.title ?? "Recipe Details"}
        </Text>
      </View>

      {renderRecipeTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.recipeImage}>
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
            </View>
          </View>

          <View style={styles.servingsControl}>
            <Text style={styles.servingsLabel}>Servings:</Text>
            <View style={styles.servingsButtons}>
              <TouchableOpacity style={styles.servingsButton} onPress={() => adjustServings(-1)} disabled={(servingsLocal ?? Number(current?.servings ?? 2)) <= 1}>
                <Minus size={16} color="#6C8BE6" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.servingsNumber}>{servingsLocal ?? current?.servings ?? 2}</Text>
              <TouchableOpacity style={styles.servingsButton} onPress={() => adjustServings(1)}>
                <Plus size={16} color="#6C8BE6" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
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
          </View>
        </View>

        {/* Nutrition */}
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nutrition Breakdown</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionValue}>{nutrition.fats}g</Text>
              <Text style={styles.nutritionLabel}>Fats</Text>
            </View>
          </View>
        </View>

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
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

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
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.finalAction}>
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
    </SafeAreaView>
  );
}

/* Styles (unchanged layout & visuals) */
const styles = StyleSheet.create({
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
