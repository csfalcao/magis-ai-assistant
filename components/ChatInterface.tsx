"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Send, LogOut, MessageSquare, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export function ChatInterface() {
  const { signOut } = useAuthActions();
  const [currentConversationId, setCurrentConversationId] = useState<Id<"conversations"> | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const conversations = useQuery(api.conversations.list, { limit: 10 });
  const messages = useQuery(
    api.conversations.getMessages,
    currentConversationId ? { conversationId: currentConversationId } : "skip"
  );

  // Mutations
  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.conversations.addMessage);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (!message.trim() || !currentConversationId || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      // Add user message
      await addMessage({
        conversationId: currentConversationId,
        content: userMessage,
        role: "user",
        metadata: {
          inputMethod: "text",
        },
      });

      // Simple AI response (we'll enhance this later)
      const aiResponse = `Thank you for your message: "${userMessage}". I'm MAGIS, your personal AI assistant! I'm currently in development mode, but I can already help you with basic conversations. Soon I'll have full RAG memory, proactive intelligence, and voice capabilities!`;

      // Add AI response
      await addMessage({
        conversationId: currentConversationId,
        content: aiResponse,
        role: "assistant",
        metadata: {
          provider: "openai",
          model: "gpt-4-turbo",
          processingTime: 1000,
        },
      });

      toast.success("Message sent!");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="font-semibold text-gray-900">
            {conversations?.find(c => c._id === currentConversationId)?.title || "Select a conversation"}
          </h2>
          <p className="text-sm text-gray-500">
            Personal context • Real-time conversation
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages?.map((msg, index) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-magis-600 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                    {msg.metadata.provider && ` • ${msg.metadata.provider}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-200 text-gray-900 max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">MAGIS is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to MAGIS..."
              disabled={isLoading || !currentConversationId}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim() || !currentConversationId}
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