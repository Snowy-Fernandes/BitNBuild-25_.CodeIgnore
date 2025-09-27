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
import { ChevronLeft, User, MessageCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const weeklyPlan = [
  { day: 'Mon', meal: 'Breakfast Bowl', emoji: '🥣' },
  { day: 'Tue', meal: 'Pasta Delight', emoji: '🍝' },
  { day: 'Wed', meal: 'Grilled Fish', emoji: '🐟' },
  { day: 'Thu', meal: 'Curry Night', emoji: '🍛' },
  { day: 'Fri', meal: 'Pizza Party', emoji: '🍕' },
  { day: 'Sat', meal: 'Stir Fry', emoji: '🥢' },
  { day: 'Sun', meal: 'Brunch Special', emoji: '🥞' },
];

const ChatbotFloat = () => (
  <TouchableOpacity
    style={styles.chatbotFloat}
    onPress={() => router.push('/chatbot')}
    accessibilityLabel="Open chatbot"
    accessibilityRole="button">
    <MessageCircle size={24} color="#FFFFFF" strokeWidth={2} />
  </TouchableOpacity>
);

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Back"
          accessibilityRole="button">
          <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
          accessibilityLabel="Open profile"
          accessibilityRole="button">
          <User size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Good morning! ☀️</Text>
        <Text style={styles.subtitle}>What would you like to cook today?</Text>

        <View style={styles.heroCards}>
          <TouchableOpacity
            style={[styles.heroCard, styles.fridgeCard]}
            onPress={() => router.push('/fridge')}
            accessibilityLabel="Check what's in my fridge"
            accessibilityRole="button">
            <View style={styles.heroCardIcon}>
              <Text style={styles.heroCardEmoji}>🧊</Text>
            </View>
            <Text style={styles.heroCardTitle}>What's in My Fridge</Text>
            <Text style={styles.heroCardSubtitle}>Scan & cook with what you have</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroCard, styles.generateCard]}
            onPress={() => router.push('/custom-recipe')}
            accessibilityLabel="Generate custom recipe"
            accessibilityRole="button">
            <View style={styles.heroCardIcon}>
              <Text style={styles.heroCardEmoji}>✨</Text>
            </View>
            <Text style={styles.heroCardTitle}>Generate Recipe</Text>
            <Text style={styles.heroCardSubtitle}>Create with voice or text</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weeklySection}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyTitle}>Weekly Plan</Text>
            <TouchableOpacity
              style={styles.editButton}
              accessibilityLabel="Edit weekly plan"
              accessibilityRole="button">
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weeklyScroll}>
            {weeklyPlan.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.weeklyCard}
                accessibilityLabel={`${item.day} ${item.meal}`}
                accessibilityRole="button">
                <Text style={styles.weeklyEmoji}>{item.emoji}</Text>
                <Text style={styles.weeklyDay}>{item.day}</Text>
                <Text style={styles.weeklyMeal}>{item.meal}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.deliveryBanner}>
          <View style={styles.deliveryContent}>
            <Text style={styles.deliveryTitle}>Missing ingredients?</Text>
            <Text style={styles.deliverySubtitle}>Order fresh groceries in minutes</Text>
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
  profileButton: {
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
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  heroCards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  heroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  fridgeCard: {
    backgroundColor: '#EFF3FF',
  },
  generateCard: {
    backgroundColor: '#F3F0FF',
  },
  heroCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroCardEmoji: {
    fontSize: 28,
  },
  heroCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  weeklySection: {
    marginBottom: 32,
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weeklyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EFF3FF',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C8BE6',
  },
  weeklyScroll: {
    paddingRight: 24,
  },
  weeklyCard: {
    width: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  weeklyEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  weeklyDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C8BE6',
    marginBottom: 4,
  },
  weeklyMeal: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  deliveryBanner: {
    backgroundColor: '#BFAFF7',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
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
    fontSize: 12,
    color: '#6B7280',
  },
  deliveryLogos: {
    flexDirection: 'row',
    gap: 8,
  },
  logoButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C8BE6',
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