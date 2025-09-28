// ChatbotScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { 
  X, 
  Send, 
  Mic, 
  Camera, 
  ChefHat,
  Volume2,
  Languages,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { Audio } from 'expo-av';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audio?: string;
  redirect?: string;
  intent?: string;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

const quickActions: QuickAction[] = [
  { 
    id: 'nutrition-info',
    title: 'Nutrition breakdown',
    subtitle: 'Analyze meal nutrition',
    icon: '🥗',
  },
  {
    id: 'fridge-ingredients',
    title: 'Fridge ingredients',
    subtitle: 'What can I make?',
    icon: '🧊',
  },
  {
    id: 'recipe-extraction',
    title: 'Get recipe',
    subtitle: 'From dish name or photo',
    icon: '👨‍🍳',
  },
  {
    id: 'diet-plan',
    title: 'Diet plan',
    subtitle: 'Weekly meal planning',
    icon: '📋',
  },
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

// API Configuration
const API_CONFIG = {
  baseURL: 'http://localhost:5000', // Change to your server IP if needed
  endpoints: {
    message: '/api/chatbot/message',
    voice: '/api/chatbot/voice',
    health: '/api/chatbot/health',
    test: '/api/chatbot/test',
  },
  timeout: 10000, // 10 seconds
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m your culinary assistant. How can I help you cook something amazing today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionTesting, setConnectionTesting] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Test backend connection on component mount
  useEffect(() => {
    testBackendConnection();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const testBackendConnection = async () => {
    try {
      setConnectionTesting(true);
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.health}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        console.log('✅ Backend connection successful:', data);
        
        // Add connection success message
        const connectionMessage: Message = {
          id: 'connection-success',
          text: '✅ Connected to culinary AI assistant! Ask me anything about food, nutrition, or cooking.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [prev[0], connectionMessage]);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setIsConnected(false);
      
      const errorMessage: Message = {
        id: 'connection-error',
        text: '⚠️ Backend connection issue. Using limited functionality. Some features may not work properly.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [prev[0], errorMessage]);
    } finally {
      setConnectionTesting(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      if (!base64Audio) return;

      // Convert base64 to audio source
      const audioUri = `data:audio/mp3;base64,${base64Audio}`;
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      if (uri) {
        await sendVoiceMessage(uri);
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const sendVoiceMessage = async (audioUri: string) => {
    if (!isConnected) {
      Alert.alert('Offline Mode', 'Voice messages require backend connection. Please check your connection and try again.');
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('language', selectedLanguage);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.voice}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          id: Date.now().toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date(),
          audio: data.audio,
          redirect: data.redirect,
          intent: data.intent,
        };

        setMessages(prev => [...prev, botMessage]);

        // Handle redirect
        if (data.redirect) {
          setTimeout(() => {
            handleRedirect(data.redirect);
          }, 2000);
        }

        // Play audio if available
        if (data.audio) {
          await playAudio(data.audio);
        }
      } else {
        throw new Error(data.error || 'Failed to process voice message');
      }
    } catch (error: any) {
      console.error('Error sending voice message:', error);
      
      let errorText = 'Sorry, I encountered an error processing your voice message.';
      if (error.name === 'AbortError') {
        errorText = 'Request timeout. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorText = 'Connection failed. Please check if the backend server is running.';
        setIsConnected(false);
      }

      const errorMessage: Message = {
        id: Date.now().toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // If not connected, use offline response
      if (!isConnected) {
        setTimeout(() => {
          const offlineResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: getOfflineResponse(messageText),
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, offlineResponse]);
          setIsLoading(false);
        }, 1000);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.message}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          language: selectedLanguage,
          use_voice: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date(),
          audio: data.audio,
          redirect: data.redirect,
          intent: data.intent,
        };

        setMessages(prev => [...prev, botMessage]);

        // Handle redirect
        if (data.redirect) {
          setTimeout(() => {
            handleRedirect(data.redirect);
          }, 2000);
        }

        // Play audio if available
        if (data.audio) {
          await playAudio(data.audio);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorText = 'Sorry, I encountered an error. Please try again.';
      if (error.name === 'AbortError') {
        errorText = 'Request timeout. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorText = 'Connection lost. Using offline mode. Some features may be limited.';
        setIsConnected(false);
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOfflineResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Basic offline responses
    if (lowerMessage.includes('sugar') && lowerMessage.includes('cotton candy')) {
      return `🚫 **NO - You should avoid cotton candy if you have high sugar!**

**Reasons:**
- Very high in simple sugars
- Rapid blood sugar spike
- Can worsen diabetes

**Better alternatives:** Fresh fruits, sugar-free desserts`;
    }
    
    if (lowerMessage.includes('nutrition') || lowerMessage.includes('calorie')) {
      return `🥗 **Nutrition Information**

For detailed nutrition analysis, please ensure the backend server is running. Meanwhile, you can:
- Use specific food tracking apps
- Consult nutrition labels
- Speak with a nutritionist`;
    }
    
    if (lowerMessage.includes('recipe') || lowerMessage.includes('cook')) {
      return `👨‍🍳 **Recipe Assistance**

I'd love to help with recipes! Please check your connection to access our full recipe database.`;
    }
    
    if (lowerMessage.includes('fridge') || lowerMessage.includes('ingredients')) {
      return `🧊 **Fridge Ingredients**

Tell me what ingredients you have, and I'll try to suggest some basic ideas!`;
    }
    
    return `🤖 **Culinary Assistant** (Offline Mode)

I'm currently in offline mode. Please check:
1. Backend server is running on port 5000
2. Your network connection
3. Server health at ${API_CONFIG.baseURL}/health

Meanwhile, I can still help with basic food questions!`;
  };

  const handleRedirect = (screen: string) => {
    switch (screen) {
      case 'extract-nutrition':
        router.push('/(tabs)/nutrition-extractor');
        break;
      case 'fridge':
        router.push('/fridge');
        break;
      case 'extract-recipe':
        router.push('/(tabs)/recipe-extractor');
        break;
      case 'diet-plan':
        router.push('/diet-plan');
        break;
      default:
        break;
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    let message = '';
    switch (action.id) {
      case 'nutrition-info':
        message = 'I want to analyze the nutrition of my food';
        break;
      case 'fridge-ingredients':
        message = 'I have ingredients in my fridge, what should I make?';
        break;
      case 'recipe-extraction':
        message = 'I want to get a recipe for a dish';
        break;
      case 'diet-plan':
        message = 'I want to create a weekly diet plan';
        break;
      default:
        message = action.title;
    }
    sendMessage(message);
  };

  const handleVoiceInput = () => {
    if (!isConnected) {
      Alert.alert('Offline Mode', 'Voice input requires backend connection. Please connect to the server first.');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleImageUpload = () => {
    Alert.alert('Coming Soon', 'Image upload feature will be available in the next update');
  };

  const closeChat = () => {
    router.back();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleLanguageSelector = () => {
    setShowLanguageSelector(!showLanguageSelector);
  };

  const selectLanguage = (langCode: string) => {
    setSelectedLanguage(langCode);
    setShowLanguageSelector(false);
  };

  const retryConnection = () => {
    testBackendConnection();
  };

  const formatMessageText = (text: string) => {
    // Basic markdown-style formatting
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <Text key={index} style={styles.boldText}>{part}</Text>;
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  if (isMinimized) {
    return (
      <TouchableOpacity
        style={styles.minimizedChat}
        onPress={toggleMinimize}
        accessibilityLabel="Open chatbot"
        accessibilityRole="button">
        <ChefHat size={24} color="#FFFFFF" strokeWidth={2} />
        <View style={styles.notificationDot} />
        {!isConnected && <View style={styles.connectionIndicatorOffline} />}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop}
        onPress={closeChat}
        accessibilityLabel="Close chatbot"
        accessibilityRole="button"
      />
      
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.botAvatar}>
                <ChefHat size={20} color="#6C8BE6" strokeWidth={2} />
                {!isConnected && !connectionTesting && (
                  <View style={styles.connectionBadgeOffline} />
                )}
                {connectionTesting && (
                  <ActivityIndicator size="small" color="#FF6B6B" style={styles.connectionBadgeTesting} />
                )}
              </View>
              <View>
                <Text style={styles.botName}>Chef Assistant</Text>
                <Text style={styles.botStatus}>
                  {SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage)?.name}
                  {!isConnected && ' • Offline'}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={retryConnection}
                accessibilityLabel="Check connection"
                accessibilityRole="button">
                {isConnected ? (
                  <Wifi size={18} color="#10B981" strokeWidth={2} />
                ) : (
                  <WifiOff size={18} color="#EF4444" strokeWidth={2} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleLanguageSelector}
                accessibilityLabel="Change language"
                accessibilityRole="button">
                <Languages size={18} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleMinimize}
                accessibilityLabel="Minimize chatbot"
                accessibilityRole="button">
                <Text style={styles.minimizeText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={closeChat}
                accessibilityLabel="Close chatbot"
                accessibilityRole="button">
                <X size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          {showLanguageSelector && (
            <View style={styles.languageSelector}>
              {SUPPORTED_LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang.code && styles.languageOptionSelected,
                  ]}
                  onPress={() => selectLanguage(lang.code)}>
                  <Text style={[
                    styles.languageText,
                    selectedLanguage === lang.code && styles.languageTextSelected,
                  ]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isConnected && !connectionTesting && (
            <View style={styles.connectionBanner}>
              <Text style={styles.connectionText}>
                Offline Mode - Limited functionality
              </Text>
              <TouchableOpacity onPress={retryConnection}>
                <Text style={styles.retryText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.isUser && styles.messageWrapperUser,
                ]}>
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.messageBubbleUser : styles.messageBubbleBot,
                  ]}>
                  <Text
                    style={[
                      styles.messageText,
                      message.isUser ? styles.messageTextUser : styles.messageTextBot,
                    ]}>
                    {formatMessageText(message.text)}
                  </Text>
                  
                  {!message.isUser && message.audio && (
                    <TouchableOpacity
                      style={styles.audioButton}
                      onPress={() => message.audio && playAudio(message.audio)}>
                      <Volume2 size={16} color="#6C8BE6" />
                      <Text style={styles.audioText}>Listen</Text>
                    </TouchableOpacity>
                  )}

                  {!message.isUser && message.redirect && (
                    <TouchableOpacity
                      style={styles.redirectButton}
                      onPress={() => handleRedirect(message.redirect!)}>
                      <Text style={styles.redirectText}>
                        Go to {message.redirect.replace('-', ' ')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
            
            {isLoading && (
              <View style={styles.loadingWrapper}>
                <View style={styles.messageBubbleBot}>
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color="#6C8BE6" />
                    <Text style={styles.typingText}>
                      {isConnected ? 'Chef is thinking...' : 'Processing offline...'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.quickActionsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActions}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.quickActionCard,
                    !isConnected && styles.quickActionCardDisabled,
                  ]}
                  onPress={() => handleQuickAction(action)}
                  disabled={!isConnected && isLoading}
                  accessibilityLabel={action.title}
                  accessibilityRole="button">
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                  {!isConnected && (
                    <View style={styles.offlineOverlay} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.inputButton}
                onPress={handleImageUpload}
                accessibilityLabel="Upload image"
                accessibilityRole="button">
                <Camera size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
              
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  isConnected 
                    ? `Ask me anything about cooking... (${selectedLanguage})`
                    : 'Offline mode - Basic questions only...'
                }
                placeholderTextColor="#6B7280"
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
                accessibilityLabel="Message input"
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[
                  styles.inputButton,
                  isRecording && styles.recordingButton,
                  !isConnected && styles.inputButtonDisabled,
                ]}
                onPress={handleVoiceInput}
                disabled={!isConnected || isLoading}
                accessibilityLabel="Voice input"
                accessibilityRole="button">
                <Mic 
                  size={20} 
                  color={
                    !isConnected ? "#9CA3AF" : 
                    isRecording ? "#FF6B6B" : "#6B7280"
                  } 
                  strokeWidth={2} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                onPress={() => sendMessage()}
                disabled={!inputText.trim() || isLoading}
                accessibilityLabel="Send message"
                accessibilityRole="button">
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={18} color="#FFFFFF" strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#F6F8FB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF3FF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  connectionBadgeOffline: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#F6F8FB',
  },
  connectionBadgeTesting: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
  },
  botName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  botStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#EFF3FF',
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  languageOptionSelected: {
    backgroundColor: '#6C8BE6',
  },
  languageText: {
    fontSize: 12,
    color: '#6B7280',
  },
  languageTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connectionBanner: {
    backgroundColor: '#FEF3F2',
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  connectionText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  retryText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  messageWrapperUser: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  messageBubbleBot: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
  },
  messageBubbleUser: {
    backgroundColor: '#6C8BE6',
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextBot: {
    color: '#1F2937',
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  boldText: {
    fontWeight: 'bold',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 6,
    backgroundColor: '#EFF3FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  audioText: {
    fontSize: 12,
    color: '#6C8BE6',
    marginLeft: 4,
  },
  redirectButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#6C8BE6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  redirectText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 10,
    color: '#6B7280',
  },
  loadingWrapper: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  quickActionsContainer: {
    paddingVertical: 16,
  },
  quickActions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionCard: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFF3FF',
    position: 'relative',
  },
  quickActionCardDisabled: {
    opacity: 0.6,
  },
  offlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFF3FF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputButtonDisabled: {
    opacity: 0.5,
  },
  recordingButton: {
    backgroundColor: '#FFE6E6',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C8BE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  minimizedChat: {
    position: 'absolute',
    bottom: 100,
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
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BFAFF7',
  },
  connectionIndicatorOffline: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});