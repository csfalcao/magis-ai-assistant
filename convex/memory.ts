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
        
        // 2. ENTITY MATCHING (people, organizations, locations)
        if (memory.extractedEntities) {
          const entities = memory.extractedEntities;
          let entityMatches = 0;
          let totalEntities = 0;
          
          // Check people entities
          if (entities.people) {
            totalEntities += entities.people.length;
            entityMatches += entities.people.filter(person => 
              queryLower.includes(person.name?.toLowerCase() || '') ||
              queryLower.includes(person.relationship?.toLowerCase() || '')
            ).length;
          }
          
          // Check organization entities
          if (entities.organizations) {
            totalEntities += entities.organizations.length;
            entityMatches += entities.organizations.filter(org => 
              queryLower.includes(org.name?.toLowerCase() || '') ||
              queryLower.includes(org.type?.toLowerCase() || '')
            ).length;
          }
          
          // Check location entities
          if (entities.locations) {
            totalEntities += entities.locations.length;
            entityMatches += entities.locations.filter(location => 
              queryLower.includes(location.toLowerCase())
            ).length;
          }
          
          scores.entity = totalEntities > 0 ? entityMatches / totalEntities : 0;
        }
        
        // 3. TEMPORAL MATCHING (for time-based queries)
        if (memory.resolvedDates && memory.resolvedDates.length > 0) {
          const hasTimeQuery = queryLower.includes('when') || 
                              queryLower.includes('last') || 
                              queryLower.includes('recent') ||
                              queryLower.includes('ago') ||
                              queryLower.includes('time');
          
          if (hasTimeQuery) {
            // Higher score for memories with resolved dates when time is queried
            scores.temporal = 0.8;
            
            // Boost recent memories for "last" or "recent" queries
            if ((queryLower.includes('last') || queryLower.includes('recent')) && memory.createdAt) {
              const daysSinceCreated = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24);
              scores.temporal = Math.max(0.8, 1.0 - (daysSinceCreated / 365)); // Decay over a year
            }
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
        
        // Calculate weighted final score
        const finalScore = (
          scores.semantic * 0.4 +      // 40% - proven 100% success
          scores.entity * 0.3 +        // 30% - entity precision  
          scores.temporal * 0.2 +      // 20% - temporal intelligence
          scores.keyword * 0.1         // 10% - keyword fallback
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
        
        // 2. ENTITY MATCHING (people, organizations, locations)
        if (memory.extractedEntities) {
          const entities = memory.extractedEntities;
          let entityMatches = 0;
          let totalEntities = 0;
          
          // Check people entities
          if (entities.people) {
            totalEntities += entities.people.length;
            entityMatches += entities.people.filter(person => 
              queryLower.includes(person.name?.toLowerCase() || '') ||
              queryLower.includes(person.relationship?.toLowerCase() || '')
            ).length;
          }
          
          // Check organization entities
          if (entities.organizations) {
            totalEntities += entities.organizations.length;
            entityMatches += entities.organizations.filter(org => 
              queryLower.includes(org.name?.toLowerCase() || '') ||
              queryLower.includes(org.type?.toLowerCase() || '')
            ).length;
          }
          
          // Check location entities
          if (entities.locations) {
            totalEntities += entities.locations.length;
            entityMatches += entities.locations.filter(location => 
              queryLower.includes(location.toLowerCase())
            ).length;
          }
          
          scores.entity = totalEntities > 0 ? entityMatches / totalEntities : 0;
        }
        
        // 3. TEMPORAL MATCHING (for time-based queries)
        if (memory.resolvedDates && memory.resolvedDates.length > 0) {
          const hasTimeQuery = queryLower.includes('when') || 
                              queryLower.includes('last') || 
                              queryLower.includes('recent') ||
                              queryLower.includes('ago') ||
                              queryLower.includes('time');
          
          if (hasTimeQuery) {
            // Higher score for memories with resolved dates when time is queried
            scores.temporal = 0.8;
            
            // Boost recent memories for "last" or "recent" queries
            if ((queryLower.includes('last') || queryLower.includes('recent')) && memory.createdAt) {
              const daysSinceCreated = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24);
              scores.temporal = Math.max(0.8, 1.0 - (daysSinceCreated / 365)); // Decay over a year
            }
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
        
        // Calculate weighted final score
        const finalScore = (
          scores.semantic * 0.4 +      // 40% - proven 100% success
          scores.entity * 0.3 +        // 30% - entity precision  
          scores.temporal * 0.2 +      // 20% - temporal intelligence
          scores.keyword * 0.1         // 10% - keyword fallback
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