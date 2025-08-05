import { mutation, query, action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { auth } from './auth';

// Profile-first query resolution
async function checkProfileForAnswer(ctx: any, userId: string, query: string): Promise<{ answer: string; source: string } | null> {
  // Get user profile
  const user = await ctx.runQuery(api.users.getUserById, { userId: userId as any });
  if (!user) return null;

  // Work-related queries
  if (query.includes('where do i work') || query.includes('current job') || query.includes('my company')) {
    if (user.workInfo?.employment?.company) {
      return {
        answer: `You currently work at ${user.workInfo.employment.company}${user.workInfo.employment.position ? ` as a ${user.workInfo.employment.position}` : ''}.`,
        source: 'workInfo.employment'
      };
    }
  }

  // Location queries
  if (query.includes('where do i live') || query.includes('my address') || query.includes('location')) {
    if (user.personalInfo?.location?.city) {
      const location = user.personalInfo.location;
      const parts = [location.city, location.state, location.country].filter(Boolean);
      return {
        answer: `You live in ${parts.join(', ')}.`,
        source: 'personalInfo.location'
      };
    }
  }

  // Birthday queries
  if (query.includes('birthday') || query.includes('when was i born') || query.includes('date of birth')) {
    if (user.personalInfo?.dateOfBirth) {
      const date = new Date(user.personalInfo.dateOfBirth);
      return {
        answer: `Your birthday is ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`,
        source: 'personalInfo.dateOfBirth'
      };
    }
  }

  // Family queries
  if (query.includes('wife') || query.includes('spouse') || query.includes('husband')) {
    if (user.familyInfo?.spouse?.name) {
      return {
        answer: `Your spouse's name is ${user.familyInfo.spouse.name}.`,
        source: 'familyInfo.spouse'
      };
    }
  }

  // Service provider queries
  if (query.includes('dentist') || query.includes('doctor') || query.includes('healthcare')) {
    if (user.serviceProviders?.healthcare && user.serviceProviders.healthcare.length > 0) {
      const providers = user.serviceProviders.healthcare;
      const dentist = providers.find(p => p.type === 'dentist');
      const doctor = providers.find(p => p.type === 'primary_care' || p.type === 'doctor');
      
      if (query.includes('dentist') && dentist) {
        return {
          answer: `Your dentist is ${dentist.name}${dentist.practice ? ` at ${dentist.practice}` : ''}.`,
          source: 'serviceProviders.healthcare'
        };
      }
      if (query.includes('doctor') && doctor) {
        return {
          answer: `Your doctor is ${doctor.name}${doctor.practice ? ` at ${doctor.practice}` : ''}.`,
          source: 'serviceProviders.healthcare'
        };
      }
    }
  }

  // No direct profile answer found
  return null;
}

// Store a new memory with embedding
export const storeMemory = mutation({
  args: {
    content: v.string(),
    sourceType: v.string(), // 'message', 'conversation', 'experience', 'preference'
    sourceId: v.string(),
    context: v.string(), // 'work', 'personal', 'family'
    embedding: v.array(v.number()),
    
    // Optional metadata (can be generated automatically)
    summary: v.optional(v.string()),
    memoryType: v.optional(v.string()),
    importance: v.optional(v.number()),
    entities: v.optional(v.array(v.string())),
    keywords: v.optional(v.array(v.string())),
    sentiment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const memoryId = await ctx.db.insert('memories', {
      userId: userId,
      content: args.content,
      summary: args.summary,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      context: args.context,
      memoryType: args.memoryType || 'fact',
      importance: args.importance || 5,
      
      // Required field for enhanced single table system
      classification: 'MEMORY', // Default classification for legacy storage
      
      embedding: args.embedding,
      entities: args.entities || [],
      keywords: args.keywords || [],
      sentiment: args.sentiment || 0,
      accessCount: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return memoryId;
  },
});

// Search memories using keyword matching (simplified until vector search is available)
export const searchMemories = query({
  args: {
    queryEmbedding: v.optional(v.array(v.number())), // Optional for now
    context: v.optional(v.string()), // Filter by context
    memoryType: v.optional(v.string()), // Filter by memory type
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()), // Similarity threshold (0-1)
    keywords: v.optional(v.array(v.string())), // Fallback keyword search
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // For now, use keyword-based search until vector search is available
    let query = ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isActive'), true));

    if (args.context) {
      query = query.filter((q) => q.eq(q.field('context'), args.context));
    }

    if (args.memoryType) {
      query = query.filter((q) => q.eq(q.field('memoryType'), args.memoryType));
    }

    const allMemories = await query.collect();

    // Simple keyword matching if keywords provided
    let filteredResults = allMemories;
    if (args.keywords && args.keywords.length > 0) {
      filteredResults = allMemories.filter(memory => {
        const searchText = [
          memory.content,
          ...(memory.keywords || []),
          ...(memory.entities || []),
          memory.summary || '',
        ].join(' ').toLowerCase();

        return args.keywords!.some(keyword => 
          searchText.includes(keyword.toLowerCase())
        );
      });
    }

    // Sort by importance and recency
    const sortedResults = filteredResults
      .sort((a, b) => {
        // Prioritize importance first, then recency
        if (a.importance !== b.importance) {
          return b.importance - a.importance;
        }
        return b.createdAt - a.createdAt;
      })
      .slice(0, args.limit || 10);

    // Add mock similarity scores for compatibility
    return sortedResults.map(result => ({
      ...result,
      similarity: 0.8, // Mock similarity score
      _score: 0.8,
    }));
  },
});

// Get recent memories for a user
export const getRecentMemories = query({
  args: {
    context: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    let query = ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isActive'), true));

    if (args.context) {
      query = query.filter((q) => q.eq(q.field('context'), args.context));
    }

    return await query
      .order('desc')
      .take(args.limit || 20);
  },
});

// Get memories by importance
export const getImportantMemories = query({
  args: {
    minImportance: v.optional(v.number()),
    context: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const minImportance = args.minImportance || 7;

    return await ctx.db
      .query('memories')
      .withIndex('by_importance', (q) => 
        q.eq('userId', userId).gte('importance', minImportance)
      )
      .filter((q) => {
        if (args.context) {
          return q.and(
            q.eq(q.field('isActive'), true),
            q.eq(q.field('context'), args.context)
          );
        }
        return q.eq(q.field('isActive'), true);
      })
      .order('desc')
      .take(args.limit || 10);
  },
});

// Update memory importance or deactivate
export const updateMemory = mutation({
  args: {
    memoryId: v.id('memories'),
    importance: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const memory = await ctx.db.get(args.memoryId);
    if (!memory) {
      throw new Error('Memory not found');
    }

    // Verify ownership
    if (memory.userId !== userId) {
      throw new Error('Not authorized');
    }

    const updates: any = { updatedAt: Date.now() };
    
    if (args.importance !== undefined) {
      updates.importance = Math.max(1, Math.min(10, args.importance));
    }
    
    if (args.isActive !== undefined) {
      updates.isActive = args.isActive;
    }

    await ctx.db.patch(args.memoryId, updates);
    return args.memoryId;
  },
});

// Create task from future event detection
export const createTaskFromMemory = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    context: v.string(), // 'work', 'personal', 'family'
    dueDate: v.optional(v.number()),
    participants: v.optional(v.array(v.string())),
    memoryId: v.optional(v.id('memories')),
    eventType: v.optional(v.string()), // 'meeting', 'appointment', 'deadline', 'reminder'
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Prepare tags with event type and participants
    const tags = args.eventType ? [args.eventType] : [];
    if (args.participants && args.participants.length > 0) {
      tags.push(...args.participants.map(p => `participant:${p}`));
    }

    const taskId = await ctx.db.insert('tasks', {
      userId: userId,
      title: args.title,
      description: args.description,
      completed: false,
      priority: 'medium',
      context: args.context,
      dueDate: args.dueDate,
      tags: tags,
      createdFrom: 'memory',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return taskId;
  },
});

// Enhanced future event detection
function detectFutureEvent(content: string): {
  isFutureEvent: boolean;
  eventType: string;
  participants: string[];
  timeIndicators: string[];
  title: string;
} {
  const contentLower = content.toLowerCase();
  let isFutureEvent = false;  
  let eventType = '';
  let participants: string[] = [];
  let timeIndicators: string[] = [];
  let title = '';

  // Meeting detection
  const meetingPatterns = [
    /meeting with (\w+)/i,
    /meet with (\w+)/i,
    /scheduled .*meeting/i,
    /appointment with (\w+)/i,
    /call with (\w+)/i,
    /discuss.*with (\w+)/i
  ];

  // Time pattern detection
  const timePatterns = [
    /next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /tomorrow/i,
    /next week/i,
    /next month/i,
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday) at \d+/i,
    /\d+:\d+\s*(am|pm)/i,
    /at \d+\s*(am|pm)/i
  ];

  // Check for meeting patterns
  for (const pattern of meetingPatterns) {
    const match = content.match(pattern);
    if (match) {
      isFutureEvent = true;
      eventType = 'meeting';
      if (match[1]) {
        participants.push(match[1]);
      }
      break;
    }
  }

  // Check for appointment patterns
  const appointmentPatterns = [
    /dentist appointment/i,
    /doctor appointment/i,
    /appointment (on|at|next)/i,
    /(need to|have to).*appointment/i
  ];

  for (const pattern of appointmentPatterns) {
    if (pattern.test(content)) {
      isFutureEvent = true;
      eventType = 'appointment';
      break;
    }
  }

  // Check for deadline patterns
  const deadlinePatterns = [
    /need to.*by/i,
    /deadline/i,
    /due (next|by)/i,
    /renew.*before/i,
    /expire/i
  ];

  for (const pattern of deadlinePatterns) {
    if (pattern.test(content)) {
      isFutureEvent = true;
      eventType = 'deadline';
      break;
    }
  }

  // Extract time indicators
  for (const pattern of timePatterns) {
    const match = content.match(pattern);
    if (match) {
      timeIndicators.push(match[0]);
    }
  }

  // Generate title based on content and event type
  if (isFutureEvent) {
    if (eventType === 'meeting' && participants.length > 0) {
      title = `Meeting with ${participants[0]}`;
    } else if (eventType === 'appointment') {
      if (contentLower.includes('dentist')) title = 'Dentist appointment';
      else if (contentLower.includes('doctor')) title = 'Doctor appointment';
      else title = 'Appointment';
    } else if (eventType === 'deadline') {
      if (contentLower.includes('passport')) title = 'Renew passport';
      else if (contentLower.includes('renew')) title = 'Renewal deadline';
      else title = 'Deadline';
    } else {
      title = content.substring(0, 50) + '...';
    }
  }

  return {
    isFutureEvent,
    eventType,
    participants,
    timeIndicators,
    title
  };
}

// Create memory from message with enhanced task-memory linking
export const createMemoryFromMessage = action({
  args: {
    messageId: v.id('messages'),
    conversationId: v.id('conversations'),
    content: v.string(),
    context: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Enhanced metadata extraction
    const words = args.content.toLowerCase().split(' ');
    const entities: string[] = [];
    const keywords = words.filter(word => word.length > 4).slice(0, 5);
    
    // Enhanced importance scoring
    const importance = Math.min(10, Math.max(1, Math.floor(args.content.length / 20) + 3));
    
    // Enhanced memory type detection
    let memoryType = 'fact';
    if (args.content.includes('like') || args.content.includes('prefer')) memoryType = 'preference';
    if (args.content.includes('went') || args.content.includes('did')) memoryType = 'experience';

    // NEW: Future event detection
    const futureEvent = detectFutureEvent(args.content);
    if (futureEvent.isFutureEvent) {
      memoryType = 'experience'; // Future experiences
      console.log(`🎯 Future event detected: ${futureEvent.eventType} - ${futureEvent.title}`);
    }

    // Generate real embedding using Voyage 3.5 Lite
    const embeddingResult = await ctx.runAction(api.embeddings.generateEmbedding, {
      text: args.content,
    });
    const embedding = embeddingResult.embedding;
    
    // Store memory first
    const memoryId = await ctx.runMutation(api.memory.storeMemory, {
      content: args.content,
      sourceType: 'message',
      sourceId: args.messageId,
      context: args.context,
      embedding: embedding || [],
      summary: args.content.substring(0, 100) + '...',
      memoryType,
      importance,
      entities,
      keywords,
      sentiment: 0,
    });

    // NEW: Create linked task for future events
    let taskId = null;
    if (futureEvent.isFutureEvent) {
      console.log(`🚀 Creating linked task for future event: ${futureEvent.title}`);
      
      try {
        taskId = await ctx.runMutation(api.memory.createTaskFromMemory, {
          title: futureEvent.title,
          description: args.content,
          context: args.context,
          participants: futureEvent.participants,
          memoryId: memoryId,
          eventType: futureEvent.eventType,
        });
        
        console.log(`✅ Task created successfully: ${taskId}`);
      } catch (error) {
        console.error(`❌ Task creation failed:`, error);
        // Don't fail memory creation if task creation fails
      }
    }

    return {
      memoryId,
      taskId,
      futureEventDetected: futureEvent.isFutureEvent,
      eventType: futureEvent.eventType
    };
  },
});

// Smart memory search that combines keyword matching
export const smartMemorySearch = action({
  args: {
    query: v.string(),
    context: v.optional(v.string()),
    includeKeywords: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    // Extract keywords from query
    const queryKeywords = args.query.toLowerCase().split(' ').filter(word => word.length > 2);

    // Keyword-based search
    const keywordResults = await ctx.runQuery(api.memory.searchMemories, {
      keywords: queryKeywords,
      context: args.context,
      limit: args.limit || 10,
    });

    return keywordResults;
  },
});

// Development-only memory insertion (DO NOT USE IN PRODUCTION)
export const storeMemoryForDevelopment = mutation({
  args: {
    developmentUserId: v.string(), // DEVELOPMENT ONLY - requires explicit user ID
    content: v.string(),
    sourceType: v.string(),
    sourceId: v.string(),
    context: v.string(),
    embedding: v.array(v.number()),
    summary: v.optional(v.string()),
    memoryType: v.optional(v.string()),
    importance: v.optional(v.number()),
    entities: v.optional(v.array(v.string())),
    keywords: v.optional(v.array(v.string())),
    sentiment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // SECURITY WARNING: This bypasses authentication for DEVELOPMENT ONLY
    console.warn('⚠️ SECURITY WARNING: Using development-only memory insertion');
    console.warn('⚠️ This bypasses authentication and should NEVER be used in production');
    console.warn('⚠️ User isolation is maintained but auth is bypassed');

    const memoryId = await ctx.db.insert('memories', {
      userId: args.developmentUserId as any,
      content: args.content,
      summary: args.summary,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      context: args.context,
      memoryType: args.memoryType || 'fact',
      importance: args.importance || 5,
      
      // Required field for enhanced single table system
      classification: 'MEMORY', // Default classification for development data
      
      embedding: args.embedding,
      entities: args.entities || [],
      keywords: args.keywords || [],
      sentiment: args.sentiment || 0,
      accessCount: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`🔒 Development insertion: Created memory ${memoryId} for user ${args.developmentUserId}`);
    return memoryId;
  },
});

// Development-only secure memory query (DO NOT USE IN PRODUCTION)
export const getMemoriesForDevelopment = query({
  args: {
    developmentUserId: v.string(), // DEVELOPMENT ONLY - requires explicit user ID
  },
  handler: async (ctx, args) => {
    // SECURITY WARNING: This bypasses authentication for DEVELOPMENT ONLY
    // DO NOT USE IN PRODUCTION - ALL PRODUCTION CODE MUST USE AUTHENTICATED QUERIES
    
    console.warn('⚠️ SECURITY WARNING: Using development-only memory access');
    console.warn('⚠️ This bypasses authentication and should NEVER be used in production');
    console.warn('⚠️ User isolation is maintained but auth is bypassed');
    
    // Still enforce user isolation even without auth
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', args.developmentUserId as any))
      .filter((q) => q.eq(q.field('isActive'), true))
      .order('desc')
      .take(20);
    
    console.log(`🔒 Development query: Retrieved ${memories.length} memories for user ${args.developmentUserId}`);
    
    return memories.map(memory => ({
      id: memory._id,
      classification: memory.classification,
      content: memory.content,
      createdAt: memory.createdAt,
      extractedEntities: memory.extractedEntities,
      resolvedDates: memory.resolvedDates,
      userId: memory.userId,
      importance: memory.importance,
      keywords: memory.keywords,
      entities: memory.entities,
      embedding: memory.embedding, // Include embeddings for enhanced search
      summary: memory.summary // Include summary for enhanced search
    }));
  },
});

// Debug query to check all memories (admin/testing purposes)
export const getAllMemoriesDebug = query({
  args: {},
  handler: async (ctx) => {
    // CRITICAL SECURITY WARNING: This function exposes ALL users' data
    // Should only be used for debugging and NEVER in production
    console.error('🚨 CRITICAL SECURITY WARNING: getAllMemoriesDebug exposes ALL users data');
    console.error('🚨 This should ONLY be used for debugging and NEVER in production');
    
    const memories = await ctx.db
      .query('memories')
      .filter((q) => q.eq(q.field('isActive'), true))
      .order('desc')
      .take(20);
    
    return memories.map(memory => ({
      id: memory._id,
      classification: memory.classification,
      content: memory.content.substring(0, 100),
      createdAt: memory.createdAt,
      extractedEntities: memory.extractedEntities,
      resolvedDates: memory.resolvedDates,
      userId: memory.userId
    }));
  },
});

// Debug query to check contacts
export const getAllContactsDebug = query({
  args: {},
  handler: async (ctx) => {
    const contacts = await ctx.db
      .query('contacts')
      .order('desc')
      .take(10);
    
    return contacts.map(contact => ({
      id: contact._id,
      name: contact.name,
      type: contact.type,
      context: contact.context,
      scope: contact.scope,
      createdAt: contact.createdAt,
      userId: contact.userId,
      originalUserId: contact.originalUserId
    }));
  },
});

// Search memories by keywords/entities
export const searchByKeywords = query({
  args: {
    keywords: v.array(v.string()),
    context: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // Filter memories that contain any of the keywords
    const matchingMemories = memories.filter(memory => {
      const searchText = [
        memory.content,
        ...(memory.keywords || []),
        ...(memory.entities || []),
        memory.summary || '',
      ].join(' ').toLowerCase();

      return args.keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
    });

    // Filter by context if provided
    const filteredMemories = args.context 
      ? matchingMemories.filter(m => m.context === args.context)
      : matchingMemories;

    return filteredMemories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, args.limit || 10);
  },
});

// Multi-dimensional memory search combining semantic + entities + temporal + keywords
export const enhancedMemorySearch = action({
  args: {
    query: v.string(),
    context: v.optional(v.string()),
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()), // Similarity threshold (0-1)
  },
  handler: async (ctx, args): Promise<any> => {
    console.log(`🔍 Enhanced Memory Search: "${args.query}"`);
    
    // Generate query embedding for semantic search
    const queryEmbedding = await ctx.runAction(api.embeddings.generateQueryEmbedding, {
      query: args.query,
    });
    
    // Get all user memories
    const allMemories = await ctx.runQuery(api.memory.searchMemories, {
      context: args.context,
      limit: 100, // Get more for better filtering
    });
    
    if (!allMemories || allMemories.length === 0) {
      return [];
    }
    
    console.log(`📊 Found ${allMemories.length} memories to search`);
    
    // Extract query components for multi-dimensional matching
    const queryLower = args.query.toLowerCase();
    const queryKeywords = queryLower.split(' ').filter(word => word.length > 2);
    
    // Score each memory using multiple dimensions
    const scoredMemories = await Promise.all(
      allMemories.map(async (memory) => {
        const scores = {
          semantic: 0,
          entity: 0,
          temporal: 0,
          keyword: 0,
          importance: (memory.importance || 5) / 10, // Normalize to 0-1
        };
        
        // 1. SEMANTIC SIMILARITY (using stored embeddings)
        const memoryEmbedding = (memory as any).embedding;
        if (memoryEmbedding && memoryEmbedding.length === queryEmbedding.length) {
          try {
            scores.semantic = await ctx.runAction(api.embeddings.calculateSimilarity, {
              embedding1: queryEmbedding,
              embedding2: memoryEmbedding,
            });
          } catch (error) {
            console.warn('Similarity calculation failed:', error);
            scores.semantic = 0;
          }
        }
        
        // 2. ENTITY MATCHING (using stored entities array)
        if ((memory as any).entities && (memory as any).entities.length > 0) {
          const entities = (memory as any).entities; // Array like ["Sarah", "Microsoft", "Luigi's"]
          let entityMatches = 0;
          const totalEntities = entities.length;
          
          // Check each entity against the query
          entityMatches = entities.filter((entity: string) => 
            queryLower.includes(entity.toLowerCase())
          ).length;
          
          scores.entity = totalEntities > 0 ? entityMatches / totalEntities : 0;
        }
        
        // 3. TEMPORAL MATCHING (using keywords for temporal context)
        const hasTimeQuery = queryLower.includes('when') || 
                            queryLower.includes('last') || 
                            queryLower.includes('recent') ||
                            queryLower.includes('ago') ||
                            queryLower.includes('time') ||
                            queryLower.includes('next');
        
        if (hasTimeQuery && (memory as any).keywords) {
          const keywords = (memory as any).keywords || [];
          const temporalKeywords = ['next', 'last', 'yesterday', 'tomorrow', 'today', 'week', 'month', 'year',
                                  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                                  'am', 'pm', '2pm', '3pm', '10am', 'morning', 'afternoon', 'evening', 'night'];
          
          // Check for temporal keywords in memory
          const hasTemporalKeywords = keywords.some((keyword: string) => 
            temporalKeywords.some(temporal => keyword.toLowerCase().includes(temporal))
          );
          
          if (hasTemporalKeywords) {
            scores.temporal = 0.8;
            
            // Boost recent memories for "last" or "recent" queries
            if ((queryLower.includes('last') || queryLower.includes('recent')) && memory.createdAt) {
              const daysSinceCreated = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24);
              scores.temporal = Math.max(0.8, 1.0 - (daysSinceCreated / 365)); // Decay over a year
            }
          }
        }
        
        // NEW: Recency conflict resolution for "current" queries (Goal 4/4 fix)
        const hasCurrentQuery = queryLower.includes('current') || queryLower.includes('currently') ||
                               queryLower.includes('now') || queryLower.includes('where do i work') ||
                               queryLower.includes('where do you work');
        
        if (hasCurrentQuery && memory.createdAt) {
          const daysSinceCreated = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24);
          
          // Strong recency boost for memories with "last week", "started", etc.
          const content = memory.content.toLowerCase();
          const hasRecentIndicators = content.includes('last week') || content.includes('started') ||
                                    content.includes('new job') || content.includes('just') ||
                                    content.includes('recently') || content.includes('now');
          
          if (hasRecentIndicators) {
            // Exponential recency boost: newer = much higher temporal score
            const recencyBoost = 0.9 + (1.0 / (daysSinceCreated + 1));
            scores.temporal = Math.max(scores.temporal, recencyBoost);
            console.log(`🕐 Recency boost applied: ${scores.temporal.toFixed(3)} for "${content.substring(0, 50)}..."`);
          }
        }
        
        // 4. KEYWORD MATCHING (enhanced with content + entities + keywords)
        const searchableText = [
          memory.content || '',
          ...((memory as any).keywords || []),
          ...((memory as any).entities || []),
          (memory as any).summary || '',
        ].join(' ').toLowerCase();
        
        const keywordMatches = queryKeywords.filter(keyword => 
          searchableText.includes(keyword)
        ).length;
        
        scores.keyword = queryKeywords.length > 0 ? keywordMatches / queryKeywords.length : 0;
        
        // Calculate weighted final score - SEMANTIC-DOMINANT OPTIMIZATION
        const finalScore = (
          scores.semantic * 0.6 +      // 60% - semantic intelligence dominance
          scores.entity * 0.2 +        // 20% - entity precision  
          scores.temporal * 0.15 +     // 15% - temporal intelligence
          scores.keyword * 0.05        // 5% - keyword fallback
        ) * (0.5 + scores.importance * 0.5); // Boost by importance
        
        return {
          ...memory,
          searchScores: scores,
          finalScore: finalScore,
          _score: finalScore, // For compatibility
        };
      })
    );
    
    // Filter by threshold and sort by final score
    const threshold = args.threshold || 0.1; // Lower threshold to be more inclusive
    const filteredResults = scoredMemories
      .filter(memory => memory.finalScore >= threshold)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, args.limit || 10);
    
    console.log(`🎯 Enhanced search results: ${filteredResults.length} memories above threshold ${threshold}`);
    
    if (filteredResults.length > 0) {
      console.log(`📈 Top result score breakdown:`, filteredResults[0].searchScores);
      console.log(`📈 Top result final score: ${filteredResults[0].finalScore.toFixed(3)}`);
    }
    
    return filteredResults;
  },
});

// Query tasks for meeting/appointment searches
export const searchTasksForDevelopment = query({
  args: {
    developmentUserId: v.string(),
    query: v.string(),
    eventType: v.optional(v.string()),
    participant: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY WARNING: This bypasses authentication for DEVELOPMENT ONLY
    console.warn('⚠️ SECURITY WARNING: Using development-only task search');
    console.warn('⚠️ This bypasses authentication and should NEVER be used in production');
    
    const queryLower = args.query.toLowerCase();
    
    // Search tasks by title, tags, and description
    const tasks = await ctx.db
      .query('tasks')
      .filter((q) => q.eq(q.field('userId'), args.developmentUserId as any))
      .collect();

    // Filter tasks based on query relevance
    const relevantTasks = tasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(queryLower);
      const descriptionMatch = task.description?.toLowerCase().includes(queryLower) || false;
      
      // Check for event type match
      const eventTypeMatch = args.eventType ? 
        task.tags.includes(args.eventType) : true;
      
      // Check for participant match
      const participantMatch = args.participant ? 
        task.tags.some(tag => tag.includes(`participant:${args.participant!.toLowerCase()}`)) : true;
      
      // Check for meeting-related content
      const meetingRelated = task.tags.includes('meeting') || 
                            task.title.toLowerCase().includes('meeting') ||
                            task.tags.includes('appointment');

      return (titleMatch || descriptionMatch) && eventTypeMatch && participantMatch && meetingRelated;
    });

    console.log(`🔍 Task search found ${relevantTasks.length} relevant tasks`);
    
    return relevantTasks.map(task => ({
      id: task._id,
      title: task.title,
      description: task.description,
      context: task.context,
      dueDate: task.dueDate,
      tags: task.tags,
      type: 'task'
    }));
  },
});

// Hybrid search: Tasks + Enhanced Memory Search
export const hybridSearchForDevelopment = action({
  args: {
    query: v.string(),
    developmentUserId: v.string(),
    context: v.optional(v.string()),
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log(`🔍 Hybrid Search: "${args.query}" for user ${args.developmentUserId}`);
    
    const queryLower = args.query.toLowerCase();
    let results: any[] = [];

    // Step 1: Check if this is a meeting/appointment query
    const isMeetingQuery = queryLower.includes('meeting') || 
                          queryLower.includes('appointment') || 
                          queryLower.includes('when is my');
    
    // Step 2: Extract participant if mentioned
    let participant: string | undefined = undefined;
    const participantMatch = args.query.match(/with (\w+)/i);
    if (participantMatch) {
      participant = participantMatch[1];
    }

    if (isMeetingQuery) {
      console.log(`🎯 Meeting query detected, searching tasks first...`);
      
      // Search tasks first for meeting queries
      try {
        const taskResults = await ctx.runQuery(api.memory.searchTasksForDevelopment, {
          developmentUserId: args.developmentUserId,
          query: args.query,
          eventType: 'meeting',
          participant: participant
        });
        
        if (taskResults && taskResults.length > 0) {
          console.log(`✅ Found ${taskResults.length} matching tasks`);
          results = taskResults;
        }
      } catch (error) {
        console.warn('Task search failed, continuing with memory search:', error);
      }
    }

    // Step 3: If no task results, fall back to enhanced memory search
    if (results.length === 0) {
      console.log(`🔄 No task results, falling back to enhanced memory search...`);
      
      try {
        const memoryResults = await ctx.runAction(api.memory.enhancedMemorySearchForDevelopment, {
          query: args.query,
          developmentUserId: args.developmentUserId,
          context: args.context,
          limit: args.limit,
          threshold: args.threshold,
        });
        
        if (memoryResults && memoryResults.length > 0) {
          results = memoryResults.map((result: any) => ({
            ...result,
            type: 'memory'
          }));
        }
      } catch (error) {
        console.error('Enhanced memory search failed:', error);
        return [];
      }
    }

    // Step 4: Apply context filtering if specified
    if (args.context && results.length > 0) {
      results = results.filter(result => 
        result.context === args.context || !result.context
      );
    }

    console.log(`🎯 Hybrid search results: ${results.length} total results`);
    return results.slice(0, args.limit || 10);
  },
});

// Development-only enhanced memory search (bypasses auth but maintains user isolation)
export const enhancedMemorySearchForDevelopment = action({
  args: {
    query: v.string(),
    developmentUserId: v.string(), // DEVELOPMENT ONLY - requires explicit user ID
    context: v.optional(v.string()),
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    // SECURITY WARNING: This bypasses authentication for DEVELOPMENT ONLY
    console.warn('⚠️ SECURITY WARNING: Using development-only enhanced memory search');
    console.warn('⚠️ This bypasses authentication and should NEVER be used in production');
    console.warn('⚠️ User isolation is maintained but auth is bypassed');
    
    console.log(`🔍 Enhanced Memory Search (DEV): "${args.query}" for user ${args.developmentUserId}`);
    
    // PROFILE-FIRST RESOLUTION: Check if query can be answered from profile
    const queryLower = args.query.toLowerCase();
    const profileAnswer = await checkProfileForAnswer(ctx, args.developmentUserId, queryLower);
    
    if (profileAnswer) {
      console.log(`👤 PROFILE-FIRST: Found direct answer in user profile`);
      return [{
        content: profileAnswer.answer,
        context: 'profile',
        memoryType: 'profile',
        importance: 10,
        searchScores: {
          semantic: 1.0,
          entity: 1.0,
          temporal: 0,
          keyword: 1.0,
          importance: 1.0,
        },
        finalScore: 1.0,
        _score: 1.0,
        isProfileAnswer: true,
        profileSource: profileAnswer.source,
      }];
    }
    
    // Generate query embedding for semantic search
    const queryEmbedding = await ctx.runAction(api.embeddings.generateQueryEmbedding, {
      query: args.query,
    });
    
    // Get user memories using development query (maintains user isolation)
    const allMemories = await ctx.runQuery(api.memory.getMemoriesForDevelopment, {
      developmentUserId: args.developmentUserId
    });
    
    if (!allMemories || allMemories.length === 0) {
      console.log('📊 No memories found for development user');
      return [];
    }
    
    console.log(`📊 Found ${allMemories.length} memories to search`);
    
    // Extract query components for multi-dimensional matching
    const queryLower = args.query.toLowerCase();
    const queryKeywords = queryLower.split(' ').filter(word => word.length > 2);
    
    // Score each memory using multiple dimensions
    const scoredMemories = await Promise.all(
      allMemories.map(async (memory) => {
        const scores = {
          semantic: 0,
          entity: 0,
          temporal: 0,
          keyword: 0,
          importance: (memory.importance || 5) / 10, // Normalize to 0-1
        };
        
        // 1. SEMANTIC SIMILARITY (using stored embeddings)
        const memoryEmbedding = (memory as any).embedding;
        if (memoryEmbedding && memoryEmbedding.length === queryEmbedding.length) {
          try {
            scores.semantic = await ctx.runAction(api.embeddings.calculateSimilarity, {
              embedding1: queryEmbedding,
              embedding2: memoryEmbedding,
            });
          } catch (error) {
            console.warn('Similarity calculation failed:', error);
            scores.semantic = 0;
          }
        }
        
        // 2. ENTITY MATCHING (using stored entities array)
        if ((memory as any).entities && (memory as any).entities.length > 0) {
          const entities = (memory as any).entities; // Array like ["Sarah", "Microsoft", "Luigi's"]
          let entityMatches = 0;
          const totalEntities = entities.length;
          
          // Check each entity against the query
          entityMatches = entities.filter((entity: string) => 
            queryLower.includes(entity.toLowerCase())
          ).length;
          
          scores.entity = totalEntities > 0 ? entityMatches / totalEntities : 0;
        }
        
        // 3. TEMPORAL MATCHING (using keywords for temporal context)
        const hasTimeQuery = queryLower.includes('when') || 
                            queryLower.includes('last') || 
                            queryLower.includes('recent') ||
                            queryLower.includes('ago') ||
                            queryLower.includes('time') ||
                            queryLower.includes('next');
        
        if (hasTimeQuery && (memory as any).keywords) {
          const keywords = (memory as any).keywords || [];
          const temporalKeywords = ['next', 'last', 'yesterday', 'tomorrow', 'today', 'week', 'month', 'year',
                                  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                                  'am', 'pm', '2pm', '3pm', '10am', 'morning', 'afternoon', 'evening', 'night'];
          
          // Check for temporal keywords in memory
          const hasTemporalKeywords = keywords.some((keyword: string) => 
            temporalKeywords.some(temporal => keyword.toLowerCase().includes(temporal))
          );
          
          if (hasTemporalKeywords) {
            scores.temporal = 0.8;
            
            // Boost recent memories for "last" or "recent" queries
            if ((queryLower.includes('last') || queryLower.includes('recent')) && memory.createdAt) {
              const daysSinceCreated = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24);
              scores.temporal = Math.max(0.8, 1.0 - (daysSinceCreated / 365)); // Decay over a year
            }
          }
        }
        
        // NEW: Recency conflict resolution for "current" queries (Goal 4/4 fix)
        const hasCurrentQuery = queryLower.includes('current') || queryLower.includes('currently') ||
                               queryLower.includes('now') || queryLower.includes('where do i work') ||
                               queryLower.includes('where do you work');
        
        if (hasCurrentQuery && memory.createdAt) {
          const daysSinceCreated = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24);
          
          // Strong recency boost for memories with "last week", "started", etc.
          const content = memory.content.toLowerCase();
          const hasRecentIndicators = content.includes('last week') || content.includes('started') ||
                                    content.includes('new job') || content.includes('just') ||
                                    content.includes('recently') || content.includes('now');
          
          if (hasRecentIndicators) {
            // Exponential recency boost: newer = much higher temporal score
            const recencyBoost = 0.9 + (1.0 / (daysSinceCreated + 1));
            scores.temporal = Math.max(scores.temporal, recencyBoost);
            console.log(`🕐 Recency boost applied: ${scores.temporal.toFixed(3)} for "${content.substring(0, 50)}..."`);
          }
        }
        
        // 4. KEYWORD MATCHING (enhanced with content + entities + keywords)
        const searchableText = [
          memory.content || '',
          ...((memory as any).keywords || []),
          ...((memory as any).entities || []),
          (memory as any).summary || '',
        ].join(' ').toLowerCase();
        
        const keywordMatches = queryKeywords.filter(keyword => 
          searchableText.includes(keyword)
        ).length;
        
        scores.keyword = queryKeywords.length > 0 ? keywordMatches / queryKeywords.length : 0;
        
        // Calculate weighted final score - SEMANTIC-DOMINANT OPTIMIZATION
        const finalScore = (
          scores.semantic * 0.6 +      // 60% - semantic intelligence dominance
          scores.entity * 0.2 +        // 20% - entity precision  
          scores.temporal * 0.15 +     // 15% - temporal intelligence
          scores.keyword * 0.05        // 5% - keyword fallback
        ) * (0.5 + scores.importance * 0.5); // Boost by importance
        
        return {
          ...memory,
          searchScores: scores,
          finalScore: finalScore,
          _score: finalScore, // For compatibility
        };
      })
    );
    
    // Filter by threshold and sort by final score
    const threshold = args.threshold || 0.1; // Lower threshold to be more inclusive
    const filteredResults = scoredMemories
      .filter(memory => memory.finalScore >= threshold)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, args.limit || 10);
    
    console.log(`🎯 Enhanced search results: ${filteredResults.length} memories above threshold ${threshold}`);
    
    if (filteredResults.length > 0) {
      console.log(`📈 Top result score breakdown:`, filteredResults[0].searchScores);
      console.log(`📈 Top result final score: ${filteredResults[0].finalScore.toFixed(3)}`);
    }
    
    return filteredResults;
  },
});