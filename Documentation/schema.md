# MAGIS Complete Database Schema

## 🗄️ **Convex Database Schema Overview**

This document provides the complete database schema for MAGIS, including all tables, indexes, relationships, and data validation rules. The schema is designed for optimal performance with Convex's reactive system and built-in vector search capabilities.

---

## 📊 **Schema Architecture**

### **Core Entities**
- **Users** - Authentication and user preferences
- **Conversations** - Chat sessions with context
- **Messages** - Individual chat messages
- **Tasks** - User task management

### **RAG Memory System**
- **Memory Chunks** - Embedded conversation pieces for semantic search
- **Memory Summaries** - Compressed long-term memories
- **Entities** - People, places, organizations for relationship tracking

### **Proactive Intelligence**
- **Experience Tracking** - Events/appointments for follow-up
- **Provider Ratings** - Personal ratings and reviews
- **User Patterns** - Learned behavioral patterns

---

## 🏗️ **Complete Schema Definition**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ==================== CORE ENTITIES ====================
  
  users: defineTable({
    // Authentication fields (from Convex Auth)
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    
    // MAGIS-specific fields
    assistantName: v.optional(v.string()), // User can name their AI
    
    // User preferences
    preferences: v.object({
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
      
      // Contact preferences
      preferredContactTimes: v.object({
        morning: v.optional(v.number()), // 9 (9 AM)
        afternoon: v.optional(v.number()), // 14 (2 PM)
        evening: v.optional(v.number()), // 18 (6 PM)
      }),
      
      // Location (optional, for local recommendations)
      location: v.optional(v.object({
        city: v.string(),
        state: v.string(),
        country: v.string(),
        timezone: v.string(),
      })),
    }),
    
    // Account metadata
    createdAt: v.number(),
    lastActiveAt: v.number(),
    onboardingCompleted: v.boolean(),
    subscriptionTier: v.string(), // 'free', 'pro', 'enterprise'
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
      experienceId: v.optional(v.id('experienceTracking')),
      
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

  // ==================== RAG MEMORY SYSTEM ====================
  
  memory_chunks: defineTable({
    userId: v.id('users'),
    conversationId: v.id('conversations'),
    
    // Content
    content: v.string(), // The actual text content
    embedding: v.array(v.number()), // 1536-dimensional vector (OpenAI)
    
    // Metadata for filtering and context
    metadata: v.object({
      type: v.union(
        v.literal('conversation'),     // Regular chat messages
        v.literal('task_completion'),  // Task achievements
        v.literal('preference_learned'), // User preference discoveries
        v.literal('context_switch'),   // Context mode changes
        v.literal('personal_info'),    // Important personal facts
        v.literal('experience_review'), // Experience follow-ups
        v.literal('goal_setting'),     // User goals and aspirations
        v.literal('relationship_info'), // Information about relationships
      ),
      
      timestamp: v.number(),
      context: v.string(), // 'work', 'personal', 'family'
      importance: v.number(), // 1-10 relevance score
      
      // Extracted information
      entities: v.array(v.string()), // People, places, organizations mentioned
      summary: v.string(), // AI-generated summary of the content
      sentiment: v.optional(v.string()), // 'positive', 'negative', 'neutral'
      
      // Relationships
      relatedMemories: v.optional(v.array(v.id('memory_chunks'))),
      
      // Processing metadata
      embeddingModel: v.string(), // 'text-embedding-3-small'
      processingVersion: v.string(), // For schema migrations
    }),
    
    // Memory lifecycle
    isCompressed: v.boolean(), // Whether this memory has been compressed
    compressionDate: v.optional(v.number()),
    retentionDate: v.optional(v.number()), // When to delete (null = keep forever)
    
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_context', ['userId', 'metadata.context'])
    .index('by_user_type', ['userId', 'metadata.type'])
    .index('by_importance', ['metadata.importance'])
    .index('by_timestamp', ['metadata.timestamp'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['userId', 'metadata.context', 'metadata.type', 'metadata.importance']
    }),

  memory_summaries: defineTable({
    userId: v.id('users'),
    
    // Time range this summary covers
    timeRange: v.object({
      start: v.number(),
      end: v.number(),
      period: v.string(), // 'week', 'month', 'quarter', 'year'
    }),
    
    // Summary content
    summary: v.string(), // Comprehensive summary text
    embedding: v.array(v.number()), // Summary embedding for search
    
    // Extracted insights
    keyInsights: v.array(v.string()), // Important discoveries/patterns
    importantEvents: v.array(v.string()), // Significant happenings
    
    // Learned preferences
    learnedPreferences: v.array(v.object({
      preference: v.string(),
      confidence: v.number(), // 0-1
      category: v.string(), // 'food', 'entertainment', 'work_style', etc.
      evidence: v.array(v.string()), // Supporting memories
    })),
    
    // Entity relationships
    entities: v.array(v.string()),
    newRelationships: v.array(v.object({
      entity1: v.string(),
      entity2: v.string(),
      relationship: v.string(),
      strength: v.number(), // 1-10
    })),
    
    // Context distribution
    contextBreakdown: v.object({
      work: v.number(), // percentage
      personal: v.number(),
      family: v.number(),
    }),
    
    // Quality metrics
    originalMemoryCount: v.number(),
    compressionRatio: v.number(), // original size / compressed size
    
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_period', ['userId', 'timeRange.period'])
    .index('by_time_range', ['timeRange.start', 'timeRange.end'])
    .vectorIndex('by_summary_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['userId', 'timeRange.period']
    }),

  entities: defineTable({
    userId: v.id('users'),
    
    // Entity identification
    name: v.string(), // "Dr. Mary Johnson", "Mom", "Project Alpha"
    type: v.union(
      v.literal('person'),
      v.literal('place'),
      v.literal('organization'),
      v.literal('project'),
      v.literal('event'),
      v.literal('product'),
      v.literal('service')
    ),
    
    // Entity details
    aliases: v.array(v.string()), // ["Mary", "the dentist", "Dr. Mary"]
    description: v.optional(v.string()),
    
    // Context and usage
    primaryContext: v.string(), // 'work', 'personal', 'family'
    contexts: v.array(v.string()), // All contexts where mentioned
    
    // Relationship tracking
    relationships: v.array(v.object({
      relatedEntity: v.string(),
      relationship: v.string(), // "works at", "married to", "part of"
      strength: v.number(), // 1-10 relationship strength
      context: v.string(),
    })),
    
    // User preferences about this entity
    preferences: v.array(v.object({
      preference: v.string(),
      sentiment: v.string(), // 'positive', 'negative', 'neutral'
      confidence: v.number(), // 0-1
      evidence: v.array(v.string()), // Supporting memories
    })),
    
    // Usage statistics
    mentionCount: v.number(),
    lastMentioned: v.number(),
    firstMentioned: v.number(),
    importance: v.number(), // 1-10 calculated importance
    
    // External data
    externalData: v.optional(v.object({
      website: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      rating: v.optional(v.number()),
      priceRange: v.optional(v.string()),
    })),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_name', ['userId', 'name'])
    .index('by_user_type', ['userId', 'type'])
    .index('by_importance', ['userId', 'importance'])
    .index('by_last_mentioned', ['lastMentioned'])
    .index('by_context', ['userId', 'primaryContext']),

  // ==================== PROACTIVE INTELLIGENCE ====================
  
  experienceTracking: defineTable({
    userId: v.id('users'),
    
    // Experience identification
    type: v.string(), // 'dentist_appointment', 'restaurant', 'concert', etc.
    title: v.string(),
    description: v.optional(v.string()),
    
    // Provider/venue information
    provider: v.optional(v.string()), // "Dr. Mary Johnson", "Tony's Pizza"
    location: v.optional(v.string()),
    
    // Timing
    scheduledTime: v.number(),
    completedTime: v.optional(v.number()),
    duration: v.optional(v.number()), // minutes
    
    // Experience status
    status: v.union(
      v.literal('scheduled'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('no_show')
    ),
    
    // Follow-up tracking
    followUpScheduled: v.optional(v.number()),
    followUpCompleted: v.optional(v.boolean()),
    followUpAttempts: v.number(),
    
    // Context
    context: v.string(), // 'work', 'personal', 'family'
    
    // Natural review from conversation
    naturalReview: v.optional(v.object({
      conversationId: v.id('conversations'),
      userResponse: v.string(), // User's natural response
      
      extractedInsights: v.object({
        overallSentiment: v.string(), // 'positive', 'negative', 'neutral', 'mixed'
        emotionalTone: v.string(), // 'excited', 'satisfied', 'disappointed', etc.
        rating: v.optional(v.number()), // 1-5 if naturally mentioned
        recommendation: v.optional(v.boolean()), // Would recommend?
        
        highlights: v.array(v.string()), // What they liked
        issues: v.array(v.string()), // What they didn't like
        specificFeedback: v.array(v.string()), // Detailed comments
        
        valueDrivers: v.array(v.string()), // What they cared most about
        surpriseFactors: v.array(v.string()), // Unexpected elements
        comparisonMentions: v.array(v.string()), // Comparisons to other experiences
        futureIntent: v.string(), // 'will_return', 'avoid', 'unsure', 'conditional'
        
        keyQuotes: v.array(v.string()), // Memorable quotes
      }),
      
      generatedReview: v.string(), // AI-generated review summary
      timestamp: v.number(),
      
      // Follow-up conversation
      followUpConversation: v.optional(v.array(v.object({
        question: v.string(),
        answer: v.string(),
        timestamp: v.number(),
      }))),
    })),
    
    // Provider/service metadata
    providerInfo: v.optional(v.object({
      name: v.string(),
      type: v.string(), // 'restaurant', 'medical', 'service', etc.
      location: v.string(),
      contact: v.optional(v.object({
        phone: v.string(),
        website: v.string(),
        email: v.string(),
      })),
      publicRating: v.optional(v.object({
        averageRating: v.number(),
        reviewCount: v.number(),
        source: v.string(), // 'google', 'yelp', etc.
      })),
      priceRange: v.optional(v.string()), // '$', '$$', '$$$', '$$$$'
    })),
    
    // External integration
    calendarEventId: v.optional(v.string()),
    externalBookingId: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_follow_up_time', ['followUpScheduled'])
    .index('by_provider', ['provider'])
    .index('by_type', ['type'])
    .index('by_scheduled_time', ['scheduledTime']),

  providerRatings: defineTable({
    userId: v.id('users'),
    
    // Provider identification
    providerName: v.string(),
    providerType: v.string(), // 'restaurant', 'dentist', 'hair_salon', etc.
    
    // User's personal rating
    personalRating: v.number(), // 1-5
    recommendation: v.boolean(),
    
    // Aggregated insights from multiple experiences
    insights: v.object({
      highlights: v.array(v.string()),
      issues: v.array(v.string()),
      valueAlignment: v.array(v.string()), // What user values that this provider delivers
    }),
    
    // Experience history
    experienceCount: v.number(),
    experienceIds: v.array(v.id('experienceTracking')),
    firstExperience: v.number(),
    lastExperience: v.number(),
    
    // Context usage
    contexts: v.array(v.string()), // Which contexts this provider is relevant for
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_provider', ['userId', 'providerName'])
    .index('by_user_type', ['userId', 'providerType'])
    .index('by_rating', ['personalRating']),

  userPatterns: defineTable({
    userId: v.id('users'),
    
    // Pattern identification
    patternType: v.string(), // 'stress_response', 'communication_style', 'decision_making', etc.
    patternName: v.string(),
    description: v.string(),
    
    // Pattern data
    triggers: v.array(v.string()),
    indicators: v.array(v.string()),
    outcomes: v.array(v.string()),
    
    // Pattern strength
    confidence: v.number(), // 0-1
    evidenceCount: v.number(),
    
    // Context relevance
    contexts: v.array(v.string()),
    
    // Temporal patterns
    timePatterns: v.optional(v.object({
      dayOfWeek: v.optional(v.array(v.number())), // 0-6 (Sunday-Saturday)
      timeOfDay: v.optional(v.array(v.number())), // 0-23 (hours)
      monthlyPattern: v.optional(v.array(v.number())), // 1-12
      seasonalPattern: v.optional(v.array(v.string())), // 'spring', 'summer', etc.
    })),
    
    // Actionable insights
    recommendations: v.array(v.string()),
    preventativeActions: v.array(v.string()),
    
    // Pattern lifecycle
    firstObserved: v.number(),
    lastObserved: v.number(),
    isActive: v.boolean(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_type', ['userId', 'patternType'])
    .index('by_confidence', ['confidence'])
    .index('by_active', ['isActive']),

  // ==================== EXTERNAL INTEGRATIONS ====================
  
  externalIntegrations: defineTable({
    userId: v.id('users'),
    
    // Integration details
    service: v.string(), // 'google_calendar', 'spotify', 'zapier', etc.
    serviceName: v.string(), // Display name
    
    // Connection status
    status: v.union(
      v.literal('connected'),
      v.literal('disconnected'),
      v.literal('error'),
      v.literal('expired')
    ),
    
    // Authentication
    accessToken: v.optional(v.string()), // Encrypted
    refreshToken: v.optional(v.string()), // Encrypted
    expiresAt: v.optional(v.number()),
    
    // Integration configuration
    settings: v.object({
      enabled: v.boolean(),
      permissions: v.array(v.string()),
      syncFrequency: v.string(), // 'real_time', 'hourly', 'daily'
      dataTypes: v.array(v.string()), // What data to sync
    }),
    
    // Usage statistics
    lastSyncAt: v.optional(v.number()),
    syncCount: v.number(),
    errorCount: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_service', ['service'])
    .index('by_status', ['status']),

  // ==================== SYSTEM TABLES ====================
  
  systemMetrics: defineTable({
    // Metric identification
    metricType: v.string(), // 'performance', 'usage', 'error', 'cost'
    metricName: v.string(),
    
    // Metric data
    value: v.number(),
    unit: v.string(),
    
    // Dimensions
    dimensions: v.object({
      userId: v.optional(v.id('users')),
      feature: v.optional(v.string()),
      provider: v.optional(v.string()),
      context: v.optional(v.string()),
    }),
    
    timestamp: v.number(),
  })
    .index('by_type', ['metricType'])
    .index('by_timestamp', ['timestamp'])
    .index('by_user', ['dimensions.userId']),

  apiUsage: defineTable({
    userId: v.id('users'),
    
    // API call details
    provider: v.string(), // 'openai', 'anthropic', 'elevenlabs'
    endpoint: v.string(), // 'chat/completions', 'embeddings', etc.
    model: v.string(),
    
    // Usage metrics
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    cost: v.number(), // USD
    
    // Request context
    feature: v.string(), // 'chat', 'memory', 'proactive', etc.
    context: v.string(), // 'work', 'personal', 'family'
    
    // Performance
    latency: v.number(), // milliseconds
    success: v.boolean(),
    errorCode: v.optional(v.string()),
    
    timestamp: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_provider', ['provider'])
    .index('by_timestamp', ['timestamp'])
    .index('by_user_month', ['userId', 'timestamp']),
});
```

---

## 🔍 **Key Schema Features**

### **1. Vector Search Optimization**
- Primary embedding index on `memory_chunks` with filtering capabilities
- Summary embeddings for compressed memories
- Optimized for semantic search across user's personal data

### **2. Real-time Performance**
- Indexed for common query patterns
- Optimized for Convex's reactive queries
- Efficient filtering and sorting capabilities

### **3. Privacy & Data Control**
- User-scoped data with consistent `userId` fields
- Configurable data retention periods
- Granular privacy controls in user preferences

### **4. Cross-Context Intelligence**
- Context tagging throughout (`work`, `personal`, `family`)
- Entity relationship tracking across contexts
- Pattern recognition for cross-context learning

### **5. Comprehensive Metadata**
- Rich metadata for AI training and improvement
- Usage tracking for optimization
- Performance metrics for monitoring

---

## 📊 **Data Relationships**

### **Core Data Flow**
```
Users → Conversations → Messages → Memory Chunks → Embeddings
  ↓         ↓            ↓            ↓
Tasks → Experiences → Reviews → Provider Ratings
  ↓         ↓            ↓
Entities ← Patterns ← Summaries
```

### **RAG Memory Pipeline**
```
Message → Entity Extraction → Embedding Generation → Vector Storage → Semantic Search
    ↓           ↓                   ↓                    ↓              ↓
  Summary → Relationships → Memory Chunk → Search Index → AI Context
```

### **Proactive Intelligence Flow**
```
Experience → Follow-up Schedule → Natural Conversation → Insight Extraction → Learning
     ↓             ↓                      ↓                   ↓             ↓
Provider → Timing Optimization → Response Generation → Pattern Updates → Future Recommendations
```

This schema provides the foundation for MAGIS to deliver sophisticated personal intelligence while maintaining excellent performance and user privacy! 🗄️✨