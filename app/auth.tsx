// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   Alert,
//   Dimensions,
//   KeyboardAvoidingView,
//   ScrollView,
//   Platform,
// } from 'react-native';
// import { router } from 'expo-router';
// import { ChevronLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
// import Svg, { Path, Circle, Rect } from 'react-native-svg';
// import { supabase } from '../backend/lib/supabase';
// import * as WebBrowser from 'expo-web-browser';
// import * as AuthSession from 'expo-auth-session';


// // Required so the browser session closes correctly
// WebBrowser.maybeCompleteAuthSession();
// // Get screen dimensions for responsive design
// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// const isSmallScreen = screenHeight < 700;
// const isVerySmallScreen = screenHeight < 600;

// // GourmetNet Logo SVG Component
// const GourmetNetLogo = ({ size = 80 }) => (
//   <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
//     {/* Chef Hat Base */}
//     <Circle cx="50" cy="65" r="25" fill="#6C8BE6" fillOpacity="0.1" />
    
//     {/* Chef Hat Main */}
//     <Path
//       d="M30 55 C30 35, 45 25, 50 25 C55 25, 70 35, 70 55 L70 65 C70 70, 65 75, 60 75 L40 75 C35 75, 30 70, 30 65 Z"
//       fill="#6C8BE6"
//     />
    
//     {/* Chef Hat Band */}
//     <Rect x="30" y="60" width="40" height="8" rx="4" fill="#FFFFFF" />
    
//     {/* Decorative Dots */}
//     <Circle cx="45" cy="45" r="2" fill="#FFFFFF" fillOpacity="0.8" />
//     <Circle cx="55" cy="40" r="2" fill="#FFFFFF" fillOpacity="0.8" />
//     <Circle cx="50" cy="52" r="2" fill="#FFFFFF" fillOpacity="0.8" />
//   </Svg>
// );

// // Google Icon SVG
// const GoogleIcon = ({ size = 20 }) => (
//   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
//     <Path
//       d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//       fill="#4285F4"
//     />
//     <Path
//       d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//       fill="#34A853"
//     />
//     <Path
//       d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//       fill="#FBBC05"
//     />
//     <Path
//       d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//       fill="#EA4335"
//     />
//   </Svg>
// );

// // Apple Icon SVG
// const AppleIcon = ({ size = 20 }) => (
//   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
//     <Path
//       d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
//       fill="#000000"
//     />
//   </Svg>
// );

// export default function AuthScreen() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [emailFocused, setEmailFocused] = useState(false);
//   const [passwordFocused, setPasswordFocused] = useState(false);

//   const handleLogin = async () => {
//     if (!email.trim() || !password.trim()) {
//       Alert.alert('Error', 'Please enter both email and password');
//       return;
//     }

//     setLoading(true);
//     // Simulate auth process
//     setTimeout(() => {
//       setLoading(false);
//       router.push('/onboarding');
//     }, 1500);
//   };



// const handleSocialLogin = async (provider: 'google' | 'apple') => {
//   try {
//     // Create a redirect URI using your custom scheme
//     const redirectUrl = AuthSession.makeRedirectUri({
//       scheme: 'gourmetnet', // your app scheme
//     });

//     console.log('Redirect URI:', redirectUrl);

//     // Sign in with Supabase OAuth
//     const { data, error } = await supabase.auth.signInWithOAuth({
//       provider,
//       options: {
//         redirectTo: redirectUrl,
//       },
//     });

//     if (error) throw error;

//     if (!data?.url) throw new Error('No OAuth URL returned');

//     // Open browser for login
//     const result = await AuthSession.startAsync({
//       authUrl: data.url,
//     });

//     console.log('AuthSession result:', result);

//     // If login successful, navigate to onboarding
//     if (result.type === 'success') {
//       router.push('/onboarding');
//     } else {
//       Alert.alert('Login canceled');
//     }

//   } catch (err: any) {
//     console.error('Social login error:', err);
//     Alert.alert('Login error', err.message);
//   }
// };





//   const handleForgotPassword = () => {
//     Alert.alert('Forgot Password', 'Password reset functionality will be available soon');
//   };

//   // Responsive values
//   const logoSize = isVerySmallScreen ? 60 : isSmallScreen ? 70 : 80;
//   const titleSize = isVerySmallScreen ? 24 : isSmallScreen ? 28 : 32;
//   const contentPadding = screenWidth < 350 ? 16 : 24;

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         style={styles.keyboardAvoidingView}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        
//         <ScrollView
//           style={styles.scrollView}
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled">
          
//           <View style={[styles.header, { paddingHorizontal: contentPadding }]}>
//             <TouchableOpacity
//               style={styles.backButton}
//               onPress={() => router.back()}
//               accessibilityLabel="Go back"
//               accessibilityRole="button">
//               <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
//             </TouchableOpacity>
//           </View>

//           <View style={[styles.content, { paddingHorizontal: contentPadding }]}>
//             <View style={[styles.heroSection, { marginBottom: isVerySmallScreen ? 24 : 40 }]}>
//               <View style={[
//                 styles.logoContainer,
//                 {
//                   width: logoSize + 20,
//                   height: logoSize + 20,
//                   borderRadius: (logoSize + 20) / 2
//                 }
//               ]}>
//                 <GourmetNetLogo size={logoSize} />
//               </View>
//               <Text style={[styles.heroTitle, { fontSize: titleSize }]}>
//                 GourmetNet
//               </Text>
//               <Text style={styles.heroSubtitle}>
//                 Welcome back! Sign in to your account
//               </Text>
//             </View>
            
//             <View style={[styles.form, { marginBottom: isVerySmallScreen ? 16 : 32 }]}>
//               <View style={styles.inputGroup}>
//                 <View style={[
//                   styles.inputContainer,
//                   emailFocused && styles.inputContainerFocused
//                 ]}>
//                   <View style={styles.inputIcon}>
//                     <Mail 
//                       size={screenWidth < 350 ? 18 : 20} 
//                       color={emailFocused ? '#6C8BE6' : '#6B7280'} 
//                       strokeWidth={2} 
//                     />
//                   </View>
//                   <TextInput
//                     style={[styles.input, { fontSize: screenWidth < 350 ? 15 : 16 }]}
//                     placeholder="Email address"
//                     placeholderTextColor="#9CA3AF"
//                     value={email}
//                     onChangeText={setEmail}
//                     onFocus={() => setEmailFocused(true)}
//                     onBlur={() => setEmailFocused(false)}
//                     keyboardType="email-address"
//                     autoCapitalize="none"
//                     autoCorrect={false}
//                     autoComplete="email"
//                     textContentType="emailAddress"
//                     accessibilityLabel="Email input"
//                     returnKeyType="next"
//                   />
//                 </View>

//                 <View style={[
//                   styles.inputContainer,
//                   passwordFocused && styles.inputContainerFocused
//                 ]}>
//                   <View style={styles.inputIcon}>
//                     <Lock 
//                       size={screenWidth < 350 ? 18 : 20} 
//                       color={passwordFocused ? '#6C8BE6' : '#6B7280'} 
//                       strokeWidth={2} 
//                     />
//                   </View>
//                   <TextInput
//                     style={[
//                       styles.input,
//                       styles.passwordInput,
//                       { fontSize: screenWidth < 350 ? 15 : 16 }
//                     ]}
//                     placeholder="Password"
//                     placeholderTextColor="#9CA3AF"
//                     value={password}
//                     onChangeText={setPassword}
//                     onFocus={() => setPasswordFocused(true)}
//                     onBlur={() => setPasswordFocused(false)}
//                     secureTextEntry={!showPassword}
//                     autoComplete="password"
//                     textContentType="password"
//                     accessibilityLabel="Password input"
//                     returnKeyType="done"
//                     onSubmitEditing={handleLogin}
//                   />
//                   <TouchableOpacity
//                     style={styles.eyeButton}
//                     onPress={() => setShowPassword(!showPassword)}
//                     accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
//                     accessibilityRole="button"
//                     hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//                     {showPassword ? (
//                       <EyeOff size={screenWidth < 350 ? 18 : 20} color="#6B7280" strokeWidth={2} />
//                     ) : (
//                       <Eye size={screenWidth < 350 ? 18 : 20} color="#6B7280" strokeWidth={2} />
//                     )}
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               <TouchableOpacity 
//                 style={styles.forgotPassword}
//                 onPress={handleForgotPassword}
//                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//                 <Text style={styles.forgotPasswordText}>Forgot password?</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[
//                   styles.loginButton,
//                   loading && styles.loginButtonDisabled,
//                   { minHeight: isVerySmallScreen ? 48 : 56 }
//                 ]}
//                 onPress={handleLogin}
//                 disabled={loading}
//                 accessibilityLabel="Sign in button"
//                 accessibilityRole="button">
//                 <Text style={[
//                   styles.loginButtonText,
//                   { fontSize: screenWidth < 350 ? 15 : 16 }
//                 ]}>
//                   {loading ? 'Signing in...' : 'Sign In'}
//                 </Text>
//               </TouchableOpacity>

//               <View style={[styles.divider, { marginVertical: isVerySmallScreen ? 20 : 32 }]}>
//                 <View style={styles.dividerLine} />
//                 <Text style={styles.dividerText}>or continue with</Text>
//                 <View style={styles.dividerLine} />
//               </View>

//               <View style={styles.socialButtons}>
//                 <TouchableOpacity
//                   style={[
//                     styles.socialButton,
//                     { minHeight: isVerySmallScreen ? 48 : 56 }
//                   ]}
//                   onPress={() => handleSocialLogin('google')}
//                   accessibilityLabel="Sign in with Google"
//                   accessibilityRole="button">
//                   <GoogleIcon size={screenWidth < 350 ? 18 : 20} />
//                   <Text style={[
//                     styles.socialButtonText,
//                     { fontSize: screenWidth < 350 ? 15 : 16 }
//                   ]}>
//                     Google
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[
//                     styles.socialButton,
//                     { minHeight: isVerySmallScreen ? 48 : 56 }
//                   ]}
//                   onPress={() => handleSocialLogin('apple')}
//                   accessibilityLabel="Sign in with Apple"
//                   accessibilityRole="button">
//                   <AppleIcon size={screenWidth < 350 ? 18 : 20} />
//                   <Text style={[
//                     styles.socialButtonText,
//                     { fontSize: screenWidth < 350 ? 15 : 16 }
//                   ]}>
//                     Apple
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>

//           <View style={[styles.footer, { paddingHorizontal: contentPadding }]}>
//             <Text style={[
//               styles.footerText,
//               { fontSize: screenWidth < 350 ? 12 : 13 }
//             ]}>
//               By signing in, you agree to our{' '}
//               <Text style={styles.link}>Terms of Service</Text> and{' '}
//               <Text style={styles.link}>Privacy Policy</Text>
//             </Text>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingBottom: 20,
//   },
//   header: {
//     paddingTop: Platform.OS === 'ios' ? 10 : 20,
//     paddingBottom: 10,
//   },
//   backButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.05,
//     shadowRadius: 3.84,
//     elevation: 2,
//   },
//   content: {
//     flex: 1,
//     paddingTop: 10,
//   },
//   heroSection: {
//     alignItems: 'center',
//   },
//   logoContainer: {
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: isVerySmallScreen ? 12 : 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 4,
//   },
//   heroTitle: {
//     fontWeight: '700',
//     color: '#1F2937',
//     textAlign: 'center',
//     marginBottom: 8,
//     letterSpacing: -0.5,
//   },
//   heroSubtitle: {
//     fontSize: screenWidth < 350 ? 14 : 16,
//     color: '#6B7280',
//     textAlign: 'center',
//     fontWeight: '400',
//     lineHeight: 22,
//     paddingHorizontal: 20,
//   },
//   form: {
//     width: '100%',
//     maxWidth: 400,
//     alignSelf: 'center',
//   },
//   inputGroup: {
//     marginBottom: 16,
//   },
//   inputContainer: {
//     position: 'relative',
//     marginBottom: 16,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     borderWidth: 1.5,
//     borderColor: '#E5E7EB',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingLeft: 16,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.03,
//     shadowRadius: 3,
//     elevation: 1,
//   },
//   inputContainerFocused: {
//     borderColor: '#6C8BE6',
//     shadowColor: '#6C8BE6',
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     paddingVertical: Platform.OS === 'ios' ? 18 : 16,
//     paddingRight: 16,
//     color: '#1F2937',
//     fontWeight: '400',
//   },
//   passwordInput: {
//     paddingRight: 52,
//   },
//   eyeButton: {
//     position: 'absolute',
//     right: 16,
//     width: 32,
//     height: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   forgotPassword: {
//     alignSelf: 'flex-end',
//     marginBottom: 24,
//     paddingVertical: 4,
//   },
//   forgotPasswordText: {
//     color: '#6C8BE6',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   loginButton: {
//     backgroundColor: '#6C8BE6',
//     borderRadius: 12,
//     paddingVertical: 18,
//     paddingHorizontal: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#6C8BE6',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   loginButtonDisabled: {
//     opacity: 0.7,
//     shadowOpacity: 0.1,
//   },
//   loginButtonText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//   },
//   divider: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#E5E7EB',
//   },
//   dividerText: {
//     color: '#6B7280',
//     fontSize: 14,
//     marginHorizontal: 16,
//     fontWeight: '500',
//   },
//   socialButtons: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   socialButton: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     paddingVertical: 16,
//     paddingHorizontal: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1.5,
//     borderColor: '#E5E7EB',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.03,
//     shadowRadius: 3,
//     elevation: 1,
//   },
//   socialButtonText: {
//     color: '#1F2937',
//     fontWeight: '500',
//     marginLeft: 8,
//   },
//   footer: {
//     alignItems: 'center',
//     paddingTop: 24,
//     paddingBottom: 32,
//   },
//   footerText: {
//     color: '#6B7280',
//     textAlign: 'center',
//     lineHeight: 20,
//     fontWeight: '400',
//   },
//   link: {
//     color: '#6C8BE6',
//     fontWeight: '500',
//   },
// });
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { checkUserProfile, supabase } from '../backend/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Complete the web OAuth session
WebBrowser.maybeCompleteAuthSession();

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;
const isVerySmallScreen = screenHeight < 600;

// GourmetNet Logo Component
const GourmetNetLogo = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Circle cx="50" cy="65" r="25" fill="#6C8BE6" fillOpacity="0.1" />
    <Path
      d="M30 55 C30 35, 45 25, 50 25 C55 25, 70 35, 70 55 L70 65 C70 70, 65 75, 60 75 L40 75 C35 75, 30 70, 30 65 Z"
      fill="#6C8BE6"
    />
    <Rect x="30" y="60" width="40" height="8" rx="4" fill="#FFFFFF" />
    <Circle cx="45" cy="45" r="2" fill="#FFFFFF" fillOpacity="0.8" />
    <Circle cx="55" cy="40" r="2" fill="#FFFFFF" fillOpacity="0.8" />
    <Circle cx="50" cy="52" r="2" fill="#FFFFFF" fillOpacity="0.8" />
  </Svg>
);

// Google Icon
const GoogleIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </Svg>
);

// Apple Icon
const AppleIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      fill="#000000"
    />
  </Svg>
);

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // 1) On mount: if already signed in, go to onboarding
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (session && mounted) {
          // Replace so user can't go back to auth
          router.replace('/onboarding');
        }
      } catch (e) {
        console.warn('error checking session on mount', e);
      }
    })();

    // 2) Listen for auth changes (SIGNED_IN event)
    // const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    //   console.log('onAuthStateChange', event, !!session);
    //   if (event === 'SIGNED_IN' && session) {
    //     router.replace('/onboarding'); // navigate after signup/login
    //   }
    // });
    // Replace the onAuthStateChange listener in your auth.tsx
// Enhanced auth state change listener
const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, session?.user?.id);
  
  if (event === 'SIGNED_IN' && session) {
    try {
      // Check if user has a profile with display name
      const { hasProfile, displayName } = await checkUserProfile(session.user.id);
      
      if (hasProfile && displayName) {
        // User has a name, go to onboarding
        router.replace('/onboarding');
      } else {
        // User needs to set a name first
        router.replace('./name-input');
      }
    } catch (error) {
      console.error('Error during auth state change:', error);
      // Default to name input on error
      router.replace('./name-input');
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe?.();
      } catch (err) {
        // ignore
      }
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/onboarding');
    }, 1500);
  };

  // Social login: ask Supabase for the oauth url, open system browser on native,
  // onAuthStateChange listener (above) will navigate to onboarding after success.
  // const handleSocialLogin = async (provider: 'google' | 'apple') => {
  //   try {
  //     setLoading(true);

  //     const redirectUrl = Platform.OS === 'web'
  //       ? window.location.origin
  //       : (AuthSession.makeRedirectUri({ useProxy: true, scheme: 'gourmetnet' }) as string);

  //     console.log('Social login redirectUrl:', redirectUrl);

  //     const { data, error } = await supabase.auth.signInWithOAuth({
  //       provider,
  //       options: { redirectTo: redirectUrl },
  //     });

  //     if (error) throw error;
  //     if (!data?.url) throw new Error('No OAuth URL returned');

  //     // Native: open the browser - the onAuthStateChange listener will handle navigation
  //     if (Platform.OS !== 'web') {
  //       // openAuthSessionAsync will open browser and return when it closes; success is detected via onAuthStateChange
  //       await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  //     }
  //     // Web: Supabase redirects the page automatically; detectSessionInUrl must be true in supabase.ts
  //   } catch (err: any) {
  //     console.error('Social login error:', err);
  //     Alert.alert('Login error', err?.message ?? String(err));
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const handleSocialLogin = async (provider: 'google' | 'apple') => {
  let subscription: any = null;
  try {
    setLoading(true);

    const redirectUrl = Platform.OS === 'web'
      ? window.location.origin
      : (AuthSession.makeRedirectUri({ useProxy: true, scheme: 'gourmetnet' }) as string);

    // start listener BEFORE starting oauth flow to avoid missing the event
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('onAuthStateChange', event);
      if (event === 'SIGNED_IN' && session) {
        // use replace so user can't go back to auth
        router.replace('/onboarding');
      }
    });
    subscription = data?.subscription;

    const { data: signInData, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    });

    if (error) throw error;
    if (!signInData?.url) throw new Error('No OAuth URL returned from Supabase');

    if (Platform.OS !== 'web') {
      // Native: open external browser/auth session; navigation handled by listener
      await WebBrowser.openAuthSessionAsync(signInData.url, redirectUrl);
    } else {
      // Web: Supabase will redirect the page to Google and then back.
      // detectSessionInUrl must be true in supabase client so session is parsed on return.
    }
  } catch (err: any) {
    console.error('Social login error:', err);
    Alert.alert('Login error', err?.message ?? String(err));
  } finally {
    setLoading(false);
    // cleanup listener
    try {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    } catch (e) {
      console.warn('Failed to unsubscribe', e);
    }
  }
};

  const logoSize = isVerySmallScreen ? 60 : isSmallScreen ? 70 : 80;
  const titleSize = isVerySmallScreen ? 24 : isSmallScreen ? 28 : 32;
  const contentPadding = screenWidth < 350 ? 16 : 24;

  function handleForgotPassword(event: GestureResponderEvent): void {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality will be available soon.'
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.header, { paddingHorizontal: contentPadding }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <ChevronLeft size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={[styles.content, { paddingHorizontal: contentPadding }]}>
            <View style={[styles.heroSection, { marginBottom: isVerySmallScreen ? 24 : 40 }]}>
              <View
                style={[
                  styles.logoContainer,
                  {
                    width: logoSize + 20,
                    height: logoSize + 20,
                    borderRadius: (logoSize + 20) / 2,
                  },
                ]}
              >
                <GourmetNetLogo size={logoSize} />
              </View>
              <Text style={[styles.heroTitle, { fontSize: titleSize }]}>GourmetNet</Text>
              <Text style={styles.heroSubtitle}>Welcome back! Sign in to your account</Text>
            </View>

            <View style={[styles.form, { marginBottom: isVerySmallScreen ? 16 : 32 }]}>
              <View style={styles.inputGroup}>
                <View
                  style={[styles.inputContainer, emailFocused && styles.inputContainerFocused]}
                >
                  <View style={styles.inputIcon}>
                    <Mail
                      size={screenWidth < 350 ? 18 : 20}
                      color={emailFocused ? '#6C8BE6' : '#6B7280'}
                      strokeWidth={2}
                    />
                  </View>
                  <TextInput
                    style={[styles.input, { fontSize: screenWidth < 350 ? 15 : 16 }]}
                    placeholder="Email address"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View
                  style={[styles.inputContainer, passwordFocused && styles.inputContainerFocused]}
                >
                  <View style={styles.inputIcon}>
                    <Lock
                      size={screenWidth < 350 ? 18 : 20}
                      color={passwordFocused ? '#6C8BE6' : '#6B7280'}
                      strokeWidth={2}
                    />
                  </View>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { fontSize: screenWidth < 350 ? 15 : 16 }]}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={screenWidth < 350 ? 18 : 20} color="#6B7280" strokeWidth={2} />
                    ) : (
                      <Eye size={screenWidth < 350 ? 18 : 20} color="#6B7280" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={[styles.divider, { marginVertical: isVerySmallScreen ? 20 : 32 }]}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('google')}
                >
                  <GoogleIcon size={screenWidth < 350 ? 18 : 20} />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('apple')}
                >
                  <AppleIcon size={screenWidth < 350 ? 18 : 20} />
                  <Text style={styles.socialButtonText}>Apple</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.footer, { paddingHorizontal: contentPadding }]}>
            <Text style={[styles.footerText, { fontSize: screenWidth < 350 ? 12 : 13 }]}>
              By signing in, you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: { paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 10 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  content: { flex: 1, paddingTop: 10 },
  heroSection: { alignItems: 'center' },
  logoContainer: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTitle: { fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', fontWeight: '400', lineHeight: 22, paddingHorizontal: 20 },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  inputGroup: { marginBottom: 16 },
  inputContainer: { position: 'relative', marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', paddingLeft: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  inputContainerFocused: { borderColor: '#6C8BE6', shadowColor: '#6C8BE6', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 18 : 16, paddingRight: 16, color: '#1F2937', fontWeight: '400' },
  passwordInput: { paddingRight: 52 },
  eyeButton: { position: 'absolute', right: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24, paddingVertical: 4 },
  forgotPasswordText: { color: '#6C8BE6', fontSize: 14, fontWeight: '500' },
  loginButton: { backgroundColor: '#6C8BE6', borderRadius: 12, paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#6C8BE6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  loginButtonDisabled: { opacity: 0.7, shadowOpacity: 0.1 },
  loginButtonText: { color: '#FFFFFF', fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#6B7280', fontSize: 14, marginHorizontal: 16, fontWeight: '500' },
  socialButtons: { flexDirection: 'row', gap: 12 },
  socialButton: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  socialButtonText: { color: '#1F2937', fontWeight: '500', marginLeft: 8 },
  footer: { alignItems: 'center', paddingTop: 24, paddingBottom: 32 },
  footerText: { color: '#6B7280', textAlign: 'center', lineHeight: 20, fontWeight: '400' },
  link: { color: '#6C8BE6', fontWeight: '500' },
});
