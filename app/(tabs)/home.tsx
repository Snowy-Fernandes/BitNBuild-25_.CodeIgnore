import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { User, MessageCircle, RefreshCw, Sparkles } from 'lucide-react-native';
import Svg, { Path, Circle, Rect, G, Polygon } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Custom SVG Icons
const FridgeIcon = ({ size = 24, color = "#6C8BE6" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="20" rx="2" fill={color} fillOpacity="0.1" />
    <Path
      d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
      stroke={color}
      strokeWidth="2"
    />
    <Path d="M4 10H20" stroke={color} strokeWidth="2" />
    <Path d="M7 6V8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M7 13V15" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const RecipeIcon = ({ size = 24, color = "#8B5CF6" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.1" />
    <Path
      d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
      fill={color}
      stroke={color}
      strokeWidth="1"
    />
  </Svg>
);

const MealIcon = ({ type, size = 32 }) => {
  const getColor = () => {
    switch (type) {
      case 'breakfast': return '#F59E0B';
      case 'lunch': return '#10B981';
      case 'dinner': return '#8B5CF6';
      case 'snack': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const color = getColor();

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx="16" cy="16" r="14" fill={color} fillOpacity="0.1" />
      <Circle cx="16" cy="16" r="8" fill={color} fillOpacity="0.2" />
      <Circle cx="16" cy="16" r="4" fill={color} />
    </Svg>
  );
};

const SunIcon = ({ size = 20, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="4" fill={color} />
    <Path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const DeliveryIcon = ({ size = 24, color = "#6B7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 18C14 19.1046 13.1046 20 12 20C10.8954 20 10 19.1046 10 18C10 16.8954 10.8954 16 12 16C13.1046 16 14 16.8954 14 18Z"
      fill={color}
    />
    <Path
      d="M22 18C22 19.1046 21.1046 20 20 20C18.8954 20 18 19.1046 18 18C18 16.8954 18.8954 16 20 16C21.1046 16 22 16.8954 22 18Z"
      fill={color}
    />
    <Path
      d="M1 1H3L3.4 3M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16 5.1 16H17M17 13V16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const weeklyPlan = [
  { day: 'Monday', meal: 'Mediterranean Breakfast Bowl', type: 'breakfast', calories: '420 cal' },
  { day: 'Tuesday', meal: 'Quinoa Power Salad', type: 'lunch', calories: '380 cal' },
  { day: 'Wednesday', meal: 'Grilled Salmon & Vegetables', type: 'dinner', calories: '520 cal' },
  { day: 'Thursday', meal: 'Green Smoothie Bowl', type: 'breakfast', calories: '350 cal' },
  { day: 'Friday', meal: 'Chicken Teriyaki Rice', type: 'dinner', calories: '480 cal' },
  { day: 'Saturday', meal: 'Avocado Toast Deluxe', type: 'breakfast', calories: '390 cal' },
  { day: 'Sunday', meal: 'Veggie Stir-Fry Noodles', type: 'dinner', calories: '450 cal' },
];

const ChatbotFloat = () => (
  <TouchableOpacity
    style={styles.chatbotFloat}
    onPress={() => router.push('/chatbot')}
    accessibilityLabel="Open AI cooking assistant"
    accessibilityRole="button">
    <MessageCircle size={24} color="#FFFFFF" strokeWidth={2} />
  </TouchableOpacity>
);

export default function HomeScreen() {
  const handleRefreshPlan = () => {
    // Add refresh logic here
    console.log('Refreshing weekly plan...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.greetingContainer}>
            <SunIcon size={24} />
            <Text style={styles.greeting}>Good morning</Text>
          </View>
          <Text style={styles.subtitle}>What would you like to cook today?</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
          accessibilityLabel="Open profile"
          accessibilityRole="button">
          <User size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCards}>
          <TouchableOpacity
            style={[styles.heroCard, styles.fridgeCard]}
            onPress={() => router.push('/fridge')}
            accessibilityLabel="Check what's in my fridge"
            accessibilityRole="button">
            <View style={styles.heroCardIcon}>
              <FridgeIcon size={32} color="#6C8BE6" />
            </View>
            <Text style={styles.heroCardTitle}>Smart Fridge Scan</Text>
            <Text style={styles.heroCardSubtitle}>Discover recipes with your ingredients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroCard, styles.generateCard]}
            onPress={() => router.push('/custom-recipe')}
            accessibilityLabel="Generate custom recipe"
            accessibilityRole="button">
            <View style={styles.heroCardIcon}>
              <RecipeIcon size={32} color="#8B5CF6" />
            </View>
            <Text style={styles.heroCardTitle}>AI Recipe Generator</Text>
            <Text style={styles.heroCardSubtitle}>Create personalized recipes instantly</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weeklySection}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyTitle}>Weekly Meal Plan</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefreshPlan}
              accessibilityLabel="Refresh weekly plan"
              accessibilityRole="button">
              <RefreshCw size={18} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.refreshButtonText}>Enhance</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weeklyList}>
            {weeklyPlan.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.weeklyCard}
                accessibilityLabel={`${item.day} ${item.meal}`}
                accessibilityRole="button">
                <View style={styles.weeklyCardLeft}>
                  <MealIcon type={item.type} size={48} />
                  <View style={styles.weeklyCardInfo}>
                    <Text style={styles.weeklyDay}>{item.day}</Text>
                    <Text style={styles.weeklyMeal}>{item.meal}</Text>
                    <Text style={styles.weeklyCalories}>{item.calories}</Text>
                  </View>
                </View>
                <View style={styles.weeklyCardRight}>
                  <View style={[styles.mealTypeBadge, { backgroundColor: getMealTypeColor(item.type) }]}>
                    <Text style={styles.mealTypeText}>{item.type}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.deliveryBanner}>
          <View style={styles.deliveryIcon}>
            <DeliveryIcon size={28} color="#6B7280" />
          </View>
          <View style={styles.deliveryContent}>
            <Text style={styles.deliveryTitle}>Missing ingredients?</Text>
            <Text style={styles.deliverySubtitle}>Order fresh groceries delivered in minutes</Text>
          </View>
          <View style={styles.deliveryLogos}>
            <TouchableOpacity
              style={styles.logoButton}
              accessibilityLabel="Order from Zepto"
              accessibilityRole="button">
              <Text style={styles.logoText}>Zepto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoButton}
              accessibilityLabel="Order from Blinkit"
              accessibilityRole="button">
              <Text style={styles.logoText}>Blinkit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ChatbotFloat />
    </SafeAreaView>
  );
}

const getMealTypeColor = (type) => {
  switch (type) {
    case 'breakfast': return '#FEF3C7';
    case 'lunch': return '#D1FAE5';
    case 'dinner': return '#EDE9FE';
    case 'snack': return '#FEE2E2';
    default: return '#F3F4F6';
  }
};

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
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  heroCards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  heroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fridgeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6C8BE6',
  },
  generateCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  heroCardIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  weeklySection: {
    marginBottom: 32,
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weeklyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
    marginLeft: 6,
  },
  weeklyList: {
    gap: 12,
  },
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  weeklyCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyCardInfo: {
    marginLeft: 16,
    flex: 1,
  },
  weeklyDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C8BE6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  weeklyMeal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  weeklyCalories: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  weeklyCardRight: {
    alignItems: 'flex-end',
  },
  mealTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  deliveryBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  deliveryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  deliveryContent: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  deliverySubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  deliveryLogos: {
    flexDirection: 'column',
    gap: 8,
  },
  logoButton: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  chatbotFloat: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C8BE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C8BE6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
});