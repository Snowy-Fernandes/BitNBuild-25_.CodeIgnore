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
import { User, MessageCircle, ChevronRight, Users } from 'lucide-react-native';
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

const CommunityIcon = ({ size = 24, color = "#EF4444" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    <Path d="M3 21V19C3 16.7909 4.79086 15 7 15H11C13.2091 15 15 16.7909 15 19V21" stroke={color} strokeWidth="2" />
    <Circle cx="16" cy="11" r="3" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    <Path d="M20 21V20C20 18.3431 18.6569 17 17 17H16.5" stroke={color} strokeWidth="2" />
  </Svg>
);

const CalendarIcon = ({ size = 24, color = "#10B981" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="8" cy="14" r="1" fill={color} />
    <Circle cx="12" cy="14" r="1" fill={color} />
    <Circle cx="16" cy="14" r="1" fill={color} />
    <Circle cx="8" cy="18" r="1" fill={color} />
    <Circle cx="12" cy="18" r="1" fill={color} />
  </Svg>
);

const SunIcon = ({ size = 20, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="4" fill={color} />
    <Path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const DietitianIcon = ({ size = 24, color = "#06B6D4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    <Path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke={color} strokeWidth="2" />
    <Path d="M16 3.13A4 4 0 0 1 16 11.87" stroke={color} strokeWidth="2" />
    <Path d="M8 3.13A4 4 0 0 0 8 11.87" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="1" fill={color} />
  </Svg>
);

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

        {/* Weekly Diet Plan Button */}
        <TouchableOpacity
          style={styles.weeklyPlanButton}
          onPress={() => router.push('/diet-plan')}
          accessibilityLabel="View weekly diet plan"
          accessibilityRole="button">
          <View style={styles.weeklyPlanContent}>
            <View style={styles.weeklyPlanIcon}>
              <CalendarIcon size={32} color="#10B981" />
            </View>
            <View style={styles.weeklyPlanInfo}>
              <Text style={styles.weeklyPlanTitle}>Weekly Diet Plan</Text>
              <Text style={styles.weeklyPlanSubtitle}>Personalized meal plans for every day</Text>
            </View>
            <ChevronRight size={24} color="#6B7280" strokeWidth={2} />
          </View>
        </TouchableOpacity>

        {/* Dietitians Banner */}
        <TouchableOpacity
          style={styles.dietitiansBanner}
          onPress={() => router.push('/dietitian')}
          accessibilityLabel="Visit our dietitians"
          accessibilityRole="button">
          <View style={styles.dietitiansContent}>
            <View style={styles.dietitiansIcon}>
              <DietitianIcon size={28} color="#06B6D4" />
            </View>
            <View style={styles.dietitiansInfo}>
              <Text style={styles.dietitiansTitle}>Need guidance</Text>
              <Text style={styles.dietitiansSubtitle}>Consult with dietitians near you</Text>
            </View>
            <View style={styles.dietitiansAction}>
              <View style={styles.visitButton}>
                <Text style={styles.visitButtonText}>Visit</Text>
                <ChevronRight size={16} color="#06B6D4" strokeWidth={2} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <ChatbotFloat />
    </SafeAreaView>
  );
}

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
  communityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
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
  weeklyPlanButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  weeklyPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyPlanIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  weeklyPlanInfo: {
    flex: 1,
  },
  weeklyPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  weeklyPlanSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Dietitians Banner Styles
  dietitiansBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    borderLeftWidth: 4,
    borderLeftColor: '#06B6D4',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dietitiansContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dietitiansIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dietitiansInfo: {
    flex: 1,
  },
  dietitiansTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  dietitiansSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  dietitiansAction: {
    alignItems: 'flex-end',
  },
  visitButton: {
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  visitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06B6D4',
    marginRight: 4,
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