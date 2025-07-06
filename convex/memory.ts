import { mutation, query, action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get user ID from auth
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const memoryId = await ctx.db.insert('memories', {
      userId: user._id,
      content: args.content,
      summary: args.summary,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      context: args.context,
      memoryType: args.memoryType || 'fact',
      importance: args.importance || 5,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get user ID from auth
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // For now, use keyword-based search until vector search is available
    let query = ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    let query = ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const minImportance = args.minImportance || 7;

    return await ctx.db
      .query('memories')
      .withIndex('by_importance', (q) => 
        q.eq('userId', user._id).gte('importance', minImportance)
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const memory = await ctx.db.get(args.memoryId);
    if (!memory) {
      throw new Error('Memory not found');
    }

    // Verify ownership
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user || memory.userId !== user._id) {
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

    // Store the memory with mock embedding
    const mockEmbedding = new Array(1536).fill(0.1);
    
    const memoryId = await ctx.runMutation(api.memory.storeMemory, {
      content: args.content,
      sourceType: 'message',
      sourceId: args.messageId,
      context: args.context,
      embedding: mockEmbedding,
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

// Search memories by keywords/entities
export const searchByKeywords = query({
  args: {
    keywords: v.array(v.string()),
    context: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
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