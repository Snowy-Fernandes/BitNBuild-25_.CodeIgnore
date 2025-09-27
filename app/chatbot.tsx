import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { 
  X, 
  Send, 
  Mic, 
  Camera, 
  Sparkles,
  ChefHat,
  Utensils,
} from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const quickActions = [
  { 
    id: 'photo-recipe',
    title: 'Find recipe from photo',
    subtitle: 'Upload food image',
    icon: '📸',
  },
  {
    id: 'nutrition-info',
    title: 'Nutrition breakdown',
    subtitle: 'Analyze meal nutrition',
    icon: '🥗',
  },
  {
    id: 'ingredient-substitute',
    title: 'Ingredient substitutes',
    subtitle: 'Find alternatives',
    icon: '🔄',
  },
  {
    id: 'cooking-tips',
    title: 'Cooking tips',
    subtitle: 'Expert advice',
    icon: '👨‍🍳',
  },
];

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

  const sendMessage = (text?: string) => {
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

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I'd be happy to help you with "${messageText}". Let me think about the best suggestions for you!`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleQuickAction = (action: any) => {
    switch (action.id) {
      case 'photo-recipe':
        sendMessage('Help me find a recipe from a food photo');
        break;
      case 'nutrition-info':
        sendMessage('Can you analyze the nutrition of my meal?');
        break;
      case 'ingredient-substitute':
        sendMessage('I need ingredient substitution suggestions');
        break;
      case 'cooking-tips':
        sendMessage('Give me some cooking tips');
        break;
      default:
        break;
    }
  };

  const handleVoiceInput = () => {
    Alert.alert('Voice Input', 'Voice recording will be available soon');
  };

  const handleImageUpload = () => {
    Alert.alert('Image Upload', 'Image upload will be available soon');
  };

  const closeChat = () => {
    router.back();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
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
              </View>
              <View>
                <Text style={styles.botName}>Chef Assistant</Text>
                <Text style={styles.botStatus}>Online</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
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

          <ScrollView 
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
                    {message.text}
                  </Text>
                </View>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.quickActionsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActions}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={() => handleQuickAction(action)}
                  accessibilityLabel={action.title}
                  accessibilityRole="button">
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
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
                placeholder="Ask me anything about cooking..."
                placeholderTextColor="#6B7280"
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
                accessibilityLabel="Message input"
              />

              <TouchableOpacity
                style={styles.inputButton}
                onPress={handleVoiceInput}
                accessibilityLabel="Voice input"
                accessibilityRole="button">
                <Mic size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={() => sendMessage()}
                disabled={!inputText.trim()}
                accessibilityLabel="Send message"
                accessibilityRole="button">
                <Send size={18} color="#FFFFFF" strokeWidth={2} />
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
  messageTime: {
    fontSize: 10,
    color: '#6B7280',
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
});