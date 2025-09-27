import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, RefreshCw, X, Sparkles } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

// === CONFIG: set this to your backend host ===
const SERVER_URL = "http://localhost:5000"; // change for emulator/device as noted above
// ============================================

// Custom SVG Icons
const MealIcon = ({ type, size = 48 }) => {
  const getColor = () => {
    switch (type) {
      case 'breakfast': return '#F59E0B';
      case 'lunch': return '#10B981';
      case 'dinner': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const color = getColor();

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="20" fill={color} fillOpacity="0.1" />
      <Circle cx="24" cy="24" r="12" fill={color} fillOpacity="0.2" />
      <Circle cx="24" cy="24" r="6" fill={color} />
    </Svg>
  );
};

const getCurrentDate = () => {
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[today.getDay()];
};

// keep your initial example plans (strings for backwards compat)
const initialMealPlans = {
  Monday: {
    breakfast: { name: 'Mediterranean Breakfast Bowl', calories: '420 cal', description: 'Greek yogurt with quinoa, berries, and nuts' },
    lunch: { name: 'Grilled Chicken Salad', calories: '380 cal', description: 'Mixed greens with grilled chicken and vinaigrette' },
    dinner: { name: 'Salmon with Asparagus', calories: '520 cal', description: 'Baked salmon with roasted asparagus and quinoa' }
  },
  Tuesday: {
    breakfast: { name: 'Avocado Toast Deluxe', calories: '390 cal', description: 'Whole grain toast with avocado and poached egg' },
    lunch: { name: 'Quinoa Power Bowl', calories: '420 cal', description: 'Quinoa with roasted vegetables and chickpeas' },
    dinner: { name: 'Lean Beef Stir-fry', calories: '480 cal', description: 'Beef with mixed vegetables and brown rice' }
  },
  Wednesday: {
    breakfast: { name: 'Green Smoothie Bowl', calories: '350 cal', description: 'Spinach, banana, and protein powder smoothie bowl' },
    lunch: { name: 'Turkey Wrap', calories: '360 cal', description: 'Whole wheat wrap with turkey and vegetables' },
    dinner: { name: 'Grilled Salmon & Vegetables', calories: '520 cal', description: 'Grilled salmon with seasonal vegetables' }
  },
  Thursday: {
    breakfast: { name: 'Protein Pancakes', calories: '400 cal', description: 'Oat flour pancakes with berries and honey' },
    lunch: { name: 'Buddha Bowl', calories: '440 cal', description: 'Mixed grains with roasted vegetables and tahini' },
    dinner: { name: 'Chicken Teriyaki Rice', calories: '480 cal', description: 'Teriyaki chicken with steamed vegetables and rice' }
  },
  Friday: {
    breakfast: { name: 'Overnight Oats', calories: '380 cal', description: 'Oats soaked with almond milk and chia seeds' },
    lunch: { name: 'Lentil Soup', calories: '320 cal', description: 'Hearty lentil soup with vegetables' },
    dinner: { name: 'Fish Tacos', calories: '450 cal', description: 'Grilled fish tacos with cabbage slaw' }
  },
  Saturday: {
    breakfast: { name: 'Weekend Brunch Bowl', calories: '460 cal', description: 'Eggs benedict with sweet potato hash' },
    lunch: { name: 'Caprese Salad', calories: '340 cal', description: 'Fresh mozzarella with tomatoes and basil' },
    dinner: { name: 'Pasta Primavera', calories: '490 cal', description: 'Whole wheat pasta with seasonal vegetables' }
  },
  Sunday: {
    breakfast: { name: 'French Toast', calories: '420 cal', description: 'Whole grain French toast with fresh fruit' },
    lunch: { name: 'Roasted Vegetable Wrap', calories: '370 cal', description: 'Roasted vegetables in spinach wrap' },
    dinner: { name: 'Veggie Stir-Fry Noodles', calories: '450 cal', description: 'Asian-style vegetables with rice noodles' }
  }
};

export default function DietPlanScreen() {
  const [mealPlans, setMealPlans] = useState(initialMealPlans);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshingWeek, setIsRefreshingWeek] = useState(false);
  const currentDay = getCurrentDate();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayPress = (day) => {
    setSelectedDay(day);
    setModalVisible(true);
  };

  // helper to get numeric calories even when the UI or backend returns strings
  const getCaloriesValue = (c) => {
    if (typeof c === 'number') return c;
    if (!c) return 0;
    const s = String(c).replace(/[^\d.-]/g, '');
    const n = parseInt(s, 10);
    return isNaN(n) ? 0 : n;
  };

  // Map backend meal object into UI shape
  const mapBackendMealToUi = (meal) => {
    // backend meal likely: { id, name, description, calories, macros, ingredients_hint }
    if (!meal) return { name: 'Meal', calories: '0 cal', description: '' };
    const name = meal.name || meal.title || 'Meal';
    const calories = (meal.calories !== undefined && meal.calories !== null) ? `${meal.calories} cal` :
                     (meal.calories_text || meal.calories_str || '0 cal');
    const description = meal.description || meal.ingredients_hint || meal.summary || '';
    return { name, calories, description };
  };

  // Call backend to generate a single day
  const generateDayFromServer = async (prompt, day) => {
    try {
      setIsGenerating(true);
      const resp = await fetch(`${SERVER_URL}/diet/generate-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          day,
          meals: ["breakfast","lunch","dinner"],
          // optionally include a user object for better personalization:
          // user: { age: 30, sex: "male", weight_kg: 75, height_cm: 178, activity_level: "moderate", goal: "maintenance" }
        })
      });
      const js = await resp.json();
      if (!js.success) {
        console.warn("Server error:", js);
        Alert.alert("Error", js.error || "Failed to generate day plan");
        return null;
      }
      const dayObj = js.day || js;
      const meals = dayObj.meals || {};
      const mapped = {
        breakfast: mapBackendMealToUi(meals.breakfast),
        lunch: mapBackendMealToUi(meals.lunch),
        dinner: mapBackendMealToUi(meals.dinner)
      };
      return mapped;
    } catch (e) {
      console.error("generateDayFromServer error:", e);
      Alert.alert("Network error", "Could not reach server. Make sure your backend is running and SERVER_URL is correct.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // NEW: Call backend to generate a full weekly plan with the user's prompt
  const generateWeeklyFromServer = async (prompt) => {
    if (!prompt || !prompt.trim()) {
      Alert.alert('Enter a prompt', 'Please enter your meal preferences or dietary restrictions first.');
      return;
    }
    setIsRefreshingWeek(true);
    try {
      const resp = await fetch(`${SERVER_URL}/diet/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          days: 7,
          meals: ["breakfast","lunch","dinner"],
          // optional user profile could be sent here for personalization
        })
      });
      const js = await resp.json();
      if (!js.success) {
        console.warn("Server error:", js);
        Alert.alert("Error", js.error || "Failed to generate weekly plan");
        return;
      }
      const plan = js.plan || js;
      const daysArr = plan.days || [];
      if (!Array.isArray(daysArr) || daysArr.length === 0) {
        Alert.alert("No plan", "Server returned no plan. Try a different prompt or check server logs.");
        return;
      }
      // Map returned days -> mealPlans shape
      const updated = { ...mealPlans }; // start from existing so any missing day keeps previous
      daysArr.forEach(d => {
        const name = d.day || d.name;
        const mealsObj = d.meals || {};
        if (!name) return;
        updated[name] = {
          breakfast: mapBackendMealToUi(mealsObj.breakfast),
          lunch: mapBackendMealToUi(mealsObj.lunch),
          dinner: mapBackendMealToUi(mealsObj.dinner)
        };
      });
      setMealPlans(updated);
      Alert.alert('Success!', 'Weekly meal plan generated from your prompt.');
    } catch (e) {
      console.error("generateWeeklyFromServer error:", e);
      Alert.alert("Network error", "Could not reach server. Make sure SERVER_URL is correct and backend is running.");
    } finally {
      setIsRefreshingWeek(false);
    }
  };

  const handleChangeMeals = async () => {
    if (!userPrompt.trim()) {
      Alert.alert('Please enter your preferences', 'Tell us what kind of meals you\'d like for today.');
      return;
    }

    // call backend for single day
    const newMeals = await generateDayFromServer(userPrompt, selectedDay);
    if (newMeals) {
      setMealPlans(prev => ({
        ...prev,
        [selectedDay]: newMeals
      }));
      setUserPrompt('');
      setModalVisible(false);
      Alert.alert('Success!', 'Your meal plan has been updated with balanced nutrition.');
    } else {
      // keep modal open if failure so user can retry
    }
  };

  // regenerate entire week via backend (keeps old refresh behavior but includes a prompt if present)
  const refreshAllPlans = () => {
    Alert.alert(
      'Refresh All Plans',
      'This will generate new meal plans for the entire week. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Refresh', onPress: async () => {
            // If userPrompt is present use it, otherwise backend fallback will produce deterministic or groq-generated plan
            const promptToUse = (userPrompt && userPrompt.trim()) ? userPrompt.trim() : "";
            setIsRefreshingWeek(true);
            try {
              await generateWeeklyFromServer(promptToUse);
            } finally {
              setIsRefreshingWeek(false);
            }
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <ArrowLeft size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Diet Plan</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshAllPlans}
          accessibilityLabel="Refresh all plans"
          accessibilityRole="button">
          {isRefreshingWeek ? <ActivityIndicator /> : <RefreshCw size={20} color="#6C8BE6" strokeWidth={2} />}
        </TouchableOpacity>
      </View>

      {/* User Prompt Input */}
      <View style={styles.promptSection}>
        <Text style={styles.promptTitle}>Customize Your Meals</Text>
        <Text style={styles.promptSubtitle}>Tell us your preferences, dietary restrictions, or cravings</Text>
        <TextInput
          style={styles.promptInput}
          placeholder="e.g., I want healthy meals with lots of protein..."
          placeholderTextColor="#9CA3AF"
          value={userPrompt}
          onChangeText={setUserPrompt}
          multiline
          numberOfLines={3}
        />

        {/* Generate Plan button */}
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <TouchableOpacity
            style={[styles.generateButton, isRefreshingWeek ? { opacity: 0.6 } : null]}
            onPress={() => generateWeeklyFromServer(userPrompt)}
            disabled={isRefreshingWeek}
            accessibilityLabel="Generate weekly plan"
            accessibilityRole="button"
          >
            {isRefreshingWeek ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Plan</Text>
            )}
          </TouchableOpacity>

          {/* Optional: quick clear prompt button */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setUserPrompt('')}
            accessibilityLabel="Clear prompt"
            accessibilityRole="button"
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Days Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.daysGrid}>
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCard,
                currentDay === day && styles.currentDayCard
              ]}
              onPress={() => handleDayPress(day)}
              accessibilityLabel={`View ${day} meal plan`}
              accessibilityRole="button">

              {currentDay === day && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayText}>TODAY</Text>
                </View>
              )}

              <Text style={[
                styles.dayName,
                currentDay === day && styles.currentDayName
              ]}>
                {day}
              </Text>

              <View style={styles.mealPreview}>
                <View style={styles.mealRow}>
                  <MealIcon type="breakfast" size={24} />
                  <Text style={styles.mealPreviewText} numberOfLines={1}>
                    {mealPlans[day].breakfast.name}
                  </Text>
                </View>
                <View style={styles.mealRow}>
                  <MealIcon type="lunch" size={24} />
                  <Text style={styles.mealPreviewText} numberOfLines={1}>
                    {mealPlans[day].lunch.name}
                  </Text>
                </View>
                <View style={styles.mealRow}>
                  <MealIcon type="dinner" size={24} />
                  <Text style={styles.mealPreviewText} numberOfLines={1}>
                    {mealPlans[day].dinner.name}
                  </Text>
                </View>
              </View>

              <View style={styles.totalCalories}>
                <Text style={styles.caloriesText}>
                  {/* compute total robustly */}
                  Total: {
                    getCaloriesValue(mealPlans[day].breakfast.calories) +
                    getCaloriesValue(mealPlans[day].lunch.calories) +
                    getCaloriesValue(mealPlans[day].dinner.calories)
                  } cal
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Day Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDay} Meals</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}>
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Breakfast */}
              <View style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <MealIcon type="breakfast" size={40} />
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealType}>Breakfast</Text>
                    <Text style={styles.mealName}>
                      {selectedDay && mealPlans[selectedDay]?.breakfast.name}
                    </Text>
                    <Text style={styles.mealCalories}>
                      {selectedDay && mealPlans[selectedDay]?.breakfast.calories}
                    </Text>
                  </View>
                </View>
                <Text style={styles.mealDescription}>
                  {selectedDay && mealPlans[selectedDay]?.breakfast.description}
                </Text>
              </View>

              {/* Lunch */}
              <View style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <MealIcon type="lunch" size={40} />
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealType}>Lunch</Text>
                    <Text style={styles.mealName}>
                      {selectedDay && mealPlans[selectedDay]?.lunch.name}
                    </Text>
                    <Text style={styles.mealCalories}>
                      {selectedDay && mealPlans[selectedDay]?.lunch.calories}
                    </Text>
                  </View>
                </View>
                <Text style={styles.mealDescription}>
                  {selectedDay && mealPlans[selectedDay]?.lunch.description}
                </Text>
              </View>

              {/* Dinner */}
              <View style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <MealIcon type="dinner" size={40} />
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealType}>Dinner</Text>
                    <Text style={styles.mealName}>
                      {selectedDay && mealPlans[selectedDay]?.dinner.name}
                    </Text>
                    <Text style={styles.mealCalories}>
                      {selectedDay && mealPlans[selectedDay]?.dinner.calories}
                    </Text>
                  </View>
                </View>
                <Text style={styles.mealDescription}>
                  {selectedDay && mealPlans[selectedDay]?.dinner.description}
                </Text>
              </View>

              {/* Change Meals Button */}
              <TouchableOpacity
                style={styles.changeMealsButton}
                onPress={handleChangeMeals}
                disabled={isGenerating}
                accessibilityLabel="Change meals for this day"
                accessibilityRole="button">
                {isGenerating ? (
                  <View style={styles.generatingContent}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.changeMealsButtonText}>Generating...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Sparkles size={20} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.changeMealsButtonText}>Change My Meals</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.balanceNote}>
                Note: All three meals will be changed together to maintain nutritional balance
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// All your styles unchanged from original (added small styles for the new Generate/Clear buttons)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  promptSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  promptInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  generateButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 40,
  },
  dayCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  currentDayCard: {
    borderWidth: 2,
    borderColor: '#6C8BE6',
    backgroundColor: '#F8FAFF',
  },
  todayBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#6C8BE6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  currentDayName: {
    color: '#6C8BE6',
  },
  mealPreview: {
    gap: 8,
    marginBottom: 16,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealPreviewText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  totalCalories: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  caloriesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  mealSection: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealInfo: {
    marginLeft: 12,
    flex: 1,
  },
  mealType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C8BE6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  mealDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  changeMealsButton: {
    backgroundColor: '#6C8BE6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#6C8BE6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeMealsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  balanceNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
    paddingHorizontal: 16,
  },
});
