import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Convex Auth tables
  ...authTables,
  // ==================== CORE ENTITIES ====================
  
  users: defineTable({
    // Authentication fields (from Convex Auth)
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    
    // MAGIS-specific fields
    assistantName: v.optional(v.string()), // User can name their AI
    
    // User preferences - all optional with defaults set by functions
    preferences: v.optional(v.object({
      // AI behavior
      defaultContext: v.string(), // 'work', 'personal', 'family'
      aiProvider: v.string(), // 'openai', 'claude'
      responseStyle: v.string(), // 'concise', 'detailed', 'casual'
      
      // Voice settings
      voiceEnabled: v.boolean(),
      voiceProvider: v.string(), // 'browser', 'elevenlabs'
      voiceSpeed: v.number(), // 0.5 - 2.0
      
      // Notifications
      notifications: v.object({
        pushNotifications: v.boolean(),
        emailFollowUps: v.boolean(),
        proactiveMessages: v.boolean(),
        quietHours: v.object({
          enabled: v.boolean(),
          start: v.string(), // "22:00"
          end: v.string(), // "08:00"
        }),
      }),
      
      // Privacy settings
      privacy: v.object({
        shareDataForImprovement: v.boolean(),
        longTermMemory: v.boolean(),
        crossContextLearning: v.boolean(),
        dataRetentionDays: v.number(), // 0 = forever
      }),
      
      // UI preferences
      theme: v.string(), // 'light', 'dark', 'system'
      language: v.string(), // 'en', 'pt', 'es', etc.
      timezone: v.string(), // 'America/New_York'
    })),
    
    // Account metadata - make optional to work with Convex Auth
    createdAt: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
    onboardingCompleted: v.optional(v.boolean()),
    subscriptionTier: v.optional(v.string()), // 'free', 'pro', 'enterprise'
  })
    .index('by_email', ['email'])
    .index('by_last_active', ['lastActiveAt']),

  // ==================== CONVERSATIONS & MESSAGES ====================
  
  conversations: defineTable({
    userId: v.id('users'),
    title: v.string(),
    context: v.string(), // 'work', 'personal', 'family'
    
    // Conversation metadata
    messageCount: v.number(),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
    
    // Conversation state
    isArchived: v.boolean(),
    isPinned: v.boolean(),
    
    // AI settings for this conversation
    settings: v.optional(v.object({
      aiProvider: v.string(),
      systemPrompt: v.optional(v.string()),
      temperature: v.optional(v.number()),
    })),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_context', ['userId', 'context'])
    .index('by_user_updated', ['userId', 'updatedAt'])
    .index('by_last_message', ['lastMessageAt']),

  messages: defineTable({
    conversationId: v.id('conversations'),
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')), 
    
    // Message metadata
    metadata: v.object({
      // AI response metadata
      provider: v.optional(v.string()), // 'openai', 'claude', 'user'
      model: v.optional(v.string()), // 'gpt-4-turbo', 'claude-3-sonnet'
      usage: v.optional(v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
        cost: v.optional(v.number()), // USD cost
      })),
      
      // Input method
      inputMethod: v.optional(v.string()), // 'text', 'voice', 'proactive'
      voiceTranscription: v.optional(v.object({
        confidence: v.number(),
        originalAudio: v.optional(v.string()), // file ID
      })),
      
      // Message processing
      processingTime: v.optional(v.number()), // milliseconds
      toolsUsed: v.optional(v.array(v.string())),
      
      // Proactive message metadata
      proactiveType: v.optional(v.string()), // 'follow_up', 'reminder', 'check_in'
      experienceId: v.optional(v.string()), // Will be v.id('experienceTracking') later
      
      // Quality metrics
      userRating: v.optional(v.number()), // 1-5 user rating
      regenerated: v.optional(v.boolean()),
    }),
    
    // Message state
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
    
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_conversation_time', ['conversationId', 'createdAt'])
    .index('by_user_messages', ['conversationId', 'role'])
    .index('by_proactive_type', ['metadata.proactiveType']),

  // ==================== TASK MANAGEMENT ====================
  
  tasks: defineTable({
    userId: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    
    // Task status
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    
    // Task properties
    priority: v.union(
      v.literal('low'),
      v.literal('medium'), 
      v.literal('high'),
      v.literal('urgent')
    ),
    context: v.string(), // 'work', 'personal', 'family'
    
    // Scheduling
    dueDate: v.optional(v.number()),
    scheduledDate: v.optional(v.number()),
    estimatedDuration: v.optional(v.number()), // minutes
    
    // Task metadata
    createdFrom: v.optional(v.string()), // 'conversation', 'manual', 'zapier', 'calendar'
    tags: v.array(v.string()),
    
    // Recurrence
    recurrence: v.optional(v.object({
      type: v.string(), // 'daily', 'weekly', 'monthly', 'yearly'
      interval: v.number(), // every N days/weeks/months
      endDate: v.optional(v.number()),
    })),
    
    // External integration
    externalId: v.optional(v.string()), // ID in external system
    externalSource: v.optional(v.string()), // 'google_calendar', 'todoist', etc.
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_context', ['userId', 'context'])
    .index('by_user_completed', ['userId', 'completed'])
    .index('by_due_date', ['dueDate'])
    .index('by_priority', ['priority'])
    .index('by_external', ['externalSource', 'externalId']),
});