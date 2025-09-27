import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
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
  Users,
  AlertTriangle,
  Ruler,
  Weight,
  Pill,
} from 'lucide-react-native';
import { supabase } from '../backend/lib/supabase';
import { useAuth } from './AuthProvider';
import { Platform } from "react-native";
interface UserProfile {
  num_people: number;
  allergies: string[];
  height: number | null;
  weight: number | null;
  medications: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, create a default one
          setProfile({
            num_people: 2,
            allergies: [],
            height: null,
            weight: null,
            medications: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);



const handleSignOut = () => {
  console.log("Sign out button pressed");

  if (Platform.OS === "web") {
    // Web: just sign out directly
    signOut()
      .then(() => {
        console.log("Supabase signOut completed (web), navigating to /auth");
        router.replace("/auth");
      })
      .catch((err) => console.error("Error during sign out:", err));
    return;
  }

  // Mobile: use native Alert
  Alert.alert(
    "Sign Out",
    "Are you sure you want to sign out of your account?",
    [
      { text: "Cancel", style: "cancel", onPress: () => console.log("Sign out canceled") },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          console.log("Sign out confirmed, calling signOut()");
          try {
            await signOut();
            console.log("Supabase signOut completed, navigating to /auth");
            router.replace("/auth");
          } catch (err) {
            console.error("Error during sign out:", err);
          }
        },
      },
    ]
  );
};



  const handleEditProfile = () => {
    router.push('/onboarding');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C8BE6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleEditProfile}
          accessibilityLabel="Edit profile"
          accessibilityRole="button">
          <Edit3 size={20} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={32} color="#6C8BE6" strokeWidth={2} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.email?.split('@')[0] || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.joinDate}>
                Joined {profile ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                }) : 'Recently'}
              </Text>
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

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Users size={20} color="#6C8BE6" strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Cooking For</Text>
                <Text style={styles.infoValue}>
                  {profile?.num_people || 2} {profile?.num_people === 1 ? 'person' : 'people'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ruler size={20} color="#6C8BE6" strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>
                  {profile?.height ? `${profile.height} cm` : 'Not set'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Weight size={20} color="#6C8BE6" strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>
                  {profile?.weight ? `${profile.weight} kg` : 'Not set'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Allergies Section */}
        {profile?.allergies && profile.allergies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
            </View>
            <View style={styles.chipContainer}>
              {profile.allergies.map((allergy, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{allergy}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Medications Section */}
        {profile?.medications && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Pill size={20} color="#6C8BE6" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Medications</Text>
            </View>
            <Text style={styles.medicationsText}>{profile.medications}</Text>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Recipes Created</Text>
            <View style={styles.statIcon}>
              <Text style={styles.statEmoji}>👨‍🍳</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Meals Logged</Text>
            <View style={styles.statIcon}>
              <Text style={styles.statEmoji}>🍽️</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Favorites</Text>
            <View style={styles.statIcon}>
              <Heart size={16} color="#FF6B6B" fill="#FF6B6B" strokeWidth={2} />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>25 min</Text>
            <Text style={styles.statLabel}>Avg Cook Time</Text>
            <View style={styles.statIcon}>
              <Clock size={16} color="#6C8BE6" strokeWidth={2} />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEditProfile}
            accessibilityLabel="Edit preferences"
            accessibilityRole="button">
            <Text style={styles.actionEmoji}>⚙️</Text>
            <Text style={styles.actionText}>Edit Preferences</Text>
            <ChevronLeft size={16} color="#6B7280" strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

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
        </View>

        {/* Sign Out Section */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
    textTransform: 'capitalize',
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#EFF3FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C8BE6',
  },
  medicationsText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
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