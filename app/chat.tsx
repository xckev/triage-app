import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Button, Text, Surface, useTheme, Card, Menu } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { generateResponse } from '../services/aiService';

interface Message {
  text: string;
  isUser: boolean;
}

interface SuggestedQuestion {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
  category: string;
}

type ChatMode = 'disaster' | 'firstaid' | 'mental';

interface ChatModeConfig {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  questions: SuggestedQuestion[];
}

const CHAT_MODES: Record<ChatMode, ChatModeConfig> = {
  disaster: {
    title: "Disaster Assistant",
    icon: "alert-octagram",
    questions: [
      {
        icon: 'alert-circle',
        text: "What should I do in case of an emergency?",
        category: "Emergency",
      },
      {
        icon: 'map-marker-radius',
        text: "Where is the nearest emergency facility?",
        category: "Location",
      },
      {
        icon: 'medical-bag',
        text: "What supplies should I have in my emergency kit?",
        category: "Resources",
      },
      {
        icon: 'shield-alert',
        text: "What are the current risk levels in my area?",
        category: "Safety",
      },
    ],
  },
  firstaid: {
    title: "First Aid Guide",
    icon: "medical-bag",
    questions: [
      {
        icon: 'bandage',
        text: "How do I treat a minor burn?",
        category: "Burns",
      },
      {
        icon: 'heart-pulse',
        text: "What are the steps for basic CPR?",
        category: "CPR",
      },
      {
        icon: 'hospital-box',
        text: "How do I handle a severe bleeding wound?",
        category: "Bleeding",
      },
      {
        icon: 'bone',
        text: "What should I do for a possible broken bone?",
        category: "Injuries",
      },
    ],
  },
  mental: {
    title: "Mental Health Support",
    icon: "brain",
    questions: [
      {
        icon: 'meditation',
        text: "What are some quick anxiety relief techniques?",
        category: "Anxiety",
      },
      {
        icon: 'head-heart',
        text: "How can I help someone in emotional distress?",
        category: "Crisis",
      },
      {
        icon: 'sleep',
        text: "What can I do to improve my sleep quality?",
        category: "Sleep",
      },
      {
        icon: 'hand-heart',
        text: "Where can I find professional mental health support?",
        category: "Resources",
      },
    ],
  },
};

const SuggestedQuestion = ({ icon, text, category, onPress }: SuggestedQuestion & { onPress: () => void }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress}>
      <Surface style={[styles.suggestionCard, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.suggestionHeader}>
          <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
          <Text style={[styles.suggestionCategory, { color: theme.colors.primary }]}>{category}</Text>
        </View>
        <Text style={[styles.suggestionText, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {text}
        </Text>
      </Surface>
    </TouchableOpacity>
  );
};

const ModeSelector = ({ currentMode, onModeChange, onClearChat }: { 
  currentMode: ChatMode; 
  onModeChange: (mode: ChatMode) => void;
  onClearChat: () => void;
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const theme = useTheme();

  return (
    <View style={[styles.modeSelector, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.modeSelectorRow}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity 
              style={styles.modeSelectorButton} 
              onPress={() => setMenuVisible(true)}
            >
              <MaterialCommunityIcons 
                name={CHAT_MODES[currentMode].icon} 
                size={24} 
                color={theme.colors.primary} 
              />
              <Text style={[styles.modeSelectorText, { color: theme.colors.onSurface }]}>
                {CHAT_MODES[currentMode].title}
              </Text>
              <MaterialCommunityIcons 
                name="chevron-down" 
                size={24} 
                color={theme.colors.onSurfaceVariant} 
              />
            </TouchableOpacity>
          }
        >
          {(Object.entries(CHAT_MODES) as [ChatMode, ChatModeConfig][]).map(([mode, config]) => (
            <Menu.Item
              key={mode}
              onPress={() => {
                onModeChange(mode);
                setMenuVisible(false);
              }}
              title={config.title}
              leadingIcon={config.icon}
            />
          ))}
        </Menu>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={onClearChat}
        >
          <MaterialCommunityIcons 
            name="delete" 
            size={24} 
            color={theme.colors.error} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LoadingAnimation = () => {
  const theme = useTheme();
  const [animations] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  useEffect(() => {
    const animate = () => {
      const animation = Animated.sequence([
        Animated.stagger(200, [
          Animated.timing(animations[0], {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animations[1], {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animations[2], {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.stagger(200, [
          Animated.timing(animations[0], {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animations[1], {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animations[2], {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]);

      Animated.loop(animation).start();
    };

    animate();

    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, []);

  return (
    <Surface
      style={[
        styles.messageBubble,
        styles.aiBubble,
        { backgroundColor: theme.colors.surfaceVariant }
      ]}
    >
      <View style={styles.typingIndicator}>
        {animations.map((animation, index) => (
          <Animated.View
            key={index}
            style={[
              styles.typingDot,
              { 
                backgroundColor: theme.colors.onSurfaceVariant,
                opacity: animation,
                transform: [{
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                }],
              }
            ]}
          />
        ))}
      </View>
    </Surface>
  );
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('disaster');
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMessage: Message = { text: text.trim(), isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await generateResponse(text, currentMode);
      const aiMessage: Message = {
        text: response,
        isUser: false,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputText("");
  };

  const renderMessage = (message: Message, index: number) => {
    const parseText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={{ fontWeight: 'bold' }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      });
    };

    return (
      <Surface
        key={index}
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble,
          message.isUser 
            ? { backgroundColor: theme.colors.primary } 
            : { backgroundColor: theme.colors.surfaceVariant }
        ]}
      >
        <Text 
          style={[
            styles.messageText,
            message.isUser 
              ? { color: theme.colors.onPrimary }
              : { color: theme.colors.onSurface }
          ]}
        >
          {parseText(message.text)}
        </Text>
      </Surface>
    );
  };

  const EmptyChat = () => (
    <View style={styles.welcomeContainer}>
      <Text style={[styles.welcomeText, { color: theme.colors.primary }]}>
        {CHAT_MODES[currentMode].title}
      </Text>
      <Text style={[styles.welcomeSubtext, { color: theme.colors.onSurfaceVariant }]}>
        Choose a suggested question or ask your own
      </Text>
      <View style={styles.suggestionsContainer}>
        {CHAT_MODES[currentMode].questions.map((question, index) => (
          <SuggestedQuestion
            key={index}
            {...question}
            onPress={() => handleSend(question.text)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ModeSelector 
        currentMode={currentMode} 
        onModeChange={setCurrentMode} 
        onClearChat={handleClearChat}
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? <EmptyChat /> : messages.map((message, index) => renderMessage(message, index))}
        {isLoading && <LoadingAnimation />}
      </ScrollView>
      <View style={[styles.inputContainer, { 
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.surfaceVariant 
      }]}>
        <TextInput
          style={[styles.input, { 
            color: theme.colors.onSurface,
            backgroundColor: theme.colors.surface,
          }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          editable={!isLoading}
          multiline
          maxLength={500}
        />
        <Button
          mode="contained"
          onPress={() => handleSend()}
          style={styles.sendButton}
          disabled={isLoading}
        >
          {isLoading ? "..." : "Send"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 58,
  },
  modeSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeSelectorText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  welcomeSubtext: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  suggestionsContainer: {
    width: '100%',
    gap: 12,
  },
  suggestionCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  suggestionCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageBubble: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 20,
    maxWidth: "80%",
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  aiBubble: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sendButton: {
    justifyContent: "center",
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  modeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 