// ChatbotScreen.tsx - Fixed version
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
    title: 'Nutrition analysis',
    subtitle: 'Analyze meal nutrition',
    icon: '🥗',
  },
  {
    id: 'recipe-request',
    title: 'Get recipes',
    subtitle: 'Find cooking instructions',
    icon: '👨‍🍳',
  },
  {
    id: 'fridge-ingredients',
    title: 'Fridge ingredients',
    subtitle: 'What can I make?',
    icon: '🧊',
  },
  {
    id: 'diet-advice',
    title: 'Diet planning',
    subtitle: 'Meal plans & advice',
    icon: '📋',
  },
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

// API Configuration - UPDATED ENDPOINTS
const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000',
  endpoints: {
    message: '/api/chatbot/message',
    voice: '/api/chatbot/voice',
    health: '/api/chatbot/health',
    test: '/api/chatbot/test',
    intents: '/api/chatbot/intents',
  },
  timeout: 15000,
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI culinary assistant. I can help with recipes, nutrition, cooking tips, and meal planning! What would you like to know?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionTesting, setConnectionTesting] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

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

  const testBackendConnection = async () => {
    try {
      setConnectionTesting(true);
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.health}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setIsConnected(true);
        console.log('✅ Backend connection successful');
        
        const connectionMessage: Message = {
          id: 'connection-success',
          text: '✅ Connected to culinary AI assistant! Ask me anything about food, recipes, or nutrition.',
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
        text: '⚠️ Running in offline mode. Some features may be limited. Please check your connection to the backend server.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [prev[0], errorMessage]);
    } finally {
      setConnectionTesting(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message immediately
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

        // Handle redirects
        if (data.redirect) {
          setTimeout(() => {
            handleRedirect(data.redirect);
          }, 2000);
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
        errorText = 'Connection lost. Using offline mode.';
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

  const sendVoiceMessage = async () => {
    if (!isConnected) {
      Alert.alert('Offline Mode', 'Voice messages require backend connection.');
      return;
    }

    Alert.alert('Voice Input', 'Voice input is being optimized. Please use text input for now.', [
      { text: 'OK' }
    ]);
    
    // Temporary implementation - will be enhanced with proper voice processing
    return;
  };

  const getOfflineResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced offline responses
    if (lowerMessage.includes('ice cream') && lowerMessage.includes('recipe')) {
      return `🍦 **Simple Ice Cream Recipe (Offline Mode)**

**Ingredients:**
- 2 cups heavy cream
- 1 cup whole milk  
- 3/4 cup sugar
- 1 tbsp vanilla extract

**Instructions:**
1. Mix all ingredients until sugar dissolves
2. Pour into ice cream maker
3. Churn 20-25 minutes
4. Freeze 4+ hours

**Tip:** Connect to backend for detailed recipes with variations!`;
    }
    
    if (lowerMessage.includes('recipe')) {
      return `👨‍🍳 **Recipe Assistance**\n\nI can help with recipes! Please ensure the backend server is running on port 5000 for full recipe database access.`;
    }
    
    if (lowerMessage.includes('nutrition')) {
      return `🥗 **Nutrition Analysis**\n\nFor detailed nutrition analysis, please connect to the backend server and use the nutrition extraction feature.`;
    }
    
    return `🤖 **Culinary Assistant** (Offline Mode)\n\nI'm currently offline. Please check:\n• Backend server is running on port 5000\n• Network connection is stable\n• Server URL: ${API_CONFIG.baseURL}\n\nI can still help with basic cooking questions!`;
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
        message = 'Can you analyze the nutrition of a typical chicken salad?';
        break;
      case 'recipe-request':
        message = 'How do I make homemade ice cream?';
        break;
      case 'fridge-ingredients':
        message = 'I have eggs, cheese, and vegetables. What can I make?';
        break;
      case 'diet-advice':
        message = 'Can you suggest a healthy weekly meal plan?';
        break;
      default:
        message = action.title;
    }
    sendMessage(message);
  };

  const handleVoiceInput = () => {
    sendVoiceMessage();
  };

  const handleImageUpload = () => {
    Alert.alert('Coming Soon', 'Image analysis feature will be available soon!');
  };

  const closeChat = () => {
    router.back();
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
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <Text key={index} style={styles.boldText}>{part}</Text>;
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botAvatar}>
              <ChefHat size={20} color="#6C8BE6" strokeWidth={2} />
              {!isConnected && !connectionTesting && (
                <View style={styles.connectionBadgeOffline} />
              )}
              {connectionTesting && (
                <ActivityIndicator size="small" color="#FF6B6B" />
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
            >
              {isConnected ? (
                <Wifi size={18} color="#10B981" />
              ) : (
                <WifiOff size={18} color="#EF4444" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleLanguageSelector}
            >
              <Languages size={18} color="#6B7280" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={closeChat}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Selector */}
        {showLanguageSelector && (
          <View style={styles.languageSelector}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === lang.code && styles.languageOptionSelected,
                ]}
                onPress={() => selectLanguage(lang.code)}
              >
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

        {/* Connection Banner */}
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

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser && styles.messageWrapperUser,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.messageBubbleUser : styles.messageBubbleBot,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.messageTextUser : styles.messageTextBot,
                ]}>
                  {formatMessageText(message.text)}
                </Text>
                
                {message.redirect && (
                  <TouchableOpacity
                    style={styles.redirectButton}
                    onPress={() => handleRedirect(message.redirect!)}
                  >
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

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActions}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => handleQuickAction(action)}
                disabled={isLoading}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={handleImageUpload}
            >
              <Camera size={20} color="#6B7280" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                isConnected 
                  ? `Ask about recipes, nutrition, cooking... (${selectedLanguage})`
                  : 'Offline mode - Basic questions only...'
              }
              placeholderTextColor="#6B7280"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={styles.inputButton}
              onPress={handleVoiceInput}
              disabled={isLoading}
            >
              <Mic size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
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
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
    borderColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#F3F4F6',
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
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  messageBubbleBot: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    marginLeft: 12,
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
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  quickActions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionCard: {
    width: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
});