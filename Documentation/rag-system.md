# MAGIS RAG (Retrieval-Augmented Generation) System

## 🧠 **RAG System Overview**

MAGIS implements a sophisticated Personal RAG system that creates genuine long-term memory and learning capabilities. Unlike traditional chatbots that forget everything, MAGIS remembers every interaction and gets smarter over time.

### **MAGIS Personal Assistant Philosophy**
**MAGIS is a PRACTICAL personal assistant, NOT a therapist or emotional companion:**
- ✅ **Routine Optimization**: Remembers appointments, tasks, recurring events
- ✅ **Context Switching**: Work meetings vs family appointments vs personal tasks  
- ✅ **Proactive Reminders**: "Susana needs eye exam" → "It's been 3 months, time to schedule?"
- ✅ **Instant Recall**: "When did I last go to the dentist?" → Immediate answer
- ✅ **Pattern Recognition**: "You usually schedule dentist on Tuesdays at 2PM"
- ✅ **Relationship Mapping**: "Susana (daughter, 16) needs eye exam" 
- ✅ **Conversational Style**: Brief, natural responses optimized for chat
- ❌ **NOT Psychology**: No emotional counseling, therapy, or deep personal analysis
- ❌ **NOT Intimate**: Professional distance, helpful but not overly personal
- ❌ **NOT Verbose**: No long explanations unless specifically requested

### **Communication Style Guidelines**
**MAGIS uses Claude Sonnet 4 and GPT-4 optimized for concise, conversational interactions:**
- **Brief Responses**: 500 token limit encourages focused answers
- **Natural Conversation**: Chat-optimized rather than formal assistant style
- **Context-Aware Tone**: Professional (work), friendly (personal), warm (family)
- **Memory Integration**: Uses stored context naturally without mentioning it
- **Tool Usage**: Calculator and search tools when helpful, seamlessly integrated

### **What Makes This RAG Special**
- **Practical Memory**: Remembers appointments, tasks, preferences, routines
- **Cross-Context Learning**: Work schedule preferences → family appointment scheduling
- **Relationship Tracking**: Who needs what, when, and how often (practical only)
- **Temporal Awareness**: Knows when things happened and when they repeat
- **Proactive Intelligence**: Suggests actions based on patterns and timing

## 🗄️ **RAG Database Schema**

### **Memory Chunks Table**
```typescript
memory_chunks: defineTable({
  userId: v.id('users'),
  conversationId: v.id('conversations'),
  content: v.string(),              // The actual conversation text
  embedding: v.array(v.number()),   // 1536-dimensional vector (OpenAI)
  metadata: v.object({
    type: v.union(
      v.literal('conversation'),     // Regular chat
      v.literal('task_completion'),  // Task/goal achievements
      v.literal('preference_learned'), // User preference discoveries
      v.literal('context_switch'),   // Mode changes (work→personal)
      v.literal('personal_info'),    // Important personal facts
      v.literal('experience_review') // Experience follow-ups
    ),
    timestamp: v.number(),
    context: v.string(),             // work, personal, family
    importance: v.number(),          // 1-10 relevance score
    entities: v.array(v.string()),   // Extracted people, places, etc.
    summary: v.string(),             // AI-generated summary
    sentiment: v.optional(v.string()), // positive, negative, neutral
  }),
})
.index('by_user', ['userId'])
.vectorIndex('by_embedding', {
  vectorField: 'embedding',
  dimensions: 1536,
  filterFields: ['userId', 'metadata.context', 'metadata.type']
});
```

### **Entity Relationship Table**
```typescript
entities: defineTable({
  userId: v.id('users'),
  name: v.string(),                 // "Dr. Mary Johnson", "Mom", "Project Alpha"
  type: v.union(
    v.literal('person'),
    v.literal('place'), 
    v.literal('organization'),
    v.literal('project'),
    v.literal('event')
  ),
  aliases: v.array(v.string()),     // ["Mary", "the dentist"]
  context: v.string(),              // Primary context association
  lastMentioned: v.number(),
  importance: v.number(),           // 1-10 based on mention frequency
  relationships: v.array(v.object({
    relatedEntity: v.string(),
    relationship: v.string(),       // "works at", "married to", "part of"
    strength: v.number(),           // 1-10 relationship strength
  })),
  preferences: v.array(v.object({   // What user likes/dislikes about this entity
    preference: v.string(),
    sentiment: v.string(),          // positive, negative, neutral
    confidence: v.number(),         // 0-1 confidence score
  })),
})
.index('by_user', ['userId'])
.index('by_user_name', ['userId', 'name']);
```

### **Memory Summaries (Compression)**
```typescript
memory_summaries: defineTable({
  userId: v.id('users'),
  timeRange: v.object({
    start: v.number(),
    end: v.number(),
  }),
  summary: v.string(),              // Weekly/monthly summary
  keyInsights: v.array(v.string()), // Important discoveries
  importantEvents: v.array(v.string()), // Significant happenings
  learnedPreferences: v.array(v.object({
    preference: v.string(),
    confidence: v.number(),
    category: v.string(),           // food, entertainment, work_style, etc.
  })),
  embedding: v.array(v.number()),   // Summary embedding for search
  entities: v.array(v.string()),    // Key entities from this period
})
.index('by_user', ['userId'])
.vectorIndex('by_summary_embedding', {
  vectorField: 'embedding', 
  dimensions: 1536
});
```

## 🔢 **Embedding Generation Pipeline**

### **Real-Time Embedding Creation**
```typescript
// convex/embeddings.ts
export const generateEmbedding = action({
  args: {
    text: v.string(),
    userId: v.id('users'),
    conversationId: v.id('conversations'),
    metadata: v.object({
      type: v.string(),
      context: v.string(),
      importance: v.number(),
    })
  },
  handler: async (ctx, args) => {
    // Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: args.text,
      dimensions: 1536
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Extract entities and generate summary in parallel
    const [entities, summary, sentiment] = await Promise.all([
      extractEntities(args.text),
      generateSummary(args.text, args.metadata.type),
      analyzeSentiment(args.text)
    ]);

    // Store memory chunk
    const memoryId = await ctx.runMutation(internal.embeddings.storeMemoryChunk, {
      userId: args.userId,
      conversationId: args.conversationId,
      content: args.text,
      embedding,
      metadata: {
        ...args.metadata,
        timestamp: Date.now(),
        entities: entities.map(e => e.name),
        summary,
        sentiment,
      }
    });

    // Update entity relationships
    await updateEntityRelationships(ctx, entities, args.userId, args.metadata.context);

    return { memoryId, entities, summary };
  },
});

async function extractEntities(text: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `Extract people, places, organizations, and important entities from this text.
        Return JSON: {"entities": [{"name": "string", "type": "person|place|organization|project|event", "aliases": ["string"]}]}`
      },
      { role: 'user', content: text }
    ],
    temperature: 0.1,
    max_tokens: 300,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{"entities": []}');
    return result.entities;
  } catch {
    return [];
  }
}

async function generateSummary(text: string, type: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `Summarize this ${type} in 1-2 sentences, focusing on key information, preferences, and actionable insights.`
      },
      { role: 'user', content: text }
    ],
    max_tokens: 100,
    temperature: 0.3,
  });

  return response.choices[0].message.content || '';
}

async function analyzeSentiment(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'Analyze the sentiment of this text. Respond with only: positive, negative, or neutral'
      },
      { role: 'user', content: text }
    ],
    max_tokens: 10,
    temperature: 0.1,
  });

  return response.choices[0].message.content?.toLowerCase() || 'neutral';
}
```

## 🔍 **Semantic Search & Retrieval**

### **Multi-Stage Retrieval System**
```typescript
// convex/memory.ts
export const searchMemories = action({
  args: {
    query: v.string(),
    userId: v.id('users'),
    context: v.optional(v.string()),
    timeRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
    limit: v.optional(v.number()),
    includeEntities: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Generate query embedding
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: args.query,
      dimensions: 1536
    });

    const queryVector = queryEmbedding.data[0].embedding;

    // Parallel searches for comprehensive context
    const [
      semanticMemories,
      recentMemories, 
      entityMatches,
      summaryMatches
    ] = await Promise.all([
      // Main semantic search
      ctx.vectorSearch('memory_chunks', 'by_embedding', {
        vector: queryVector,
        limit: args.limit || 10,
        filter: (q) => {
          let query = q.eq('userId', args.userId);
          
          if (args.context) {
            query = query.eq('metadata.context', args.context);
          }
          
          if (args.timeRange) {
            query = query
              .gte('metadata.timestamp', args.timeRange.start)
              .lte('metadata.timestamp', args.timeRange.end);
          }
          
          return query;
        },
      }),

      // Recent context (last 24 hours)
      getRecentMemories(ctx, args.userId, 24 * 60 * 60 * 1000),
      
      // Entity-based matches
      args.includeEntities ? searchEntityMentions(ctx, args.query, args.userId) : [],
      
      // Search compressed summaries
      searchMemorySummaries(ctx, queryVector, args.userId)
    ]);

    // Combine and rank results
    const combinedResults = combineAndRankResults({
      semantic: semanticMemories,
      recent: recentMemories,
      entities: entityMatches,
      summaries: summaryMatches,
      query: args.query
    });

    return {
      memories: combinedResults,
      totalResults: combinedResults.length,
      searchMetadata: {
        semanticMatches: semanticMemories.length,
        recentContext: recentMemories.length,
        entityMatches: entityMatches.length,
        summaryMatches: summaryMatches.length,
      }
    };
  },
});

async function getRecentMemories(ctx: any, userId: string, timeWindow: number) {
  const since = Date.now() - timeWindow;
  
  return await ctx.runQuery(internal.memory.getMemoriesSince, {
    userId,
    since,
    limit: 5
  });
}

async function searchEntityMentions(ctx: any, query: string, userId: string) {
  // Find entities mentioned in query
  const entities = await ctx.runQuery(internal.memory.getEntitiesByUser, { userId });
  
  const queryLower = query.toLowerCase();
  const relevantEntities = entities.filter((entity: any) => {
    return (
      entity.name.toLowerCase().includes(queryLower) ||
      entity.aliases.some((alias: string) => 
        queryLower.includes(alias.toLowerCase())
      )
    );
  });

  // Get memories that mention these entities
  const entityMemories = [];
  for (const entity of relevantEntities) {
    const memories = await ctx.runQuery(internal.memory.getMemoriesByEntity, {
      userId,
      entityName: entity.name,
      limit: 3
    });
    entityMemories.push(...memories);
  }

  return entityMemories;
}

async function searchMemorySummaries(ctx: any, queryVector: number[], userId: string) {
  return await ctx.vectorSearch('memory_summaries', 'by_summary_embedding', {
    vector: queryVector,
    limit: 3,
    filter: (q) => q.eq('userId', userId)
  });
}

function combineAndRankResults(results: any) {
  const { semantic, recent, entities, summaries, query } = results;
  
  // Score and combine results
  const scoredResults = [
    ...semantic.map((r: any) => ({ ...r, source: 'semantic', score: r._score * 1.0 })),
    ...recent.map((r: any) => ({ ...r, source: 'recent', score: 0.8 })),
    ...entities.map((r: any) => ({ ...r, source: 'entity', score: 0.9 })),
    ...summaries.map((r: any) => ({ ...r, source: 'summary', score: r._score * 0.7 }))
  ];

  // Remove duplicates and sort by score
  const uniqueResults = removeDuplicates(scoredResults);
  return uniqueResults.sort((a, b) => b.score - a.score).slice(0, 10);
}

function removeDuplicates(results: any[]) {
  const seen = new Set();
  return results.filter(result => {
    const key = result._id || result.content;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

## 🧠 **Context Injection for AI**

### **RAG-Enhanced AI Responses**
```typescript
// app/api/chat/route.ts - Enhanced with RAG
export async function POST(request: Request) {
  const { messages, conversationId, context, userId } = await request.json();
  
  const lastMessage = messages[messages.length - 1].content;

  // Get personal context using RAG
  const personalContext = await convex.action(api.memory.searchMemories, {
    query: lastMessage,
    userId,
    context,
    includeEntities: true,
    limit: 8
  });

  // Build enhanced system prompt
  const systemPrompt = buildPersonalizedSystemPrompt(context, personalContext);

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    system: systemPrompt,
    messages,
    tools: {
      searchPersonalMemory: tool({
        description: 'Search through user\'s personal memories and conversation history',
        parameters: z.object({
          query: z.string(),
          timeframe: z.enum(['recent', 'last_week', 'last_month', 'all_time']).optional(),
          context: z.enum(['work', 'personal', 'family', 'all']).optional(),
        }),
        execute: async ({ query, timeframe, context: searchContext }) => {
          const timeRange = getTimeRange(timeframe);
          
          const memories = await convex.action(api.memory.searchMemories, {
            query,
            userId,
            context: searchContext === 'all' ? undefined : searchContext,
            timeRange,
            limit: 6
          });

          return formatMemoriesForAI(memories);
        },
      }),

      rememberPersonalInfo: tool({
        description: 'Store important personal information about the user',
        parameters: z.object({
          information: z.string(),
          category: z.enum(['preference', 'fact', 'goal', 'relationship', 'health']),
          importance: z.number().min(1).max(10),
        }),
        execute: async ({ information, category, importance }) => {
          await convex.action(api.embeddings.generateEmbedding, {
            text: information,
            userId,
            conversationId,
            metadata: {
              type: 'personal_info',
              context,
              importance,
            }
          });

          return `I'll remember: ${information}`;
        },
      }),
    },

    onFinish: async ({ text, usage }) => {
      // Store this conversation in RAG
      const conversationText = `User: ${lastMessage}\nAssistant: ${text}`;
      
      await convex.action(api.embeddings.generateEmbedding, {
        text: conversationText,
        userId,
        conversationId,
        metadata: {
          type: 'conversation',
          context,
          importance: 5, // Default importance
        }
      });
    },
  });

  return result.toAIStreamResponse();
}

function buildPersonalizedSystemPrompt(context: string, personalContext: any): string {
  let prompt = `You are MAGIS, the user's personal AI assistant. You have access to their conversation history and personal information to provide highly personalized assistance.

## Your Personal Knowledge About This User:

`;

  // Add relevant memories
  if (personalContext.memories.length > 0) {
    prompt += `### Recent Relevant Context:\n`;
    personalContext.memories.slice(0, 5).forEach((memory: any, index: number) => {
      prompt += `${index + 1}. ${memory.metadata.summary} (${memory.metadata.context}, ${formatDate(memory.metadata.timestamp)})\n`;
    });
    prompt += '\n';
  }

  // Add entity information
  if (personalContext.searchMetadata.entityMatches > 0) {
    prompt += `### Important People & Places:\n`;
    const entities = extractEntitiesFromMemories(personalContext.memories);
    entities.forEach((entity: string) => {
      prompt += `- ${entity}\n`;
    });
    prompt += '\n';
  }

  prompt += `
## Instructions:
- Use this personal context naturally in conversation
- Reference past conversations when relevant  
- Remember new information shared
- Be conversational and build on your relationship with the user
- Current context: ${context} mode
- If you need more specific information, use the searchPersonalMemory tool

Always respect the user's privacy and personalize your responses based on what you know about them.`;

  return prompt;
}

function formatMemoriesForAI(memories: any) {
  return {
    found: memories.memories.length,
    memories: memories.memories.map((m: any) => ({
      summary: m.metadata.summary,
      context: m.metadata.context,
      when: formatDate(m.metadata.timestamp),
      importance: m.metadata.importance,
      sentiment: m.metadata.sentiment,
    })),
    insights: extractInsights(memories.memories),
  };
}

function extractInsights(memories: any[]) {
  // Extract patterns and insights from memories
  const insights = [];
  
  // Sentiment patterns
  const sentiments = memories.map(m => m.metadata.sentiment).filter(Boolean);
  if (sentiments.length > 0) {
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    
    if (positiveCount > negativeCount * 2) {
      insights.push('User has been generally positive about this topic');
    } else if (negativeCount > positiveCount) {
      insights.push('User has had some negative experiences with this');
    }
  }

  // Context patterns
  const contexts = memories.map(m => m.metadata.context);
  const contextCounts = contexts.reduce((acc, ctx) => {
    acc[ctx] = (acc[ctx] || 0) + 1;
    return acc;
  }, {} as any);
  
  const dominantContext = Object.keys(contextCounts).reduce((a, b) => 
    contextCounts[a] > contextCounts[b] ? a : b
  );
  
  if (contextCounts[dominantContext] > memories.length / 2) {
    insights.push(`This topic is primarily associated with ${dominantContext} context`);
  }

  return insights;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}
```

## 🗜️ **Memory Compression System**

### **Intelligent Long-Term Storage**
```typescript
// convex/memoryCompression.ts
export const compressOldMemories = action({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    // Get memories older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const oldMemories = await ctx.runQuery(internal.memory.getMemoriesOlderThan, {
      userId: args.userId,
      timestamp: thirtyDaysAgo
    });

    if (oldMemories.length < 20) return; // Not enough to compress

    // Group by week
    const weeklyGroups = groupMemoriesByWeek(oldMemories);

    for (const [weekKey, memories] of Object.entries(weeklyGroups)) {
      await compressWeeklyMemories(ctx, args.userId, memories, weekKey);
    }
  },
});

async function compressWeeklyMemories(ctx: any, userId: string, memories: any[], weekKey: string) {
  const conversationTexts = memories.map(m => m.content).join('\n\n');
  
  // Generate comprehensive summary
  const summary = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: `Analyze this week's conversations and create a comprehensive summary. Extract:
        1. Key events and accomplishments
        2. Important preferences learned
        3. Significant relationships mentioned
        4. Patterns in behavior or needs
        5. Goals or plans discussed
        
        Return JSON with: {
          "summary": "comprehensive week summary",
          "keyInsights": ["insight1", "insight2"],
          "importantEvents": ["event1", "event2"],
          "learnedPreferences": [{"preference": "text", "confidence": 0.8, "category": "food"}],
          "entities": ["entity1", "entity2"]
        }`
      },
      { role: 'user', content: conversationTexts }
    ],
    max_tokens: 1500,
    temperature: 0.3,
  });

  const summaryData = JSON.parse(summary.choices[0].message.content || '{}');
  
  // Generate embedding for summary
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: summaryData.summary,
    dimensions: 1536
  });

  // Store compressed summary
  await ctx.runMutation(internal.memory.createMemorySummary, {
    userId,
    timeRange: {
      start: Math.min(...memories.map(m => m.metadata.timestamp)),
      end: Math.max(...memories.map(m => m.metadata.timestamp)),
    },
    summary: summaryData.summary,
    keyInsights: summaryData.keyInsights || [],
    importantEvents: summaryData.importantEvents || [],
    learnedPreferences: summaryData.learnedPreferences || [],
    embedding: embeddingResponse.data[0].embedding,
    entities: summaryData.entities || [],
  });

  // Delete original memories (except high importance ones)
  for (const memory of memories) {
    if (memory.metadata.importance < 8) { // Keep very important memories
      await ctx.runMutation(internal.memory.deleteMemoryChunk, {
        id: memory._id
      });
    }
  }
}

function groupMemoriesByWeek(memories: any[]) {
  const groups: { [key: string]: any[] } = {};
  
  memories.forEach(memory => {
    const date = new Date(memory.metadata.timestamp);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    
    if (!groups[weekKey]) groups[weekKey] = [];
    groups[weekKey].push(memory);
  });
  
  return groups;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
```

## 📊 **RAG Performance Optimization**

### **Caching Strategy**
```typescript
// Convex automatically caches frequent queries
// Additional optimization for common searches

// Cache user's most common search patterns
export const cacheCommonSearches = action({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const commonQueries = [
      'recent work meetings',
      'personal health appointments', 
      'family events',
      'restaurant recommendations',
      'travel plans'
    ];

    // Pre-generate embeddings for common queries
    for (const query of commonQueries) {
      await precomputeSearchResults(ctx, args.userId, query);
    }
  },
});

// Batch embedding generation for efficiency
export const batchGenerateEmbeddings = action({
  args: { 
    texts: v.array(v.string()),
    userId: v.id('users')
  },
  handler: async (ctx, args) => {
    // Process multiple texts in single API call
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: args.texts,
      dimensions: 1536
    });

    return embeddingResponse.data.map(d => d.embedding);
  },
});
```

### **Search Performance Metrics**
```typescript
// Track RAG performance for optimization
export const trackSearchPerformance = mutation({
  args: {
    query: v.string(),
    resultsFound: v.number(),
    searchTime: v.number(),
    relevanceScore: v.number(),
  },
  handler: async (ctx, args) => {
    // Store performance metrics for analysis
    await ctx.db.insert('search_metrics', {
      ...args,
      timestamp: Date.now(),
    });
  },
});
```

## 🚧 **Current Implementation Status & Next Steps**

### **Day 3 Achievement: Foundation Complete** ✅
- ✅ Complete RAG database schema (memories, entities, connections, patterns)
- ✅ Memory storage and retrieval functions  
- ✅ Basic entity extraction and relationship mapping
- ✅ Cross-context memory linking capabilities
- ✅ Chat API integration with memory context injection

### **The "Susana Scenario" - Real Implementation Test**

**User Input (Portuguese):** 
```
"A Susana minha filha precisa ir no oftalmologista; essa semana fui no dentista; preciso fazer um tratamento"
```

**Current Gap:** This should trigger automatic memory creation but doesn't yet because:
- ❌ Automatic entity extraction pipeline not activated
- ❌ Portuguese language processing not configured  
- ❌ Natural follow-up question generation not implemented
- ❌ Memory pipeline not triggered on message save

**Target Behavior:**
1. **Entity Detection**: "Susana" → Person(unknown relationship)
2. **Natural Question**: "Quem é Susana?" (Who is Susana?)
3. **Relationship Learning**: "minha filha" → Person(Susana, daughter, female)
4. **Context Building**: Daughter needs eye exam → Health tracking
5. **Proactive Follow-up**: "Quer que eu lembre você de marcar?" (Want me to remind you to schedule?)

### **Implementation Priority Queue**

**Phase 1: Activate Basic Memory Pipeline**
- [ ] Auto-trigger memory creation on message save
- [ ] Basic Portuguese entity extraction
- [ ] Simple relationship detection (filho/filha, pai/mãe, etc.)

**Phase 2: Natural Question Generation**  
- [ ] Unknown entity → curiosity questions
- [ ] Incomplete info → clarification requests
- [ ] Pattern-based follow-ups

**Phase 3: Proactive Intelligence**
- [ ] Time-based reminders ("3 months since last dentist")
- [ ] Pattern recognition ("You usually schedule Tuesdays at 2PM")
- [ ] Cross-context suggestions (family health → work calendar blocking)

**Phase 4: Memory Management UI**
- [ ] **User Memory Dashboard**: View personal memories, edit importance, delete memories
- [ ] **Admin Memory Console**: Monitor all user memories, debug pipeline, system health
- [ ] **Memory Visualization**: Entity relationship graphs, timeline views, context switching
- [ ] **Privacy Controls**: User can control what gets remembered and for how long

**Phase 5: Structured Profile System**
- [ ] **Personal Profile Forms**: Basic info, health, preferences with smart defaults
- [ ] **Work Context Setup**: Employment status, schedule, goals via dropdowns and forms
- [ ] **Family Members Management**: Add relatives with relationships, ages, needs, schedules
- [ ] **Smart Profile Updates**: Intentional edits + automatic enhancement through conversations

### **Technical Architecture Ready** 
The complete RAG system architecture is designed and documented above. The database schema, embedding pipeline, search algorithms, and memory compression are all specified and partially implemented.

**Next milestone:** Implement the automatic memory pipeline activation to handle real conversations like the Susana scenario.

## 🖥️ **Memory Management UI Specifications**

### **User Memory Dashboard (`/memories`)**
**Purpose:** Let users view, manage, and control their personal memories

```typescript
interface UserMemoryDashboard {
  // Memory List View
  memories: {
    id: string;
    content: string;
    summary: string;
    importance: 1-10;
    type: 'fact' | 'preference' | 'experience' | 'relationship';
    context: 'work' | 'personal' | 'family';
    entities: string[];
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
  }[];
  
  // Filter & Search
  filters: {
    context: 'all' | 'work' | 'personal' | 'family';
    type: 'all' | 'fact' | 'preference' | 'experience' | 'relationship';
    importance: { min: number; max: number };
    dateRange: { start: Date; end: Date };
    searchQuery: string;
  };
  
  // Actions
  actions: {
    editImportance(memoryId: string, newImportance: number): void;
    deleteMemory(memoryId: string): void;
    exportMemories(): void;
    bulkDeleteByDate(dateRange: DateRange): void;
  };
}
```

**UI Components:**
- **Memory Cards**: Content preview, importance slider, context badges
- **Search Bar**: Semantic search through memories
- **Filters Panel**: Context, type, importance, date range
- **Bulk Actions**: Select multiple memories for deletion/export
- **Privacy Settings**: Control what gets remembered, retention periods

### **Admin Memory Console (`/admin/memories`)**
**Purpose:** System monitoring, debugging, and user support

```typescript
interface AdminMemoryConsole {
  // System Overview
  systemStats: {
    totalUsers: number;
    totalMemories: number;
    memoriesCreatedToday: number;
    averageMemoriesPerUser: number;
    systemMemoryUsage: string;
    embeddingAPIUsage: {
      requestsToday: number;
      tokensUsed: number;
      costToday: number;
    };
  };
  
  // User Management
  userMemories: {
    userId: string;
    userEmail: string;
    memoryCount: number;
    lastActive: Date;
    storageUsed: string;
    memoryTypes: Record<string, number>;
    contexts: Record<string, number>;
  }[];
  
  // Memory Pipeline Debug
  pipelineHealth: {
    memoryCreationRate: number;
    entityExtractionSuccessRate: number;
    embeddingGenerationLatency: number;
    searchPerformance: {
      averageResponseTime: number;
      searchAccuracy: number;
    };
    errors: {
      timestamp: Date;
      type: string;
      message: string;
      userId?: string;
    }[];
  };
  
  // Actions
  adminActions: {
    viewUserMemories(userId: string): UserMemory[];
    debugMemoryPipeline(userId: string): PipelineDebugInfo;
    bulkDeleteUserMemories(userId: string): void;
    exportSystemMetrics(): void;
    regenerateEmbeddings(userId?: string): void;
  };
}
```

**Admin UI Features:**
- **System Dashboard**: Real-time metrics, usage graphs, error monitoring
- **User Explorer**: Browse all users, view their memory stats
- **Memory Inspector**: Deep dive into specific user memories
- **Pipeline Monitor**: Track embedding generation, entity extraction success
- **Debug Tools**: Regenerate embeddings, test search queries
- **Cost Tracking**: OpenAI API usage, embedding costs per user

### **Memory Visualization Components**

```typescript
// Entity Relationship Graph
interface EntityGraph {
  nodes: {
    id: string;
    name: string;
    type: 'person' | 'place' | 'organization' | 'event';
    context: string;
    importance: number;
    memoryCount: number;
  }[];
  
  edges: {
    from: string;
    to: string;
    relationship: string;
    strength: number;
  }[];
}

// Timeline View
interface MemoryTimeline {
  events: {
    date: Date;
    memories: Memory[];
    context: string;
    summary: string;
  }[];
  
  patterns: {
    type: 'recurring' | 'seasonal' | 'contextual';
    description: string;
    confidence: number;
  }[];
}

// Context Switch Analysis
interface ContextAnalysis {
  contexts: {
    name: 'work' | 'personal' | 'family';
    memoryCount: number;
    averageImportance: number;
    topEntities: string[];
    recentActivity: Date;
  }[];
  
  crossContextConnections: {
    entity: string;
    contexts: string[];
    connectionStrength: number;
  }[];
}
```

### **Privacy & Control Features**

```typescript
interface PrivacyControls {
  // Retention Settings
  retention: {
    defaultPeriod: '1month' | '3months' | '1year' | 'forever';
    contextSpecific: {
      work: string;
      personal: string;
      family: string;
    };
    importanceThreshold: number; // Auto-delete below this importance
  };
  
  // Memory Categories
  categories: {
    enabled: boolean;
    autoRemember: boolean;
    requireConfirmation: boolean;
  }[];
  
  // Data Export/Import
  dataManagement: {
    exportAllMemories(): File;
    importMemories(file: File): void;
    deleteAllMemories(): void;
    anonymizeMemories(): void;
  };
}
```

## 📝 **Structured Profile System (`/profile`)**

### **Bootstrap Intelligence Strategy**
Instead of waiting weeks for conversational discovery, users can quickly set up their context so MAGIS is immediately intelligent and helpful.

### **Personal Profile Section**
```typescript
interface PersonalProfile {
  basic: {
    name: string;
    age: number;
    location: string;           // "São Paulo, Brazil"
    timeZone: string;           // Auto-detected, user confirmable
    languages: string[];        // ["Portuguese", "English"]
  };
  
  preferences: {
    communicationStyle: 'brief' | 'detailed' | 'conversational';
    workingHours: { start: string; end: string }; // "09:00" - "18:00"
    responseSpeed: 'immediate' | 'thoughtful' | 'detailed';
    reminderPreference: 'proactive' | 'on-request' | 'minimal';
  };
  
  health: {
    allergies: string[];
    medications: string[];
    regularCheckups: {
      type: string;           // "dentist", "eye doctor", "general physician"
      frequency: string;      // "6 months", "1 year", "as needed"
      lastDate: Date | null;
      preferredDay: string;   // "Tuesday afternoons"
      provider: string;       // "Dr. Silva"
    }[];
    healthcareProviders: {
      name: string;
      specialty: string;
      phone: string;
      location: string;
    }[];
  };
}
```

### **Work Context Section**
```typescript
interface WorkContext {
  employment: {
    status: 'employed' | 'entrepreneur' | 'freelancer' | 'student' | 'retired' | 'unemployed';
    company: string;
    role: string;
    industry: string;         // Dropdown with common industries
    workType: 'full-time' | 'part-time' | 'contract' | 'consulting';
    startDate: Date;
  };
  
  schedule: {
    workingDays: string[];    // ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    workingHours: { start: string; end: string };
    lunchTime: { start: string; end: string };
    preferredMeetingTimes: string[]; // ["10:00-11:00", "14:00-15:00"]
    focusHours: { start: string; end: string }; // Deep work time
    breakPreferences: string;
  };
  
  goals: {
    currentProjects: string[];
    quarterlyGoals: string[];
    skillsDeveloping: string[];
    careerObjectives: string[];
  };
  
  workspace: {
    location: 'office' | 'home' | 'hybrid' | 'co-working' | 'client-sites';
    commute: string;          // "30 min by car", "1 hour by metro"
    workTools: string[];      // Software, equipment used daily
  };
}
```

### **Family Context Section**
```typescript
interface FamilyContext {
  members: {
    name: string;
    relationship: 'spouse' | 'partner' | 'child' | 'parent' | 'sibling' | 'grandparent' | 'other';
    age: number | null;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    needs: string[];          // ["regular checkups", "school schedule", "medication reminders"]
    schedule: string;         // "school 8am-3pm, soccer Tuesdays 6pm"
    importantDates: {
      type: 'birthday' | 'anniversary' | 'appointment' | 'school-event' | 'other';
      date: Date;
      recurring: boolean;
    }[];
    healthInfo: {
      allergies: string[];
      medications: string[];
      healthcareProviders: string[];
    };
    preferences: {
      favoriteActivities: string[];
      foodPreferences: string[];
      schoolInfo: string;     // For children: "10th grade at Colégio XYZ"
    };
  }[];
  
  household: {
    responsibilities: {
      task: string;           // "grocery shopping", "school pickup"
      assignedTo: string[];   // Can be multiple people
      frequency: string;      // "weekly", "daily", "as needed"
      preferredTime: string;
    }[];
    
    routines: {
      name: string;           // "morning routine", "weekend family time"
      schedule: string;       // "weekdays 7-8am", "Saturdays 10am-12pm"
      participants: string[];
      description: string;
    }[];
    
    emergencyContacts: {
      name: string;
      relationship: string;
      phone: string;
      priority: number;       // 1 = first contact
    }[];
  };
  
  traditions: {
    holidays: string[];       // Important family holidays
    annualEvents: string[];   // "summer vacation", "family reunion"
    weeklyTraditions: string[]; // "Sunday dinner", "movie night"
  };
}
```

### **UI Implementation Strategy**

#### **1. Progressive Onboarding (Optional but Recommended)**
```typescript
interface OnboardingFlow {
  step1_welcome: {
    title: "Welcome to MAGIS!";
    subtitle: "Let's set up your personal assistant";
    timeEstimate: "5-10 minutes";
    benefits: [
      "Instant intelligent responses",
      "Proactive reminders", 
      "Context-aware assistance"
    ];
  };
  
  step2_basic: {
    title: "About You";
    fields: ['name', 'location', 'timeZone', 'languages'];
    required: ['name'];
    timeEstimate: "2 minutes";
  };
  
  step3_work: {
    title: "Work Context (Optional)";
    conditional: "Do you want MAGIS to help with work-related tasks?";
    fields: ['status', 'workingHours', 'preferredMeetingTimes'];
    timeEstimate: "3 minutes";
  };
  
  step4_family: {
    title: "Family & Personal (Optional)";
    conditional: "Add family members for better assistance?";
    quickAdd: "Add family member";
    timeEstimate: "3 minutes";
  };
  
  step5_preferences: {
    title: "Communication Preferences";
    fields: ['communicationStyle', 'reminderPreference'];
    timeEstimate: "1 minute";
  };
}
```

#### **2. Settings Page Structure (`/settings/profile`)**
```typescript
interface ProfileSettings {
  tabs: [
    { id: 'personal', title: 'Personal Info', icon: 'user' },
    { id: 'work', title: 'Work Context', icon: 'briefcase' },
    { id: 'family', title: 'Family & Home', icon: 'home' },
    { id: 'health', title: 'Health & Wellness', icon: 'heart' },
    { id: 'preferences', title: 'Preferences', icon: 'settings' }
  ];
  
  smartDefaults: {
    timeZone: "auto-detect";
    workingHours: "09:00-18:00"; // Local business hours
    language: "browser-language";
    healthCheckups: [
      { type: "dentist", frequency: "6 months" },
      { type: "eye doctor", frequency: "1 year" },
      { type: "general physician", frequency: "1 year" }
    ];
  };
  
  validation: {
    required: ['name'];
    optional: ['everything else'];
    privacy: 'all fields completely optional';
  };
}
```

#### **3. Smart Profile Updates**
```typescript
interface SmartUpdates {
  // Intentional updates
  manualEdits: {
    addFamilyMember: () => void;
    updateWorkSchedule: () => void;
    editHealthProvider: () => void;
    bulkImport: (csvFile: File) => void; // Import from contacts/calendar
  };
  
  // Conversation-driven updates  
  conversationEnhancement: {
    trigger: "User mentions new info in chat";
    example: "Susana tem 16 anos" → Suggest updating Susana's age to 16;
    confirmation: "I noticed you mentioned Susana is 16. Should I update her profile?";
    autoApply: false; // Always ask permission
  };
  
  // Pattern recognition
  patternDetection: {
    trigger: "Recurring conversation patterns";
    example: "User always schedules dentist on Tuesdays" → Suggest adding to preferences;
    suggestions: "quiet, unobtrusive suggestions in chat";
  };
}
```

### **Privacy & Trust Features**
```typescript
interface PrivacyControls {
  visibility: {
    public: "Basic preferences (communication style, working hours)";
    private: "Family info, health data, personal details";
    confidential: "Emergency contacts, medical specifics";
  };
  
  dataControl: {
    editAnytime: true;
    deleteAnytime: true;
    exportAll: true;
    granularControl: "per field, per family member";
  };
  
  conversationUse: {
    basicInfo: "always available to MAGIS";
    sensitiveInfo: "only when directly relevant";
    confidentialInfo: "only when explicitly asked";
  };
}
```

This structured profile system creates an intelligent **bootstrap strategy** where MAGIS starts smart instead of spending weeks learning basic facts. Combined with conversational enhancement, it provides the perfect balance of user control and AI discovery! 🧠✨