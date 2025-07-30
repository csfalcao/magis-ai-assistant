import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

/**
 * MAGIS Life OS - Three-Tier Intelligence Memory Extraction System
 * Classification-First Processing: WHO I AM / WHAT I DID / WHAT I'LL DO
 */

// Three-tier content classification
type ContentClassification = "PROFILE" | "MEMORY" | "EXPERIENCE";

// Date resolution types
interface ResolvedDate {
  original: string;
  type: "date" | "range";
  value?: string;        // Single date (YYYY-MM-DD)
  start?: string;        // Range start (YYYY-MM-DD)
  end?: string;          // Range end (YYYY-MM-DD)
  confidence: number;    // 0-1 confidence score
}

// Specialized entity extraction based on content type
interface ProfileEntities {
  personalInfo: string[];     // Birthday, name, location, family details
  workInfo: string[];         // Company, position, work details  
  preferences: string[];      // Diet, hobbies, communication style
  serviceProviders: string[]; // Doctors, dentists, professionals
}

interface MemoryEntities {
  keywords: string[];         // Important concepts and terms
  entities: string[];         // People, places, things mentioned
  relationships: string[];    // Connections between entities
  sentiment: string;          // Emotional tone
}

interface ExperienceEntities {
  who: string[];             // People involved
  what: string[];            // Actions, events, appointments
  when: string[];            // Original time references
  where: string[];           // Location references
  why: string[];             // Reasons, motivations
  how: string[];             // Methods, processes
  resolvedDates: ResolvedDate[]; // Processed temporal information
}

// Combined extraction result
interface ExtractedContent {
  classification: ContentClassification;
  profileEntities?: ProfileEntities;
  memoryEntities?: MemoryEntities;
  experienceEntities?: ExperienceEntities;
  metadata: {
    importance: number;
    emotionalContext: string;
    priority: "low" | "medium" | "high" | "urgent";
    actionItems: string[];
    confidence: number;
  };
}

/**
 * Three-Tier Intelligence Content Processing
 * Classification-First: WHO I AM / WHAT I DID / WHAT I'LL DO
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
    classification?: ContentClassification;
    memoryId?: any;
    profileUpdated?: boolean;
    experienceId?: any;
    systemTaskId?: any;
    extractedContent?: ExtractedContent | null;
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

    console.log('🎯 THREE-TIER DEBUG: extractEntitiesFromContent called');
    console.log('🎯 THREE-TIER DEBUG: Content:', args.content.substring(0, 100));
    console.log('🎯 THREE-TIER DEBUG: Context:', args.context);
    console.log('🎯 THREE-TIER DEBUG: UserId:', userId);
    
    // Get current timestamp for date resolution
    const conversationTimestamp = Date.now();
    
    // Three-Tier Classification-First AI prompt
    const classificationPrompt = `
Analyze this conversation content using MAGIS Three-Tier Intelligence:

Content: "${args.content}"
Context: ${args.context}
Timestamp: ${new Date(conversationTimestamp).toISOString()}

STEP 1: CLASSIFY the content type:
- PROFILE: Biographical information about the user ("My birthday is Dec 29", "I work at Google", "I live in Miami")  
- MEMORY: Past events, preferences, experiences ("I love Italian food", "Had great dinner last night", "Meeting went well")
- EXPERIENCE: Future/planned events ("Dentist appointment next Friday", "Vacation next month", "Meeting tomorrow")

STEP 2: EXTRACT entities based on classification:

IF PROFILE: Extract personal attributes
- personalInfo: Birthday, name, location, family details
- workInfo: Company, position, work details
- preferences: Diet, hobbies, communication style  
- serviceProviders: Doctors, dentists, professionals

IF MEMORY: Extract contextual information
- keywords: Important concepts and terms
- entities: People, places, things mentioned
- relationships: Connections between entities
- sentiment: Emotional tone

IF EXPERIENCE: Extract event details + resolve dates
- who: People involved
- what: Actions, events, appointments  
- when: Time references (original text)
- where: Location references
- why: Reasons, motivations
- how: Methods, processes
- resolvedDates: Convert relative dates to absolute dates

STEP 3: RESOLVE DATES (for EXPERIENCE only):
- "next Friday" → calculate actual date using timestamp
- "next week" → calculate date range (start/end)
- "tomorrow" → calculate specific date
- "next month" → calculate date range
- Include confidence score (0-1) for each resolution

Return JSON with this structure:
{
  "classification": "PROFILE|MEMORY|EXPERIENCE",
  "profileEntities": { ... } // Only if PROFILE
  "memoryEntities": { ... }  // Only if MEMORY  
  "experienceEntities": { ... } // Only if EXPERIENCE
  "metadata": {
    "importance": 8,
    "emotionalContext": "neutral",
    "priority": "medium", 
    "actionItems": ["specific tasks"],
    "confidence": 0.9
  }
}`;

    try {
      console.log('🤖 THREE-TIER DEBUG: Calling AI for classification and extraction...');
      console.log('🤖 THREE-TIER DEBUG: Prompt length:', classificationPrompt.length);
      
      // Single AI call for classification + specialized extraction
      const extractionResult = await ctx.runAction(api.ai.extractStructuredData, {
        prompt: classificationPrompt,
        userId: userId!,
      });

      console.log('🤖 THREE-TIER DEBUG: AI extraction result received');
      console.log('🤖 THREE-TIER DEBUG: AI result:', JSON.stringify(extractionResult, null, 2));
      
      let extractedContent: ExtractedContent;
      try {
        // Clean up markdown code blocks if present
        let cleanContent = extractionResult.content;
        if (cleanContent.includes('```json')) {
          cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        }
        if (cleanContent.includes('```')) {
          cleanContent = cleanContent.replace(/```.*?\n/g, '').replace(/```/g, '');
        }
        
        const parsed = JSON.parse(cleanContent);
        
        // Ensure classification is properly typed
        const classification = parsed.classification as ContentClassification;
        
        extractedContent = {
          ...parsed,
          classification,
        } as ExtractedContent;
        
        console.log('📊 THREE-TIER: Parsed content successfully:', {
          classification: extractedContent.classification,
          confidence: extractedContent.metadata.confidence,
          importance: extractedContent.metadata.importance
        });
      } catch (parseError) {
        console.error('❌ JSON parsing failed, using intelligent fallbacks:', parseError);
        
        // Intelligent fallback classification
        const content = args.content.toLowerCase();
        let classification: ContentClassification = "MEMORY"; // Default to memory
        
        // Profile detection
        if (content.includes('my birthday') || content.includes('i work at') || 
            content.includes('i live in') || content.includes('my name is')) {
          classification = "PROFILE";
        }
        
        // Experience detection  
        if (content.includes('appointment') || content.includes('meeting') || 
            content.includes('next') || content.includes('tomorrow') || 
            content.includes('will') || content.includes('going to')) {
          classification = "EXPERIENCE";
        }
        
        // Create fallback based on classification
        extractedContent = createFallbackExtraction(args.content, classification, conversationTimestamp);
        console.log('📊 THREE-TIER: Using fallback extraction:', extractedContent);
      }
      
      // Generate embedding for memory storage
      console.log('🔗 THREE-TIER DEBUG: Generating Voyage embedding...');
      const embeddingResult = await ctx.runAction(api.embeddings.generateEmbedding, {
        text: args.content,
      });
      
      console.log('🔗 THREE-TIER DEBUG: Embedding result:', {
        hasEmbedding: !!embeddingResult.embedding,
        embeddingLength: embeddingResult.embedding?.length || 0,
        tokens: embeddingResult.tokens
      });
      
      // Route to appropriate systems based on classification
      let memoryId: any = null;
      let profileUpdated = false;
      let experienceId: any = null;
      let systemTaskId: any = null;
      
      console.log('🔄 THREE-TIER DEBUG: Routing content based on classification:', extractedContent.classification);
      
      // Always create memory for conversational context
      memoryId = await ctx.runMutation(api.memoryExtraction.storeThreeTierMemory, {
        userId: userId!,
        content: args.content,
        messageId: args.messageId,
        conversationId: args.conversationId,
        context: args.context,
        extractedContent: extractedContent,
        embedding: embeddingResult.embedding || [],
      });
      
      console.log('✅ THREE-TIER DEBUG: Memory stored:', memoryId);
      
      // Route to specialized systems based on classification
      if (extractedContent.classification === "PROFILE") {
        console.log('👤 THREE-TIER DEBUG: Processing PROFILE content...');
        profileUpdated = await updateUserProfile(ctx, userId!, extractedContent.profileEntities!, args.context);
      } else if (extractedContent.classification === "EXPERIENCE") {
        console.log('📅 THREE-TIER DEBUG: Processing EXPERIENCE content...');
        experienceId = await createExperienceFromContent(ctx, userId!, extractedContent.experienceEntities!, args.context);
        
        // Generate hidden system task for proactive intelligence
        if (experienceId && extractedContent.experienceEntities?.resolvedDates?.length) {
          systemTaskId = await generateSystemTask(ctx, userId!, experienceId, extractedContent);
        }
      }
      
      console.log('✅ THREE-TIER DEBUG: Processing complete:', {
        classification: extractedContent.classification,
        memoryId,
        profileUpdated,
        experienceId,
        systemTaskId
      });
      
      return {
        success: true,
        classification: extractedContent.classification,
        memoryId,
        profileUpdated,
        experienceId,
        systemTaskId,
        extractedContent
      };
      
    } catch (error) {
      console.error('❌ THREE-TIER: Processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        extractedContent: null
      };
    }
  },
});

/**
 * Store three-tier extracted memory with Life OS structure
 */
export const storeThreeTierMemory = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    messageId: v.string(),
    conversationId: v.string(),
    context: v.string(),
    extractedContent: v.object({
      classification: v.string(),
      profileEntities: v.optional(v.object({
        personalInfo: v.array(v.string()),
        workInfo: v.array(v.string()),
        preferences: v.array(v.string()),
        serviceProviders: v.array(v.string()),
      })),
      memoryEntities: v.optional(v.object({
        keywords: v.array(v.string()),
        entities: v.array(v.string()),
        relationships: v.array(v.string()),
        sentiment: v.string(),
      })),
      experienceEntities: v.optional(v.object({
        who: v.array(v.string()),
        what: v.array(v.string()),
        when: v.array(v.string()),
        where: v.array(v.string()),
        why: v.array(v.string()),
        how: v.array(v.string()),
        resolvedDates: v.array(v.object({
          original: v.string(),
          type: v.string(),
          value: v.optional(v.string()),
          start: v.optional(v.string()),
          end: v.optional(v.string()),
          confidence: v.number(),
        })),
      })),
      metadata: v.object({
        importance: v.number(),
        emotionalContext: v.string(),
        priority: v.string(),
        actionItems: v.array(v.string()),
        confidence: v.number(),
      }),
    }),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    // Cast to proper TypeScript interface  
    const extractedContent = args.extractedContent as ExtractedContent;
    
    // Create summary based on classification type
    const summary = generateThreeTierSummary(extractedContent, args.content);
    
    // Generate keywords based on extracted content
    const keywords = extractKeywordsFromThreeTier(extractedContent);
    
    // Determine entities array for vector search
    const entities = extractEntitiesArray(extractedContent);
    
    const memoryId = await ctx.db.insert('memories', {
      userId: args.userId,
      content: args.content,
      summary: summary,
      sourceType: 'message',
      sourceId: args.messageId,
      context: args.context,
      memoryType: inferThreeTierMemoryType(extractedContent),
      importance: extractedContent.metadata.importance,
      embedding: args.embedding,
      entities: entities,
      keywords: keywords,
      sentiment: convertEmotionalContextToSentiment(extractedContent.metadata.emotionalContext),
      accessCount: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Store three-tier classification for future use
      classification: extractedContent.classification,
      extractedData: extractedContent,
    });

    return memoryId;
  },
});

/**
 * Legacy memory storage for backward compatibility
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
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    // Legacy function - redirect to three-tier system
    const extractedContent: ExtractedContent = {
      classification: "MEMORY",
      memoryEntities: {
        keywords: args.entities.what,
        entities: [...args.entities.who, ...args.entities.where],
        relationships: [],
        sentiment: args.metadata.emotionalContext,
      },
      metadata: {
        importance: args.metadata.importance,
        emotionalContext: args.metadata.emotionalContext,
        priority: args.metadata.priority as "low" | "medium" | "high" | "urgent",
        actionItems: args.metadata.actionItems,
        confidence: 0.7, // Default confidence for legacy
      },
    };
    
    return await ctx.runMutation(api.memoryExtraction.storeThreeTierMemory, {
      userId: args.userId,
      content: args.content,
      messageId: args.messageId,
      conversationId: args.conversationId,
      context: args.context,
      extractedContent,
      embedding: args.embedding,
    });
  },
});

/**
 * THREE-TIER HELPER FUNCTIONS
 */

// Create intelligent fallback when AI parsing fails
function createFallbackExtraction(content: string, classification: ContentClassification, timestamp: number): ExtractedContent {
  const lowerContent = content.toLowerCase();
  
  if (classification === "PROFILE") {
    return {
      classification,
      profileEntities: {
        personalInfo: extractPersonalInfoFallback(lowerContent),
        workInfo: extractWorkInfoFallback(lowerContent),
        preferences: extractPreferencesFallback(lowerContent),
        serviceProviders: extractServiceProvidersFallback(lowerContent),
      },
      metadata: {
        importance: 6,
        emotionalContext: "neutral",
        priority: "medium",
        actionItems: [],
        confidence: 0.5, // Lower confidence for fallback
      },
    };
  } else if (classification === "EXPERIENCE") {
    return {
      classification,
      experienceEntities: {
        who: extractWhoFallback(lowerContent),
        what: extractWhatFallback(lowerContent),
        when: extractWhenFallback(lowerContent),
        where: extractWhereFallback(lowerContent),
        why: [],
        how: [],
        resolvedDates: resolveDatesFallback(lowerContent, timestamp),
      },
      metadata: {
        importance: 7,
        emotionalContext: "neutral",
        priority: "medium",
        actionItems: [],
        confidence: 0.6,
      },
    };
  } else {
    // MEMORY fallback
    return {
      classification: "MEMORY",
      memoryEntities: {
        keywords: extractKeywordsFallback(lowerContent),
        entities: extractEntitiesFallback(lowerContent),
        relationships: [],
        sentiment: "neutral",
      },
      metadata: {
        importance: 5,
        emotionalContext: "neutral",
        priority: "low",
        actionItems: [],
        confidence: 0.4,
      },
    };
  }
}

// Update user profile with extracted biographical data
async function updateUserProfile(ctx: any, userId: string, profileEntities: ProfileEntities, context: string): Promise<boolean> {
  try {
    console.log('👤 THREE-TIER: Updating user profile...', profileEntities);
    
    // Check if user profile exists
    const existingProfile = await ctx.db
      .query('profiles')
      .filter((q: any) => q.eq(q.field('userId'), userId))
      .first();
    
    const profileUpdates: any = {};
    
    // Process personal info updates
    if (profileEntities.personalInfo.length > 0) {
      profileUpdates.personalInfo = profileEntities.personalInfo;
    }
    
    // Process work info updates
    if (profileEntities.workInfo.length > 0) {
      profileUpdates.workInfo = profileEntities.workInfo;
    }
    
    // Process preferences updates
    if (profileEntities.preferences.length > 0) {
      profileUpdates.preferences = profileEntities.preferences;
    }
    
    // Process service providers (doctors, dentists, etc.)
    if (profileEntities.serviceProviders.length > 0) {
      profileUpdates.serviceProviders = profileEntities.serviceProviders;
    }
    
    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        ...profileUpdates,
        updatedAt: Date.now(),
      });
    } else {
      // Create new profile
      await ctx.db.insert('profiles', {
        userId,
        ...profileUpdates,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    console.log('✅ THREE-TIER: Profile updated successfully');
    return true;
  } catch (error) {
    console.error('❌ THREE-TIER: Profile update failed:', error);
    return false;
  }
}

// Create experience record from extracted data
async function createExperienceFromContent(ctx: any, userId: string, experienceEntities: ExperienceEntities, context: string): Promise<any> {
  try {
    console.log('📅 THREE-TIER: Creating experience record...', experienceEntities);
    
    const experienceId = await ctx.db.insert('experiences', {
      userId,
      title: experienceEntities.what[0] || 'Unnamed Experience',
      description: `${experienceEntities.what.join(', ')}`,
      participantNames: experienceEntities.who,
      locationName: experienceEntities.where[0] || null,
      context,
      status: 'pending',
      resolvedDates: experienceEntities.resolvedDates,
      originalTimeReferences: experienceEntities.when,
      extractedEntities: experienceEntities,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log('✅ THREE-TIER: Experience created:', experienceId);
    return experienceId;
  } catch (error) {
    console.error('❌ THREE-TIER: Experience creation failed:', error);
    return null;
  }
}

// Generate hidden system task for proactive intelligence
async function generateSystemTask(ctx: any, userId: string, experienceId: any, extractedContent: ExtractedContent): Promise<any> {
  try {
    console.log('🤖 THREE-TIER: Generating system task for proactive intelligence...');
    
    const experienceEntities = extractedContent.experienceEntities!;
    const resolvedDates = experienceEntities.resolvedDates;
    
    if (resolvedDates.length === 0) {
      console.log('⏭️ THREE-TIER: No resolved dates, skipping system task');
      return null;
    }
    
    // Calculate appropriate follow-up timing
    const primaryDate = resolvedDates.find(d => d.confidence > 0.7) || resolvedDates[0];
    const followUpTiming = calculateFollowUpTiming(experienceEntities.what[0] || '', primaryDate);
    
    const systemTaskId = await ctx.db.insert('system_tasks', {
      userId,
      experienceId,
      taskType: 'proactive_followup',
      triggerDate: followUpTiming.triggerDate,
      priority: extractedContent.metadata.priority,
      description: `Follow up on: ${experienceEntities.what.join(', ')}`,
      metadata: {
        originalExperience: experienceEntities.what[0],
        participants: experienceEntities.who,
        expectedTiming: followUpTiming,
        extractedContent,
      },
      status: 'pending',
      isHidden: true, // Hidden from user - magical UX
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log('✅ THREE-TIER: System task created:', systemTaskId);
    return systemTaskId;
  } catch (error) {
    console.error('❌ THREE-TIER: System task creation failed:', error);
    return null;
  }
}

// Calculate appropriate follow-up timing based on experience type
function calculateFollowUpTiming(experienceType: string, resolvedDate: ResolvedDate): any {
  const baseDate = resolvedDate.value || resolvedDate.start;
  if (!baseDate) return { triggerDate: Date.now() + (24 * 60 * 60 * 1000) }; // Default: 1 day
  
  const experienceDate = new Date(baseDate).getTime();
  const experienceLower = experienceType.toLowerCase();
  
  // Health appointments: follow up 4 hours after
  if (experienceLower.includes('dentist') || experienceLower.includes('doctor') || 
      experienceLower.includes('checkup') || experienceLower.includes('appointment')) {
    return {
      triggerDate: experienceDate + (4 * 60 * 60 * 1000), // 4 hours later
      reason: 'health_followup'
    };
  }
  
  // Meetings: follow up next business day
  if (experienceLower.includes('meeting') || experienceLower.includes('interview')) {
    return {
      triggerDate: experienceDate + (24 * 60 * 60 * 1000), // Next day
      reason: 'meeting_followup'
    };
  }
  
  // Events/dinners: follow up next morning
  if (experienceLower.includes('dinner') || experienceLower.includes('event') || 
      experienceLower.includes('party')) {
    return {
      triggerDate: experienceDate + (18 * 60 * 60 * 1000), // Next morning
      reason: 'experience_followup'
    };
  }
  
  // Default: follow up next day
  return {
    triggerDate: experienceDate + (24 * 60 * 60 * 1000),
    reason: 'general_followup'
  };
}

// Three-tier summary generation
function generateThreeTierSummary(extractedContent: ExtractedContent, originalContent: string): string {
  const { classification } = extractedContent;
  
  if (classification === "PROFILE" && extractedContent.profileEntities) {
    const parts = [];
    const pe = extractedContent.profileEntities;
    if (pe.personalInfo.length > 0) parts.push(`Personal: ${pe.personalInfo.join(', ')}`);
    if (pe.workInfo.length > 0) parts.push(`Work: ${pe.workInfo.join(', ')}`);
    if (pe.preferences.length > 0) parts.push(`Preferences: ${pe.preferences.join(', ')}`);
    return parts.length > 0 ? parts.join(' | ') : originalContent.substring(0, 100);
  }
  
  if (classification === "EXPERIENCE" && extractedContent.experienceEntities) {
    const ee = extractedContent.experienceEntities;
    const parts = [];
    if (ee.what.length > 0) parts.push(`Activity: ${ee.what.join(', ')}`);
    if (ee.who.length > 0) parts.push(`With: ${ee.who.join(', ')}`);
    if (ee.when.length > 0) parts.push(`When: ${ee.when.join(', ')}`);
    if (ee.where.length > 0) parts.push(`Where: ${ee.where.join(', ')}`);
    return parts.length > 0 ? parts.join(' | ') : originalContent.substring(0, 100);
  }
  
  if (classification === "MEMORY" && extractedContent.memoryEntities) {
    const me = extractedContent.memoryEntities;
    const parts = [];
    if (me.keywords.length > 0) parts.push(`Keywords: ${me.keywords.join(', ')}`);
    if (me.entities.length > 0) parts.push(`Entities: ${me.entities.join(', ')}`);
    return parts.length > 0 ? parts.join(' | ') : originalContent.substring(0, 100);
  }
  
  return originalContent.substring(0, 100) + '...';
}

// Extract keywords for search optimization
function extractKeywordsFromThreeTier(extractedContent: ExtractedContent): string[] {
  const keywords: string[] = [];
  
  if (extractedContent.profileEntities) {
    keywords.push(...extractedContent.profileEntities.personalInfo);
    keywords.push(...extractedContent.profileEntities.workInfo);
    keywords.push(...extractedContent.profileEntities.preferences);
  }
  
  if (extractedContent.memoryEntities) {
    keywords.push(...extractedContent.memoryEntities.keywords);
    keywords.push(...extractedContent.memoryEntities.entities);
  }
  
  if (extractedContent.experienceEntities) {
    keywords.push(...extractedContent.experienceEntities.what);
    keywords.push(...extractedContent.experienceEntities.who);
    keywords.push(...extractedContent.experienceEntities.why);
  }
  
  return keywords.filter(Boolean).slice(0, 20); // Limit keywords
}

// Extract entities array for vector search
function extractEntitiesArray(extractedContent: ExtractedContent): string[] {
  const entities: string[] = [];
  
  if (extractedContent.profileEntities) {
    entities.push(...extractedContent.profileEntities.personalInfo);
    entities.push(...extractedContent.profileEntities.serviceProviders);
  }
  
  if (extractedContent.memoryEntities) {
    entities.push(...extractedContent.memoryEntities.entities);
  }
  
  if (extractedContent.experienceEntities) {
    entities.push(...extractedContent.experienceEntities.who);
    entities.push(...extractedContent.experienceEntities.what);
    entities.push(...extractedContent.experienceEntities.where);
  }
  
  return entities.filter(Boolean).slice(0, 15); // Limit entities
}

// Infer memory type from three-tier classification
function inferThreeTierMemoryType(extractedContent: ExtractedContent): string {
  const { classification } = extractedContent;
  
  if (classification === "PROFILE") return 'profile';
  if (classification === "EXPERIENCE") {
    const ee = extractedContent.experienceEntities;
    if (ee && ee.what.some(what => what.includes('appointment') || what.includes('checkup'))) {
      return 'health_maintenance';
    }
    if (ee && ee.what.some(what => what.includes('meeting') || what.includes('work'))) {
      return 'professional';
    }
    return 'experience';
  }
  
  return 'general';
}

// FALLBACK EXTRACTION HELPERS
function extractPersonalInfoFallback(content: string): string[] {
  const info: string[] = [];
  if (content.includes('birthday') || content.includes('born')) info.push('birthday mentioned');
  if (content.includes('live in') || content.includes('from')) info.push('location mentioned');
  if (content.includes('family') || content.includes('married')) info.push('family mentioned');
  return info;
}

function extractWorkInfoFallback(content: string): string[] {
  const info: string[] = [];
  if (content.includes('work at') || content.includes('company')) info.push('company mentioned');
  if (content.includes('job') || content.includes('position')) info.push('position mentioned');
  return info;
}

function extractPreferencesFallback(content: string): string[] {
  const prefs: string[] = [];
  if (content.includes('like') || content.includes('love')) prefs.push('preference mentioned');
  if (content.includes('hate') || content.includes('dislike')) prefs.push('dislike mentioned');
  return prefs;
}

function extractServiceProvidersFallback(content: string): string[] {
  const providers: string[] = [];
  if (content.includes('doctor') || content.includes('dr.')) providers.push('doctor');
  if (content.includes('dentist')) providers.push('dentist');
  return providers;
}

function extractWhoFallback(content: string): string[] {
  const who: string[] = [];
  const matches = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (matches) who.push(...matches.slice(0, 3));
  return who;
}

function extractWhatFallback(content: string): string[] {
  const what: string[] = [];
  if (content.includes('appointment')) what.push('appointment');
  if (content.includes('meeting')) what.push('meeting');
  if (content.includes('dinner')) what.push('dinner');
  return what;
}

function extractWhenFallback(content: string): string[] {
  const when: string[] = [];
  const timeWords = ['tomorrow', 'next week', 'next month', 'friday', 'monday', 'today'];
  timeWords.forEach(word => {
    if (content.includes(word)) when.push(word);
  });
  return when;
}

function extractWhereFallback(content: string): string[] {
  const where: string[] = [];
  if (content.includes('downtown')) where.push('downtown');
  if (content.includes('office')) where.push('office');
  return where;
}

function extractKeywordsFallback(content: string): string[] {
  return content.split(' ').filter(word => word.length > 3).slice(0, 5);
}

function extractEntitiesFallback(content: string): string[] {
  const matches = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  return matches ? matches.slice(0, 3) : [];
}

function resolveDatesFallback(content: string, timestamp: number): ResolvedDate[] {
  const dates: ResolvedDate[] = [];
  const now = new Date(timestamp);
  
  if (content.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dates.push({
      original: 'tomorrow',
      type: 'date',
      value: tomorrow.toISOString().split('T')[0],
      confidence: 0.9
    });
  }
  
  if (content.includes('next week')) {
    const nextWeekStart = new Date(now);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
    
    dates.push({
      original: 'next week',
      type: 'range',
      start: nextWeekStart.toISOString().split('T')[0],
      end: nextWeekEnd.toISOString().split('T')[0],
      confidence: 0.8
    });
  }
  
  return dates;
}

// LEGACY HELPER FUNCTIONS
function generateSummaryFromEntities(entities: any, content: string): string {
  const summary = [];
  
  if (entities.who?.length > 0) summary.push(`People: ${entities.who.join(', ')}`);
  if (entities.what?.length > 0) summary.push(`Activities: ${entities.what.join(', ')}`);
  if (entities.when?.length > 0) summary.push(`Timing: ${entities.when.join(', ')}`);
  if (entities.where?.length > 0) summary.push(`Location: ${entities.where.join(', ')}`);
  
  return summary.length > 0 ? summary.join(' | ') : content.substring(0, 100) + '...';
}

function inferMemoryType(entities: any): string {
  if (entities.what?.some((what: string) => what.includes('appointment') || what.includes('checkup'))) {
    return 'health_maintenance';
  }
  if (entities.what?.some((what: string) => what.includes('meeting') || what.includes('work'))) {
    return 'professional';
  }
  if (entities.what?.some((what: string) => what.includes('family') || entities.who?.some((who: string) => who.includes('mom') || who.includes('dad')))) {
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