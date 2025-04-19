import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { Button, Text, Surface, useTheme } from "react-native-paper";
import { generateResponse } from '../services/aiService';

interface Message {
  text: string;
  isUser: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim() === "") return;

    const userMessage: Message = { text: inputText, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await generateResponse(inputText);
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

  const renderMessage = (message: Message, index: number) => {
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
          {message.text}
        </Text>
      </Surface>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeText, { color: theme.colors.primary }]}>
              Welcome to AI Chatbot!
            </Text>
            <Text style={[styles.welcomeSubtext, { color: theme.colors.onSurfaceVariant }]}>
              Start a conversation by typing a message below.
            </Text>
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
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
          onPress={handleSend}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
});
