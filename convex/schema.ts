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
    
    // ==================== STRUCTURED PROFILE SYSTEM ====================
    
    // Personal Information
    personalInfo: v.optional(v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      nickname: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()), // timestamp
      location: v.optional(v.object({
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })),
      contactInfo: v.optional(v.object({
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        emergencyContact: v.optional(v.object({
          name: v.string(),
          phone: v.string(),
          relationship: v.string(),
        })),
      })),
      healthInfo: v.optional(v.object({
        allergies: v.optional(v.array(v.string())),
        medications: v.optional(v.array(v.string())),
        medicalConditions: v.optional(v.array(v.string())),
        preferredPharmacy: v.optional(v.string()),
        insuranceProvider: v.optional(v.string()),
      })),
    })),
    
    // Work Context Information
    workInfo: v.optional(v.object({
      employment: v.optional(v.object({
        status: v.optional(v.string()), // 'employed', 'self_employed', 'entrepreneur', 'student', 'retired', 'unemployed'
        type: v.optional(v.string()), // 'full_time', 'part_time', 'contract', 'freelance'
        company: v.optional(v.string()),
        position: v.optional(v.string()),
        department: v.optional(v.string()),
        startDate: v.optional(v.number()),
        industry: v.optional(v.string()),
      })),
      workSchedule: v.optional(v.object({
        regularHours: v.optional(v.object({
          monday: v.optional(v.object({ start: v.string(), end: v.string() })),
          tuesday: v.optional(v.object({ start: v.string(), end: v.string() })),
          wednesday: v.optional(v.object({ start: v.string(), end: v.string() })),
          thursday: v.optional(v.object({ start: v.string(), end: v.string() })),
          friday: v.optional(v.object({ start: v.string(), end: v.string() })),
          saturday: v.optional(v.object({ start: v.string(), end: v.string() })),
          sunday: v.optional(v.object({ start: v.string(), end: v.string() })),
        })),
        flexibleSchedule: v.optional(v.boolean()),
        remoteWork: v.optional(v.string()), // 'always', 'hybrid', 'never'
        timeOffBalance: v.optional(v.number()),
      })),
      workLocation: v.optional(v.object({
        office: v.optional(v.string()),
        remoteAddress: v.optional(v.string()),
        commute: v.optional(v.object({
          method: v.optional(v.string()), // 'car', 'public_transport', 'walk', 'bike'
          duration: v.optional(v.number()), // minutes
        })),
      })),
      workContacts: v.optional(v.array(v.object({
        name: v.string(),
        role: v.string(),
        relationship: v.string(), // 'manager', 'colleague', 'direct_report', 'client'
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
      }))),
    })),
    
    // Family Context Information
    familyInfo: v.optional(v.object({
      relationshipStatus: v.optional(v.string()), // 'single', 'dating', 'married', 'divorced', 'widowed'
      spouse: v.optional(v.object({
        name: v.string(),
        nickname: v.optional(v.string()),
        dateOfBirth: v.optional(v.number()),
        occupation: v.optional(v.string()),
        workSchedule: v.optional(v.string()),
        phone: v.optional(v.string()),
        preferences: v.optional(v.array(v.string())),
      })),
      children: v.optional(v.array(v.object({
        name: v.string(),
        nickname: v.optional(v.string()),
        dateOfBirth: v.optional(v.number()),
        grade: v.optional(v.string()),
        school: v.optional(v.string()),
        activities: v.optional(v.array(v.string())),
        allergies: v.optional(v.array(v.string())),
        preferences: v.optional(v.array(v.string())),
        medicalInfo: v.optional(v.object({
          pediatrician: v.optional(v.string()),
          allergies: v.optional(v.array(v.string())),
          medications: v.optional(v.array(v.string())),
        })),
      }))),
      pets: v.optional(v.array(v.object({
        name: v.string(),
        type: v.string(), // 'dog', 'cat', 'bird', 'fish', 'other'
        breed: v.optional(v.string()),
        dateOfBirth: v.optional(v.number()),
        veterinarian: v.optional(v.string()),
        medications: v.optional(v.array(v.string())),
        preferences: v.optional(v.array(v.string())),
      }))),
      extendedFamily: v.optional(v.array(v.object({
        name: v.string(),
        relationship: v.string(), // 'parent', 'sibling', 'grandparent', 'aunt', 'uncle', 'cousin'
        phone: v.optional(v.string()),
        location: v.optional(v.string()),
        birthday: v.optional(v.number()),
        notes: v.optional(v.string()),
      }))),
      household: v.optional(v.object({
        address: v.optional(v.string()),
        type: v.optional(v.string()), // 'house', 'apartment', 'condo'
        residents: v.optional(v.array(v.string())),
        emergencyContacts: v.optional(v.array(v.object({
          name: v.string(),
          phone: v.string(),
          relationship: v.string(),
        }))),
      })),
    })),
    
    // Personal Preferences and Lifestyle
    personalPreferences: v.optional(v.object({
      lifestyle: v.optional(v.object({
        diet: v.optional(v.string()), // 'omnivore', 'vegetarian', 'vegan', 'keto', 'mediterranean'
        allergies: v.optional(v.array(v.string())),
        hobbies: v.optional(v.array(v.string())),
        interests: v.optional(v.array(v.string())),
        fitnessGoals: v.optional(v.array(v.string())),
        sleepSchedule: v.optional(v.object({
          bedtime: v.optional(v.string()),
          wakeTime: v.optional(v.string()),
          sleepDuration: v.optional(v.number()), // hours
        })),
      })),
      communication: v.optional(v.object({
        preferredStyle: v.optional(v.string()), // 'formal', 'casual', 'friendly', 'professional'
        responseLength: v.optional(v.string()), // 'brief', 'moderate', 'detailed'
        humor: v.optional(v.boolean()),
        directness: v.optional(v.string()), // 'very_direct', 'moderately_direct', 'gentle'
      })),
      scheduling: v.optional(v.object({
        preferredMeetingTimes: v.optional(v.array(v.string())),
        bufferTime: v.optional(v.number()), // minutes between meetings
        maxDailyMeetings: v.optional(v.number()),
        preferredDays: v.optional(v.array(v.string())),
        blockedTimes: v.optional(v.array(v.object({
          day: v.string(),
          startTime: v.string(),
          endTime: v.string(),
          reason: v.string(),
        }))),
      })),
    })),
    
    // Service Providers and Important Contacts
    serviceProviders: v.optional(v.object({
      healthcare: v.optional(v.array(v.object({
        type: v.string(), // 'primary_care', 'dentist', 'ophthalmologist', 'dermatologist', 'specialist'
        name: v.string(),
        practice: v.optional(v.string()),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        notes: v.optional(v.string()),
        lastVisit: v.optional(v.number()),
        nextAppointment: v.optional(v.number()),
      }))),
      automotive: v.optional(v.array(v.object({
        type: v.string(), // 'mechanic', 'dealership', 'insurance'
        name: v.string(),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        vehicles: v.optional(v.array(v.string())), // which vehicles they service
      }))),
      home: v.optional(v.array(v.object({
        type: v.string(), // 'plumber', 'electrician', 'hvac', 'handyman', 'cleaner'
        name: v.string(),
        phone: v.optional(v.string()),
        notes: v.optional(v.string()),
        lastService: v.optional(v.number()),
      }))),
      financial: v.optional(v.array(v.object({
        type: v.string(), // 'bank', 'accountant', 'financial_advisor', 'insurance'
        name: v.string(),
        phone: v.optional(v.string()),
        accountNumbers: v.optional(v.array(v.string())), // encrypted/hashed
        notes: v.optional(v.string()),
      }))),
    })),
    
    // Profile Completion Status
    profileCompletion: v.optional(v.object({
      personalInfo: v.optional(v.number()), // 0-100% completion
      workInfo: v.optional(v.number()),
      familyInfo: v.optional(v.number()),
      preferences: v.optional(v.number()),
      serviceProviders: v.optional(v.number()),
      overall: v.optional(v.number()),
      lastUpdated: v.optional(v.number()),
    })),
    
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

  // ==================== RAG MEMORY SYSTEM ====================
  
  memories: defineTable({
    userId: v.id('users'),
    
    // Memory content
    content: v.string(), // The actual text content to search
    summary: v.optional(v.string()), // AI-generated summary for better retrieval
    
    // Source information
    sourceType: v.string(), // 'message', 'conversation', 'experience', 'preference'
    sourceId: v.string(), // ID of the source (conversation ID, message ID, etc.)
    context: v.string(), // 'work', 'personal', 'family'
    
    // Memory categorization
    memoryType: v.string(), // 'fact', 'preference', 'experience', 'skill', 'relationship'
    importance: v.number(), // 1-10 importance score
    
    // Vector embedding for semantic search
    embedding: v.array(v.number()), // OpenAI ada-002 embeddings (1536 dimensions)
    
    // Memory metadata
    entities: v.optional(v.array(v.string())), // Extracted entities (people, places, things)
    keywords: v.optional(v.array(v.string())), // Extracted keywords
    sentiment: v.optional(v.number()), // -1 to 1 sentiment score
    
    // Usage tracking
    accessCount: v.number(), // How many times this memory was retrieved
    lastAccessedAt: v.optional(v.number()),
    
    // Memory lifecycle
    isActive: v.boolean(), // Active memories are included in search
    expiresAt: v.optional(v.number()), // Optional expiration for temporary memories
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_context', ['userId', 'context'])
    .index('by_user_type', ['userId', 'memoryType'])
    .index('by_source', ['sourceType', 'sourceId'])
    .index('by_importance', ['userId', 'importance'])
    .index('by_active', ['userId', 'isActive']),
    // Vector index will be added when Convex supports it
    // .vectorIndex('by_embedding', {
    //   vectorField: 'embedding',
    //   dimensions: 1536, // OpenAI ada-002 embedding size
    //   filterFields: ['userId', 'context', 'memoryType', 'isActive']
    // }),

  // Memory relationships - links between different memories
  memoryConnections: defineTable({
    userId: v.id('users'),
    fromMemoryId: v.id('memories'),
    toMemoryId: v.id('memories'),
    
    // Connection type and strength
    connectionType: v.string(), // 'similar', 'contradicts', 'updates', 'related_to'
    strength: v.number(), // 0-1 connection strength
    
    // Automatic vs manual connections
    isAutomatic: v.boolean(),
    confidence: v.optional(v.number()), // AI confidence in this connection
    
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_from_memory', ['fromMemoryId'])
    .index('by_to_memory', ['toMemoryId'])
    .index('by_connection_type', ['connectionType']),

  // Experience tracking for proactive conversations
  experiences: defineTable({
    userId: v.id('users'),
    
    // Experience content
    title: v.string(), // "Dentist appointment", "Dinner at Luigi's"
    description: v.optional(v.string()),
    context: v.string(), // 'work', 'personal', 'family'
    
    // Experience timeline
    scheduledTimeframe: v.optional(v.string()), // "next month", "tomorrow", etc.
    scheduledAt: v.optional(v.number()), // When it was scheduled to happen
    actualStartAt: v.optional(v.number()), // When it actually started
    actualEndAt: v.optional(v.number()), // When it actually ended
    
    // Experience type and importance
    experienceType: v.string(), // 'meeting', 'meal', 'travel', 'health', 'entertainment'
    importance: v.number(), // 1-10
    
    // Experience status
    status: v.string(), // 'scheduled', 'in_progress', 'completed', 'cancelled'
    outcome: v.optional(v.string()), // How it went (user reported or inferred)
    
    // Proactive follow-up settings
    followUpEnabled: v.boolean(),
    followUpTiming: v.optional(v.object({
      immediate: v.boolean(), // Right after
      delayed: v.optional(v.number()), // Hours to wait
      nextDay: v.boolean(), // Next morning
    })),
    
    // Follow-up tracking
    followUpCount: v.number(),
    lastFollowUpAt: v.optional(v.number()),
    followUpScheduledAt: v.optional(v.number()), // When follow-up should happen
    followUpCompleted: v.boolean(),
    
    // Location and people
    location: v.optional(v.string()),
    participants: v.optional(v.array(v.string())), // People involved
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_context', ['userId', 'context'])
    .index('by_status', ['userId', 'status'])
    .index('by_scheduled', ['userId', 'scheduledAt'])
    .index('by_follow_up', ['userId', 'followUpEnabled', 'followUpCompleted']),

  // Contact management with completion priority
  contacts: defineTable({
    userId: v.id('users'),
    
    // Basic contact information
    name: v.string(),
    type: v.string(), // 'dentist', 'restaurant', 'doctor', 'friend', 'business'
    context: v.string(), // 'work', 'personal', 'family'
    
    // Contact details (essential data)
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    
    // Completion tracking
    completionStatus: v.string(), // 'incomplete', 'partial', 'complete'
    completionScore: v.number(), // 0-100 based on essential fields
    completionPriority: v.string(), // 'high', 'medium', 'low'
    lastCompletionRequest: v.optional(v.number()),
    
    // Experience and trust
    experienceCount: v.number(),
    averageRating: v.number(), // 0-10 average rating from experiences
    lastInteraction: v.optional(v.number()),
    trustLevel: v.string(), // 'unknown', 'researched', 'tried', 'trusted'
    
    // Discovery and notes
    discoveryMethod: v.string(), // How we learned about them
    firstMention: v.number(),
    notes: v.string(), // Rich notes including experiences
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_type', ['userId', 'type'])
    .index('by_completion', ['userId', 'completionPriority'])
    .index('by_trust', ['userId', 'trustLevel']),

  // Proactive messages for follow-ups and contact completion
  proactiveMessages: defineTable({
    userId: v.id('users'),
    
    // Related entities
    experienceId: v.optional(v.id('experiences')),
    contactId: v.optional(v.id('contacts')),
    
    // Message content
    message: v.string(),
    messageType: v.string(), // 'follow_up', 'contact_completion', 'check_in'
    
    // Status tracking
    status: v.string(), // 'pending', 'sent', 'completed'
    userResponse: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index('by_user_status', ['userId', 'status'])
    .index('by_experience', ['experienceId'])
    .index('by_contact', ['contactId']),

  // Learning patterns - what MAGIS learns about user preferences
  learningPatterns: defineTable({
    userId: v.id('users'),
    
    // Pattern identification
    patternType: v.string(), // 'preference', 'behavior', 'schedule', 'communication_style'
    category: v.string(), // 'food', 'work_style', 'meeting_times', 'response_length'
    
    // Pattern content
    pattern: v.string(), // Description of the pattern
    confidence: v.number(), // 0-1 confidence in this pattern
    evidence: v.array(v.string()), // Supporting evidence (memory IDs, conversation snippets)
    
    // Pattern context
    context: v.optional(v.string()), // Which context this applies to
    applicableContexts: v.array(v.string()), // All contexts where this applies
    
    // Pattern lifecycle
    isActive: v.boolean(),
    lastValidated: v.optional(v.number()), // Last time this was confirmed
    contradictionCount: v.number(), // How many times contradicted
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_type', ['userId', 'patternType'])
    .index('by_user_category', ['userId', 'category'])
    .index('by_active', ['userId', 'isActive'])
    .index('by_confidence', ['userId', 'confidence']),
});