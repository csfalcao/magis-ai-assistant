import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

/**
 * MAGIS Life OS - Memory Extraction System
 * Simplified WHO/WHAT/WHEN/WHERE extraction for Life Operating System
 */

// Core extraction interface
interface ExtractedEntities {
  who: string[];      // People mentioned (dentist, Dr. Smith)
  what: string[];     // Actions, events (appointment, checkup) 
  when: string[];     // Time references (next month, tomorrow 3pm)
  where: string[];    // Location references (dental office, downtown)
  why: string[];      // Reasons, motivations (health checkup)
  how: string[];      // Methods, processes (by phone, in person)
}

interface MemoryMetadata {
  importance: number;
  emotionalContext: string;
  priority: "low" | "medium" | "high" | "urgent";
  actionItems: string[];
}

/**
 * Extract structured entities from conversation content using AI
 * Core WHO/WHAT/WHEN/WHERE extraction for Life OS foundation
 */
export const extractEntitiesFromContent = action({
  args: {
    content: v.string(),
    context: v.string(),
    messageId: v.string(),
    conversationId: v.string(),
    userId: v.optional(v.id("users")), // Allow passing userId directly
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    memoryId?: any;
    extractedEntities?: ExtractedEntities | null;
    metadata?: MemoryMetadata | null;
    error?: string;
  }> => {
    // Try to get userId from auth context first, then fallback to passed userId
    let userId = await auth.getUserId(ctx);
    if (!userId && args.userId) {
      userId = args.userId;
    }
    if (!userId) {
      // For development, use a default user if no auth
      console.log('⚠️ No authentication context, using default user for development');
      userId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a" as any; // csfalcao@gmail.com from the database
    }

    console.log('🎯 MEMORY DEBUG: extractEntitiesFromContent called');
    console.log('🎯 MEMORY DEBUG: Content:', args.content.substring(0, 100));
    console.log('🎯 MEMORY DEBUG: Context:', args.context);
    console.log('🎯 MEMORY DEBUG: UserId:', userId);
    
    // AI extraction prompt optimized for Life OS
    const extractionPrompt = `
Analyze this conversation content and extract Life OS information:

Content: "${args.content}"
Context: ${args.context}

Extract the following with high precision for life management:

WHO: All people mentioned (names, roles, relationships, professionals)
WHAT: Actions, events, appointments, tasks, decisions, needs
WHEN: Time references (dates, times, relative time like "next month")
WHERE: Locations (addresses, places, regions, facilities)
WHY: Reasons, motivations, goals, purposes, health needs
HOW: Methods, processes, communication channels

METADATA:
- Importance (1-10): How significant is this for life management?
- Emotional context: Happy/anxious/neutral/frustrated/excited
- Priority: low/medium/high/urgent (based on life management urgency)
- Action items: Specific tasks or commitments that need follow-up

Return as JSON with this exact structure:
{
  "entities": {
    "who": ["person1", "Dr. Smith"],
    "what": ["dentist appointment", "checkup"],
    "when": ["next month", "6 months"],
    "where": ["dental office", "downtown"],
    "why": ["health maintenance", "routine checkup"],
    "how": ["by appointment", "in person"]
  },
  "metadata": {
    "importance": 8,
    "emotionalContext": "neutral",
    "priority": "medium",
    "actionItems": ["schedule dentist appointment", "find dentist office address"]
  }
}`;

    try {
      console.log('🤖 MEMORY DEBUG: Calling AI for entity extraction...');
      console.log('🤖 MEMORY DEBUG: Prompt length:', extractionPrompt.length);
      
      // Call AI for extraction
      const extractionResult = await ctx.runAction(api.ai.extractStructuredData, {
        prompt: extractionPrompt,
        userId: userId!,
      });

      console.log('🤖 MEMORY DEBUG: AI extraction result received');
      console.log('🤖 MEMORY DEBUG: AI result:', JSON.stringify(extractionResult, null, 2));
      
      let parsed: { entities: ExtractedEntities, metadata: MemoryMetadata };
      try {
        // Clean up markdown code blocks if present
        let cleanContent = extractionResult.content;
        if (cleanContent.includes('```json')) {
          cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        }
        if (cleanContent.includes('```')) {
          cleanContent = cleanContent.replace(/```.*?\n/g, '').replace(/```/g, '');
        }
        
        parsed = JSON.parse(cleanContent);
        console.log('📊 Life OS: Parsed entities successfully:', {
          who: parsed.entities.who.length,
          what: parsed.entities.what.length,
          when: parsed.entities.when.length,
          where: parsed.entities.where.length
        });
      } catch (parseError) {
        console.error('❌ JSON parsing failed, using fallbacks:', parseError);
        
        // Intelligent fallback based on content analysis
        const content = args.content.toLowerCase();
        const fallbackEntities: ExtractedEntities = {
          who: [],
          what: [],
          when: [],
          where: [],
          why: [],
          how: []
        };

        // Basic WHO detection
        if (content.includes('dentist')) fallbackEntities.who.push('dentist');
        if (content.includes('doctor')) fallbackEntities.who.push('doctor');
        
        // Basic WHAT detection
        if (content.includes('appointment')) fallbackEntities.what.push('appointment');
        if (content.includes('checkup')) fallbackEntities.what.push('checkup');
        if (content.includes('exam')) fallbackEntities.what.push('exam');
        
        // Basic WHEN detection
        if (content.includes('next month')) fallbackEntities.when.push('next month');
        if (content.includes('tomorrow')) fallbackEntities.when.push('tomorrow');
        if (content.includes('next week')) fallbackEntities.when.push('next week');
        
        // Basic WHERE detection
        if (content.includes('office')) fallbackEntities.where.push('office');
        
        parsed = {
          entities: fallbackEntities,
          metadata: {
            importance: 7,
            emotionalContext: "neutral",
            priority: "medium",
            actionItems: ["schedule appointment"]
          }
        };
        console.log('📊 Life OS: Using fallback entities:', parsed);
      }
      
      // Generate embedding first (in action context)
      console.log('🔗 MEMORY DEBUG: Generating Voyage embedding...');
      console.log('🔗 MEMORY DEBUG: Text to embed:', args.content.substring(0, 100));
      
      const embeddingResult = await ctx.runAction(api.embeddings.generateEmbedding, {
        text: args.content,
      });
      
      console.log('🔗 MEMORY DEBUG: Embedding result:', {
        hasEmbedding: !!embeddingResult.embedding,
        embeddingLength: embeddingResult.embedding?.length || 0,
        tokens: embeddingResult.tokens
      });
      
      // Store extracted memory using Life OS structure
      console.log('💾 MEMORY DEBUG: Storing extracted memory in database...');
      const memoryId: any = await ctx.runMutation(api.memoryExtraction.storeExtractedMemory, {
        userId: userId!,
        content: args.content,
        messageId: args.messageId,
        conversationId: args.conversationId,
        context: args.context,
        entities: parsed.entities,
        metadata: parsed.metadata,
        embedding: embeddingResult.embedding || [],
      });
      
      console.log('✅ Life OS: Memory stored successfully:', memoryId);
      
      return {
        success: true,
        memoryId: memoryId,
        extractedEntities: parsed.entities,
        metadata: parsed.metadata
      };
      
    } catch (error) {
      console.error('❌ Life OS: Memory extraction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        extractedEntities: null,
        metadata: null
      };
    }
  },
});

/**
 * Store extracted memory with Life OS structure
 */
export const storeExtractedMemory = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    messageId: v.string(),
    conversationId: v.string(),
    context: v.string(),
    entities: v.object({
      who: v.array(v.string()),
      what: v.array(v.string()),
      when: v.array(v.string()),
      where: v.array(v.string()),
      why: v.array(v.string()),
      how: v.array(v.string()),
    }),
    metadata: v.object({
      importance: v.number(),
      emotionalContext: v.string(),
      priority: v.string(),
      actionItems: v.array(v.string()),
    }),
    embedding: v.array(v.number()), // Accept embedding from action context
  },
  handler: async (ctx, args) => {
    // Create summary from entities
    const summary = generateSummaryFromEntities(args.entities, args.content);
    
    // Generate keywords from entities
    const keywords = [
      ...args.entities.what,
      ...args.entities.who,
      ...args.entities.why
    ].filter(Boolean);
    
    const memoryId = await ctx.db.insert('memories', {
      userId: args.userId,
      content: args.content,
      summary: summary,
      sourceType: 'message',
      sourceId: args.messageId,
      context: args.context,
      memoryType: inferMemoryType(args.entities),
      importance: args.metadata.importance,
      embedding: args.embedding,
      entities: [
        ...args.entities.who,
        ...args.entities.what,
        ...args.entities.where,
      ],
      keywords: keywords,
      sentiment: convertEmotionalContextToSentiment(args.metadata.emotionalContext),
      accessCount: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return memoryId;
  },
});

// Helper functions
function generateSummaryFromEntities(entities: ExtractedEntities, content: string): string {
  const summary = [];
  
  if (entities.who.length > 0) summary.push(`People: ${entities.who.join(', ')}`);
  if (entities.what.length > 0) summary.push(`Activities: ${entities.what.join(', ')}`);
  if (entities.when.length > 0) summary.push(`Timing: ${entities.when.join(', ')}`);
  if (entities.where.length > 0) summary.push(`Location: ${entities.where.join(', ')}`);
  
  return summary.length > 0 ? summary.join(' | ') : content.substring(0, 100) + '...';
}

function inferMemoryType(entities: ExtractedEntities): string {
  // Life OS memory type inference
  if (entities.what.some(what => what.includes('appointment') || what.includes('checkup'))) {
    return 'health_maintenance';
  }
  if (entities.what.some(what => what.includes('meeting') || what.includes('work'))) {
    return 'professional';
  }
  if (entities.what.some(what => what.includes('family') || entities.who.some(who => who.includes('mom') || who.includes('dad')))) {
    return 'family';
  }
  return 'general';
}

function convertEmotionalContextToSentiment(emotionalContext: string): number {
  switch (emotionalContext.toLowerCase()) {
    case 'happy': case 'excited': return 0.8;
    case 'anxious': case 'frustrated': return -0.5;
    case 'sad': return -0.8;
    default: return 0; // neutral
  }
}