"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Send, LogOut, MessageSquare, Plus, Volume2, VolumeX } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "ai/react";
import { VoiceInput } from "./VoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

// Simple markdown renderer
function renderMarkdown(text: string) {
  if (!text) return text;
  
  // Convert markdown to HTML string
  const htmlString = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
    .replace(/\n/g, '<br>');
  
  // Return as JSX with dangerouslySetInnerHTML
  return <span dangerouslySetInnerHTML={{ __html: htmlString }} />;
}

export function ChatInterface() {
  const { signOut } = useAuthActions();
  const [currentConversationId, setCurrentConversationId] = useState<Id<"conversations"> | null>(null);
  const [currentContext, setCurrentContext] = useState<'work' | 'personal' | 'family'>('personal');
  const [aiProvider, setAiProvider] = useState<'openai' | 'claude'>('openai');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('auto');
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [lastInputUpdate, setLastInputUpdate] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Text-to-Speech hook
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
  });

  // AI Chat hook
  const { messages: aiMessages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      context: currentContext,
      aiProvider: aiProvider,
    },
    onMessage: async (message) => {
      // User messages are now saved manually in handleSendMessage
      // Only log for debugging
      console.log('onMessage called with:', message);
    },
    onFinish: async (message) => {
      // Save AI response to Convex after streaming is complete
      if (currentConversationId) {
        await addMessage({
          conversationId: currentConversationId,
          content: message.content,
          role: "assistant",
          metadata: {
            provider: aiProvider,
            model: aiProvider === 'claude' ? 'claude-3-sonnet' : 'gpt-4-turbo',
            processingTime: Date.now(),
          },
        });
      }
      
      // Speak the response if voice is enabled
      if (voiceEnabled && message.content) {
        speak(message.content);
      }
    },
  });

  // Queries
  const conversations = useQuery(api.conversations.list, { limit: 10 });
  const messages = useQuery(
    api.conversations.getMessages,
    currentConversationId ? { conversationId: currentConversationId } : "skip"
  );

  // Debug logging
  useEffect(() => {
    console.log('Convex messages:', messages);
    console.log('AI messages:', aiMessages);
  }, [messages, aiMessages]);

  // Mutations
  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.conversations.addMessage);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiMessages, isLoading]);

  // Create initial conversation if none exists
  useEffect(() => {
    if (conversations && conversations.length === 0 && !currentConversationId) {
      handleNewConversation();
    } else if (conversations && conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0]._id);
    }
  }, [conversations, currentConversationId]);

  const handleNewConversation = async () => {
    try {
      const conversationId = await createConversation({
        title: "New Conversation",
        context: "personal",
      });
      setCurrentConversationId(conversationId);
      toast.success("New conversation started!");
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to start new conversation");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentConversationId || isLoading) return;
    
    const userMessage = input.trim();
    
    try {
      // Save user message to Convex FIRST, before AI call
      await addMessage({
        conversationId: currentConversationId,
        content: userMessage,
        role: "user",
        metadata: {
          inputMethod: "text",
        },
      });
      
      // Then let useChat handle the AI submission
      handleSubmit(e);
      toast.success("Message sent!");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    console.log('📝 handleVoiceTranscript called with:', transcript);
    // Update the input field with the transcript
    handleInputChange({ target: { value: transcript } } as React.ChangeEvent<HTMLInputElement>);
    setLastInputUpdate(Date.now());
    
    // Set up fallback auto-send in case onVoiceEnd doesn't trigger
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
    }
    
    autoSendTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Fallback auto-send timeout triggered');
      if (input.trim() && !isAutoSending) {
        console.log('⏰ Executing fallback auto-send...');
        handleVoiceEnd();
      }
    }, 3000); // 3 second fallback
  };

  const handleInterimTranscript = (interimText: string) => {
    // Update input field with interim results for real-time feedback
    handleInputChange({ target: { value: interimText } } as React.ChangeEvent<HTMLInputElement>);
    setLastInputUpdate(Date.now());
  };

  const handleVoiceEnd = async () => {
    // Clear fallback timeout
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }
    
    // Prevent multiple simultaneous auto-sends
    if (isAutoSending) {
      console.log('🚫 Auto-send already in progress, skipping');
      return;
    }
    
    console.log('🎤 handleVoiceEnd triggered');
    setIsAutoSending(true);
    
    try {
      // Single attempt with reasonable delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('🎤 Checking input value:', input, 'conversationId:', currentConversationId);
      
      if (input.trim() && currentConversationId) {
        console.log('✅ Auto-sending voice message...');
        
        const userMessage = input.trim();
        
        // Clear input FIRST to prevent re-processing
        handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
        
        // Save user message to Convex
        console.log('💾 Saving to Convex...');
        await addMessage({
          conversationId: currentConversationId,
          content: userMessage,
          role: "user",
          metadata: {
            inputMethod: "voice",
          },
        });
        console.log('✅ Saved to Convex');
        
        // Trigger AI response using useChat directly
        console.log('📤 Triggering AI response...');
        
        // Create proper event for useChat
        const mockEvent = {
          preventDefault: () => {},
          currentTarget: {
            elements: {
              message: { value: userMessage }
            }
          }
        } as any;
        
        // Call useChat handleSubmit
        handleSubmit(mockEvent);
        
        console.log('✅ Voice message auto-sent successfully!');
        toast.success("Voice message sent!");
        
      } else {
        console.log('⏭️ No input or no conversation to send');
      }
    } catch (error) {
      console.error('❌ Auto-send failed:', error);
      toast.error('Failed to send voice message');
    } finally {
      // Always reset the flag
      setIsAutoSending(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isSpeaking) {
      stop();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            <span className="text-magis-600">MAGIS</span>
          </h1>
          <p className="text-sm text-gray-500">Personal AI Assistant</p>
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-magis-600 text-white rounded-lg hover:bg-magis-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations?.map((conversation) => (
            <button
              key={conversation._id}
              onClick={() => setCurrentConversationId(conversation._id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentConversationId === conversation._id
                  ? "bg-magis-50 border border-magis-200 text-magis-900"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{conversation.title}</p>
                  {conversation.lastMessagePreview && (
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessagePreview}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {conversation.context} • {conversation.messageCount} messages
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* User Actions */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {conversations?.find(c => c._id === currentConversationId)?.title || "Select a conversation"}
              </h2>
              <p className="text-sm text-gray-500">
                {currentContext.charAt(0).toUpperCase() + currentContext.slice(1)} context • {aiProvider.toUpperCase()} • Real-time conversation
              </p>
            </div>
            
            {/* Context & Provider Controls */}
            <div className="flex items-center gap-4">
              {/* Context Switcher */}
              <select
                value={currentContext}
                onChange={(e) => setCurrentContext(e.target.value as 'work' | 'personal' | 'family')}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
              >
                <option value="personal">🏠 Personal</option>
                <option value="work">💼 Work</option>
                <option value="family">👨‍👩‍👧‍👦 Family</option>
              </select>
              
              {/* AI Provider Switcher */}
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as 'openai' | 'claude')}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
              >
                <option value="openai">🤖 GPT-4</option>
                <option value="claude">🧠 Claude</option>
              </select>
              
              {/* Voice Controls */}
              <div className="flex items-center gap-2">
                {/* Voice Language Selector */}
                <select
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value)}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                  title="Voice input language"
                >
                  <option value="auto">🌐 Auto</option>
                  <option value="pt-BR">🇧🇷 Português</option>
                  <option value="en-US">🇺🇸 English</option>
                  <option value="es-ES">🇪🇸 Español</option>
                  <option value="fr-FR">🇫🇷 Français</option>
                  <option value="de-DE">🇩🇪 Deutsch</option>
                </select>
                
                <button
                  onClick={handleVoiceToggle}
                  className={`p-2 rounded-lg transition-colors ${
                    voiceEnabled 
                      ? 'bg-magis-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                
                {isSpeaking && (
                  <div className="flex items-center gap-1 text-sm text-magis-500">
                    <div className="w-2 h-2 bg-magis-500 rounded-full animate-pulse"></div>
                    Speaking...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Show Convex messages - Removed animations to prevent flashing */}
          {messages?.map((msg, index) => (
              <div
                key={msg._id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-magis-600 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                    {msg.metadata.provider && ` • ${msg.metadata.provider}`}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Show streaming AI response only if not already saved to Convex */}
            {isLoading && aiMessages.length > 0 && (
              (() => {
                const lastMessage = aiMessages[aiMessages.length - 1];
                
                // Only show if it's an assistant message (AI response)
                if (lastMessage?.role === 'assistant') {
                  // Check if this message content is similar to any recent Convex message
                  const isDuplicate = messages?.some(msg => 
                    msg.role === 'assistant' && 
                    msg.content.trim() === lastMessage.content.trim()
                  );
                  
                  // Don't show streaming bubble if message is already in Convex
                  if (isDuplicate) {
                    console.log('🚫 Streaming message already exists in Convex, hiding bubble');
                    return null;
                  }
                  
                  return (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-900 max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg">
                        <div className="whitespace-pre-wrap">{renderMarkdown(lastMessage.content)}</div>
                        <p className="text-xs opacity-70 mt-2">
                          MAGIS is responding...
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()
            )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message to MAGIS..."
                disabled={isLoading || !currentConversationId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            {/* Voice Input */}
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              onInterimTranscript={handleInterimTranscript}
              onVoiceStart={() => {
                if (isSpeaking) {
                  stop();
                }
              }}
              onVoiceEnd={handleVoiceEnd}
              isDisabled={isLoading || !currentConversationId}
              language={voiceLanguage}
              autoSend={true}
              className="flex-shrink-0"
            />
            
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !currentConversationId}
              className="px-4 py-2 bg-magis-600 text-white rounded-lg hover:bg-magis-700 focus:ring-2 focus:ring-magis-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}