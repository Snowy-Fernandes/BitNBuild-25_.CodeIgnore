import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  Image,
  Platform,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import {
  ChevronLeft,
  MapPin,
  Star,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  Filter,
  Search,
  Award,
  Heart,
  MessageCircle,
  ChevronRight,
  X,
  CheckCircle,
} from 'lucide-react-native';

// Mock data for dietitians
const dietitians = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    rating: 4.8,
    reviews: 127,
    specialty: 'Weight Management',
    experience: '8 years',
    email: 'sarah.johnson@healthcare.com',
    phone: '+1 (555) 123-4567',
    address: '123 Health Street, Medical District',
    position: { x: 150, y: 200 },
    category: 'Senior Dietitian',
    bio: 'Specialized in weight management and metabolic health with focus on sustainable lifestyle changes.',
    qualifications: ['MS in Nutrition', 'Certified Diabetes Educator', 'Sports Nutrition Specialist'],
    consultationFee: '$80',
    languages: ['English', 'Spanish'],
    availableSlots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
    testimonials: [
      {
        id: '1',
        name: 'Emily R.',
        rating: 5,
        comment: 'Dr. Johnson helped me lose 30 pounds safely. Her approach is realistic and sustainable.',
        date: '2 weeks ago'
      },
      {
        id: '2',
        name: 'Michael K.',
        rating: 5,
        comment: 'Excellent nutritionist! Very knowledgeable and patient with all my questions.',
        date: '1 month ago'
      },
    ]
  },
  {
    id: '2',
    name: 'Dr. Priya Patel',
    rating: 4.9,
    reviews: 89,
    specialty: 'Clinical Nutrition',
    experience: '12 years',
    email: 'priya.patel@wellness.com',
    phone: '+1 (555) 987-6543',
    address: '456 Wellness Avenue, Health Plaza',
    position: { x: 250, y: 150 },
    category: 'Clinical Specialist',
    bio: 'Expert in clinical nutrition therapy for diabetes, heart disease, and digestive disorders.',
    qualifications: ['PhD in Nutrition Science', 'Registered Dietitian', 'Clinical Nutrition Specialist'],
    consultationFee: '$95',
    languages: ['English', 'Hindi', 'Gujarati'],
    availableSlots: ['10:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'],
    testimonials: [
      {
        id: '1',
        name: 'David L.',
        rating: 5,
        comment: 'Dr. Patel completely changed my relationship with food. Highly recommended!',
        date: '1 week ago'
      },
    ]
  },
  {
    id: '3',
    name: 'Dr. James Wilson',
    rating: 4.7,
    reviews: 156,
    specialty: 'Sports Nutrition',
    experience: '6 years',
    email: 'james.wilson@sportsfuel.com',
    phone: '+1 (555) 456-7890',
    address: '789 Fitness Road, Sports Complex',
    position: { x: 320, y: 280 },
    category: 'Sports Nutritionist',
    bio: 'Performance nutrition specialist working with athletes and fitness enthusiasts.',
    qualifications: ['MS Sports Nutrition', 'Certified Sports Nutritionist', 'Exercise Physiologist'],
    consultationFee: '$75',
    languages: ['English'],
    availableSlots: ['8:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'],
    testimonials: [
      {
        id: '1',
        name: 'Lisa M.',
        rating: 5,
        comment: 'Perfect for athletes! Helped optimize my performance and recovery nutrition.',
        date: '3 days ago'
      },
    ]
  },
  {
    id: '4',
    name: 'Dr. Maria Garcia',
    rating: 4.6,
    reviews: 203,
    specialty: 'Pediatric Nutrition',
    experience: '10 years',
    email: 'maria.garcia@kidhealth.com',
    phone: '+1 (555) 321-9876',
    address: '321 Childrens Lane, Family Health Center',
    position: { x: 180, y: 350 },
    category: 'Pediatric Specialist',
    bio: 'Specialized in child and adolescent nutrition, including eating disorders and growth issues.',
    qualifications: ['MS Pediatric Nutrition', 'Certified Pediatric Nutritionist', 'Family Therapy Certified'],
    consultationFee: '$85',
    languages: ['English', 'Spanish', 'Portuguese'],
    availableSlots: ['9:30 AM', '11:30 AM', '2:30 PM', '4:30 PM'],
    testimonials: [
      {
        id: '1',
        name: 'Jennifer S.',
        rating: 5,
        comment: 'Amazing with kids! My daughter actually enjoys eating healthy now.',
        date: '5 days ago'
      },
    ]
  },
  {
    id: '5',
    name: 'Dr. Robert Chen',
    rating: 4.5,
    reviews: 174,
    specialty: 'Geriatric Nutrition',
    experience: '15 years',
    email: 'robert.chen@seniorcare.com',
    phone: '+1 (555) 654-3210',
    address: '654 Senior Street, Elder Care Plaza',
    position: { x: 280, y: 120 },
    category: 'Geriatric Specialist',
    bio: 'Expert in nutrition for older adults, focusing on healthy aging and chronic disease management.',
    qualifications: ['PhD Geriatric Nutrition', 'Gerontology Certified', 'Chronic Disease Specialist'],
    consultationFee: '$90',
    languages: ['English', 'Mandarin'],
    availableSlots: ['10:00 AM', '1:00 PM', '3:00 PM'],
    testimonials: [
      {
        id: '1',
        name: 'Margaret W.',
        rating: 4,
        comment: 'Very patient and understanding. Great knowledge about senior nutrition needs.',
        date: '1 week ago'
      },
    ]
  }
];

interface Dietitian {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  specialty: string;
  experience: string;
  email: string;
  phone: string;
  address: string;
  position: { x: number; y: number };
  category: string;
  bio: string;
  qualifications: string[];
  consultationFee: string;
  languages: string[];
  availableSlots: string[];
  testimonials: Array<{
    id: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

interface AppointmentData {
  patientName: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  medicalConditions: string;
  dietaryGoals: string;
  preferredDate: string;
  preferredTime: string;
  additionalNotes: string;
}

export default function DietitiansScreen() {
  const [selectedDietitian, setSelectedDietitian] = useState<Dietitian | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    patientName: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    medicalConditions: '',
    dietaryGoals: '',
    preferredDate: '',
    preferredTime: '',
    additionalNotes: '',
  });

  const categories = ['All', 'Senior Dietitian', 'Clinical Specialist', 'Sports Nutritionist', 'Pediatric Specialist', 'Geriatric Specialist'];

  // Filter dietitians based on search and category
  const filteredDietitians = dietitians.filter(dietitian => {
    const matchesSearch = dietitian.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dietitian.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || dietitian.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Generate calendar dates (next 30 days)
  const generateCalendarDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        month: date.toLocaleDateString('en', { month: 'short' }),
        weekday: date.toLocaleDateString('en', { weekday: 'short' }),
      });
    }
    return dates;
  };

  const calendarDates = generateCalendarDates();

  const handlePinPress = (dietitian: Dietitian) => {
    setSelectedDietitian(dietitian);
    setShowProfile(true);
  };

  const handleBookAppointment = () => {
    setShowProfile(false);
    setShowBooking(true);
    setAppointmentData(prev => ({
      ...prev,
      preferredDate: '',
      preferredTime: '',
    }));
  };

  const handleSubmitBooking = () => {
    if (!appointmentData.patientName || !appointmentData.email || !appointmentData.phone || 
        !selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Simulate booking submission
    setShowBooking(false);
    setShowSuccess(true);
    
    // Reset form
    setAppointmentData({
      patientName: '',
      email: '',
      phone: '',
      age: '',
      gender: '',
      medicalConditions: '',
      dietaryGoals: '',
      preferredDate: '',
      preferredTime: '',
      additionalNotes: '',
    });
    setSelectedDate('');
    setSelectedTime('');
  };

  const renderMapPin = (dietitian: Dietitian) => (
    <TouchableOpacity
      key={dietitian.id}
      style={[
        styles.mapPin,
        { left: dietitian.position.x, top: dietitian.position.y }
      ]}
      onPress={() => handlePinPress(dietitian)}
    >
      <View style={styles.pinContainer}>
        <MapPin size={24} color="#FFFFFF" strokeWidth={2} />
      </View>
      <View style={styles.ratingBadge}>
        <Text style={styles.ratingText}>{dietitian.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showProfile}
      onRequestClose={() => setShowProfile(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.profileModal}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <User size={32} color="#6C8BE6" strokeWidth={2} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.profileName}>{selectedDietitian?.name}</Text>
                <Text style={styles.profileCategory}>{selectedDietitian?.category}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProfile(false)}
            >
              <X size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
            {/* Rating and Reviews */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingContainer}>
                <Star size={20} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
                <Text style={styles.ratingValue}>{selectedDietitian?.rating}</Text>
                <Text style={styles.reviewCount}>({selectedDietitian?.reviews} reviews)</Text>
              </View>
              <Text style={styles.experience}>{selectedDietitian?.experience} experience</Text>
            </View>

            {/* Speciality */}
            <View style={styles.specialtySection}>
              <Award size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.specialtyText}>{selectedDietitian?.specialty}</Text>
            </View>

            {/* Bio */}
            <Text style={styles.bioText}>{selectedDietitian?.bio}</Text>

            {/* Qualifications */}
            <View style={styles.qualificationsSection}>
              <Text style={styles.sectionTitle}>Qualifications</Text>
              {selectedDietitian?.qualifications.map((qual, index) => (
                <View key={index} style={styles.qualificationItem}>
                  <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                  <Text style={styles.qualificationText}>{qual}</Text>
                </View>
              ))}
            </View>

            {/* Contact Information */}
            <View style={styles.contactSection}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <View style={styles.contactItem}>
                <Mail size={18} color="#6C8BE6" strokeWidth={2} />
                <Text style={styles.contactText}>{selectedDietitian?.email}</Text>
              </View>
              
              <View style={styles.contactItem}>
                <Phone size={18} color="#6C8BE6" strokeWidth={2} />
                <Text style={styles.contactText}>{selectedDietitian?.phone}</Text>
              </View>
              
              <View style={styles.contactItem}>
                <MapPin size={18} color="#6C8BE6" strokeWidth={2} />
                <Text style={styles.contactText}>{selectedDietitian?.address}</Text>
              </View>
            </View>

            {/* Consultation Fee */}
            <View style={styles.feeSection}>
              <Text style={styles.sectionTitle}>Consultation Fee</Text>
              <Text style={styles.feeAmount}>{selectedDietitian?.consultationFee}</Text>
            </View>

            {/* Languages */}
            <View style={styles.languagesSection}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.languagesList}>
                {selectedDietitian?.languages.map((lang, index) => (
                  <View key={index} style={styles.languageTag}>
                    <Text style={styles.languageText}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Reviews */}
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Patient Reviews</Text>
              {selectedDietitian?.testimonials.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>{review.name}</Text>
                      <View style={styles.reviewRating}>
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={14} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.profileActions}>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBookAppointment}
            >
              <Calendar size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBookingModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showBooking}
      onRequestClose={() => setShowBooking(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.bookingModal}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingTitle}>Book Appointment</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBooking(false)}
            >
              <X size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bookingContent} showsVerticalScrollIndicator={false}>
            {/* Selected Dietitian Info */}
            <View style={styles.selectedDietitianInfo}>
              <Text style={styles.selectedDietitianName}>{selectedDietitian?.name}</Text>
              <Text style={styles.selectedDietitianCategory}>{selectedDietitian?.category}</Text>
              <Text style={styles.consultationFeeText}>Consultation Fee: {selectedDietitian?.consultationFee}</Text>
            </View>

            {/* Personal Information */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Personal Information</Text>
              
              <TextInput
                style={styles.formInput}
                placeholder="Full Name *"
                value={appointmentData.patientName}
                onChangeText={(text) => setAppointmentData(prev => ({ ...prev, patientName: text }))}
                placeholderTextColor="#9CA3AF"
              />
              
              <TextInput
                style={styles.formInput}
                placeholder="Email Address *"
                value={appointmentData.email}
                onChangeText={(text) => setAppointmentData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                placeholderTextColor="#9CA3AF"
              />
              
              <TextInput
                style={styles.formInput}
                placeholder="Phone Number *"
                value={appointmentData.phone}
                onChangeText={(text) => setAppointmentData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
              
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.formInput, styles.formInputHalf]}
                  placeholder="Age"
                  value={appointmentData.age}
                  onChangeText={(text) => setAppointmentData(prev => ({ ...prev, age: text }))}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                
                <TextInput
                  style={[styles.formInput, styles.formInputHalf]}
                  placeholder="Gender"
                  value={appointmentData.gender}
                  onChangeText={(text) => setAppointmentData(prev => ({ ...prev, gender: text }))}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Health Information */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Health Information</Text>
              
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Medical Conditions (if any)"
                value={appointmentData.medicalConditions}
                onChangeText={(text) => setAppointmentData(prev => ({ ...prev, medicalConditions: text }))}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
              
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Dietary Goals & Concerns"
                value={appointmentData.dietaryGoals}
                onChangeText={(text) => setAppointmentData(prev => ({ ...prev, dietaryGoals: text }))}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Date Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Select Date *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                {calendarDates.slice(0, 14).map((dateObj) => (
                  <TouchableOpacity
                    key={dateObj.date}
                    style={[
                      styles.dateButton,
                      selectedDate === dateObj.date && styles.selectedDate
                    ]}
                    onPress={() => setSelectedDate(dateObj.date)}
                  >
                    <Text style={[
                      styles.dateWeekday,
                      selectedDate === dateObj.date && styles.selectedDateText
                    ]}>{dateObj.weekday}</Text>
                    <Text style={[
                      styles.dateDay,
                      selectedDate === dateObj.date && styles.selectedDateText
                    ]}>{dateObj.day}</Text>
                    <Text style={[
                      styles.dateMonth,
                      selectedDate === dateObj.date && styles.selectedDateText
                    ]}>{dateObj.month}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Select Time *</Text>
              <View style={styles.timeGrid}>
                {selectedDietitian?.availableSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeButton,
                      selectedTime === time && styles.selectedTime
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      selectedTime === time && styles.selectedTimeText
                    ]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Additional Notes */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Additional Notes</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Any additional information or special requests..."
                value={appointmentData.additionalNotes}
                onChangeText={(text) => setAppointmentData(prev => ({ ...prev, additionalNotes: text }))}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          <View style={styles.bookingActions}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitBooking}
            >
              <Calendar size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.submitButtonText}>Confirm Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSuccessModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSuccess}
      onRequestClose={() => setShowSuccess(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModal}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color="#10B981" strokeWidth={2} />
          </View>
          <Text style={styles.successTitle}>Appointment Booked!</Text>
          <Text style={styles.successMessage}>
            Your appointment with {selectedDietitian?.name} has been successfully booked.
          </Text>
          <Text style={styles.successDetails}>
            Date: {selectedDate && new Date(selectedDate).toLocaleDateString('en', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <Text style={styles.successDetails}>
            Time: {selectedTime}
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => setShowSuccess(false)}
          >
            <Text style={styles.successButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Back to home"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Dietitians</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dietitians or specialties..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                filterCategory === category && styles.activeFilterButton
              ]}
              onPress={() => setFilterCategory(category)}
            >
              <Text style={[
                styles.filterButtonText,
                filterCategory === category && styles.activeFilterButtonText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <Image
          source={{ uri: 'https://img.freepik.com/premium-vector/city-map-town-streets-with-park-river-downtown-gps-navigation-plan-abstract-transportation-urban_163786-697.jpg' }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        
        {/* Render pins for filtered dietitians */}
        {filteredDietitians.map(dietitian => renderMapPin(dietitian))}
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <View style={styles.infoRow}>
          <MapPin size={16} color="#6C8BE6" strokeWidth={2} />
          <Text style={styles.infoText}>{filteredDietitians.length} dietitians found near you</Text>
        </View>
        <Text style={styles.infoSubtext}>Tap on a pin to view dietitian profile and book appointment</Text>
      </View>

      {/* Modals */}
      {renderProfileModal()}
      {renderBookingModal()}
      {renderSuccessModal()}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Search Section
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 12,
  },
  filterScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#6C8BE6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },

  // Map Container
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },

  // Map Pins
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  pinContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6C8BE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  ratingBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Bottom Info
  bottomInfo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 24,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  // Profile Modal
  profileModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  profileCategory: {
    fontSize: 14,
    color: '#6C8BE6',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Rating Section
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#64748B',
  },
  experience: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },

  // Specialty Section
  specialtySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specialtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },

  // Bio
  bioText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  // Section Styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },

  // Qualifications
  qualificationsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualificationText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },

  // Contact Section
  contactSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 12,
    flex: 1,
  },

  // Fee Section
  feeSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
  },

  // Languages Section
  languagesSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  languagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageText: {
    fontSize: 12,
    color: '#6C8BE6',
    fontWeight: '500',
  },

  // Reviews Section
  reviewsSection: {
    paddingVertical: 16,
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748B',
  },
  reviewComment: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Profile Actions
  profileActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  bookButton: {
    backgroundColor: '#6C8BE6',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Booking Modal
  bookingModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },

  bookingContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Selected Dietitian Info
  selectedDietitianInfo: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  selectedDietitianName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  selectedDietitianCategory: {
    fontSize: 14,
    color: '#6C8BE6',
    fontWeight: '500',
    marginBottom: 8,
  },
  consultationFeeText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },

  // Form Styles
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formInputHalf: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Date Selection
  dateScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  dateButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedDate: {
    backgroundColor: '#6C8BE6',
    borderColor: '#6C8BE6',
  },
  dateWeekday: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },

  // Time Selection
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTime: {
    backgroundColor: '#6C8BE6',
    borderColor: '#6C8BE6',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  selectedTimeText: {
    color: '#FFFFFF',
  },

  // Booking Actions
  bookingActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: '#6C8BE6',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Success Modal
  successModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    margin: 24,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  successDetails: {
    fontSize: 14,
    color: '#6C8BE6',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#6C8BE6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },});