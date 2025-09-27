import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, X } from 'lucide-react-native';

const allergies = ['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Fish'];

export default function OnboardingScreen() {
  const [numPeople, setNumPeople] = useState('2');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [medications, setMedications] = useState('');
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);

  const toggleAllergy = (allergy: string) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter(item => item !== allergy));
    } else {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };

  const handleNext = () => {
    if (!height.trim() || !weight.trim()) {
      Alert.alert('Please Complete', 'Please fill in your height and weight');
      return;
    }
    router.push('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Back to authentication"
          accessibilityRole="button">
          <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={styles.progressBar} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={styles.progressBar} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          Help us personalize your culinary journey
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>How many people are you cooking for?</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowPeoplePicker(!showPeoplePicker)}
            accessibilityLabel="Select number of people"
            accessibilityRole="button">
            <Text style={styles.pickerText}>{numPeople} people</Text>
            <ChevronDown size={20} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
          {showPeoplePicker && (
            <View style={styles.pickerOptions}>
              {['1', '2', '3', '4', '5', '6+'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.pickerOption}
                  onPress={() => {
                    setNumPeople(num);
                    setShowPeoplePicker(false);
                  }}
                  accessibilityLabel={`${num} people`}
                  accessibilityRole="button">
                  <Text style={styles.pickerOptionText}>{num} people</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Any allergies or dietary restrictions?</Text>
          <View style={styles.chipContainer}>
            {allergies.map((allergy) => (
              <TouchableOpacity
                key={allergy}
                style={[
                  styles.chip,
                  selectedAllergies.includes(allergy) && styles.chipActive,
                ]}
                onPress={() => toggleAllergy(allergy)}
                accessibilityLabel={`${allergy} allergy ${
                  selectedAllergies.includes(allergy) ? 'selected' : 'not selected'
                }`}
                accessibilityRole="button">
                <Text
                  style={[
                    styles.chipText,
                    selectedAllergies.includes(allergy) && styles.chipTextActive,
                  ]}>
                  {allergy}
                </Text>
                {selectedAllergies.includes(allergy) && (
                  <X size={16} color="#FFFFFF" strokeWidth={2} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Physical details (for nutrition)</Text>
          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="170"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                accessibilityLabel="Height input"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="65"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                accessibilityLabel="Weight input"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Current medications (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={medications}
            onChangeText={setMedications}
            placeholder="List any medications that might affect your diet..."
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={3}
            accessibilityLabel="Medications input"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          accessibilityLabel="Continue to home"
          accessibilityRole="button">
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
  progress: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 16,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#EFF3FF',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#6C8BE6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
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
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFF3FF',
    minHeight: 56,
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  pickerOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EFF3FF',
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF3FF',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#EFF3FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
  },
  chipActive: {
    backgroundColor: '#6C8BE6',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#EFF3FF',
    minHeight: 56,
  },
  textArea: {
    height: 96,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  nextButton: {
    backgroundColor: '#6C8BE6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});