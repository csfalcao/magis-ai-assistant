import { mutation, query, action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { auth } from './auth';

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

// Create memory from message (simplified for compatibility)
export const createMemoryFromMessage = action({
  args: {
    messageId: v.id('messages'),
    conversationId: v.id('conversations'),
    content: v.string(),
    context: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Simplified metadata extraction (no embeddings for now)
    const words = args.content.toLowerCase().split(' ');
    const entities: string[] = [];
    const keywords = words.filter(word => word.length > 4).slice(0, 5);
    
    // Simple importance scoring
    const importance = Math.min(10, Math.max(1, Math.floor(args.content.length / 20) + 3));
    
    // Simple memory type detection
    let memoryType = 'fact';
    if (args.content.includes('like') || args.content.includes('prefer')) memoryType = 'preference';
    if (args.content.includes('went') || args.content.includes('did')) memoryType = 'experience';

    // Generate real embedding using Voyage 3.5 Lite
    const embeddingResult = await ctx.runAction(api.embeddings.generateEmbedding, {
      text: args.content,
    });
    const embedding = embeddingResult.embedding;
    
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

    return memoryId;
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
      entities: memory.entities
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