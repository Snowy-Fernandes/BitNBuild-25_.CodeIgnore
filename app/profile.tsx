import React, { useState } from 'react';
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
  User,
  Edit3,
  TrendingUp,
  BarChart3,
  LogOut,
  Settings,
  Heart,
  Clock,
} from 'lucide-react-native';

const profileData = {
  name: 'Sarah Johnson',
  email: 'sarah.j@example.com',
  joinDate: 'March 2024',
  stats: {
    recipesCreated: 24,
    mealsLogged: 156,
    favoriteRecipes: 18,
    avgCookTime: '25 min',
  },
  nutritionGoals: {
    dailyCalories: 2000,
    protein: 120,
    carbs: 250,
    fats: 67,
  },
  recentActivity: [
    { date: 'Today', meal: 'Mediterranean Bowl', calories: 420 },
    { date: 'Yesterday', meal: 'Chicken Stir Fry', calories: 380 },
    { date: '2 days ago', meal: 'Quinoa Salad', calories: 340 },
  ],
};

const CalorieChart = () => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>Weekly Calories</Text>
    <View style={styles.chartBars}>
      {[1800, 2100, 1950, 2200, 1850, 2000, 1900].map((calories, index) => {
        const height = (calories / 2500) * 100;
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return (
          <View key={index} style={styles.chartBar}>
            <View
              style={[
                styles.bar,
                { height: `${height}%`, backgroundColor: '#6C8BE6' },
              ]}
            />
            <Text style={styles.barLabel}>{days[index]}</Text>
          </View>
        );
      })}
    </View>
  </View>
);

const MacroBreakdown = () => (
  <View style={styles.macroContainer}>
    <Text style={styles.macroTitle}>Today's Macros</Text>
    <View style={styles.macroItems}>
      <View style={styles.macroItem}>
        <View style={[styles.macroBar, styles.proteinBar]} />
        <Text style={styles.macroLabel}>Protein</Text>
        <Text style={styles.macroValue}>85g / 120g</Text>
      </View>
      <View style={styles.macroItem}>
        <View style={[styles.macroBar, styles.carbsBar]} />
        <Text style={styles.macroLabel}>Carbs</Text>
        <Text style={styles.macroValue}>180g / 250g</Text>
      </View>
      <View style={styles.macroItem}>
        <View style={[styles.macroBar, styles.fatsBar]} />
        <Text style={styles.macroLabel}>Fats</Text>
        <Text style={styles.macroValue}>45g / 67g</Text>
      </View>
    </View>
  </View>
);

export default function ProfileScreen() {
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // Clear any stored data and navigate to auth
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing will be available soon');
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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Alert.alert('Settings', 'Settings will be available soon')}
          accessibilityLabel="Settings"
          accessibilityRole="button">
          <Settings size={20} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={32} color="#6C8BE6" strokeWidth={2} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData.name}</Text>
              <Text style={styles.profileEmail}>{profileData.email}</Text>
              <Text style={styles.joinDate}>Joined {profileData.joinDate}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
              accessibilityLabel="Edit profile"
              accessibilityRole="button">
              <Edit3 size={16} color="#6C8BE6" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData.stats.recipesCreated}</Text>
            <Text style={styles.statLabel}>Recipes Created</Text>
            <View style={styles.statIcon}>
              <Text style={styles.statEmoji}>👨‍🍳</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData.stats.mealsLogged}</Text>
            <Text style={styles.statLabel}>Meals Logged</Text>
            <View style={styles.statIcon}>
              <Text style={styles.statEmoji}>🍽️</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData.stats.favoriteRecipes}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
            <View style={styles.statIcon}>
              <Heart size={16} color="#FF6B6B" fill="#FF6B6B" strokeWidth={2} />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData.stats.avgCookTime}</Text>
            <Text style={styles.statLabel}>Avg Cook Time</Text>
            <View style={styles.statIcon}>
              <Clock size={16} color="#6C8BE6" strokeWidth={2} />
            </View>
          </View>
        </View>

        <View style={styles.chartsSection}>
          <CalorieChart />
          <MacroBreakdown />
        </View>

        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              accessibilityLabel="View all activity"
              accessibilityRole="button">
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {profileData.recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityInfo}>
                <Text style={styles.activityMeal}>{activity.meal}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
              <Text style={styles.activityCalories}>{activity.calories} cal</Text>
            </View>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/my-recipes')}
            accessibilityLabel="View my recipes"
            accessibilityRole="button">
            <Text style={styles.actionEmoji}>📖</Text>
            <Text style={styles.actionText}>My Recipes</Text>
            <ChevronLeft size={16} color="#6B7280" strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/nutrition-extractor')}
            accessibilityLabel="Track nutrition"
            accessibilityRole="button">
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionText}>Nutrition Tracking</Text>
            <ChevronLeft size={16} color="#6B7280" strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEditProfile}
            accessibilityLabel="Edit preferences"
            accessibilityRole="button">
            <Text style={styles.actionEmoji}>⚙️</Text>
            <Text style={styles.actionText}>Edit Preferences</Text>
            <ChevronLeft size={16} color="#6B7280" strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>

        <View style={styles.signOutSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            accessibilityLabel="Sign out of account"
            accessibilityRole="button">
            <LogOut size={20} color="#FF6B6B" strokeWidth={2} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  settingsButton: {
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    color: '#BFAFF7',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFF3FF',
    position: 'relative',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C8BE6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statEmoji: {
    fontSize: 16,
  },
  chartsSection: {
    marginBottom: 24,
    gap: 16,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  macroContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  macroItems: {
    gap: 12,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  proteinBar: {
    backgroundColor: '#6C8BE6',
  },
  carbsBar: {
    backgroundColor: '#BFAFF7',
  },
  fatsBar: {
    backgroundColor: '#EFF3FF',
  },
  macroLabel: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  macroValue: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EFF3FF',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C8BE6',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF3FF',
  },
  activityInfo: {
    flex: 1,
  },
  activityMeal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8BE6',
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF3FF',
  },
  actionEmoji: {
    fontSize: 20,
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  signOutSection: {
    marginBottom: 40,
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
});