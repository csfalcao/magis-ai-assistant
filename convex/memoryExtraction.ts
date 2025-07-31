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
    
    // Enhanced Single Table AI prompt with universal entity extraction and date resolution
    const classificationPrompt = `
Analyze this conversation content using MAGIS Enhanced Single Table Intelligence:

Content: "${args.content}"
Context: ${args.context}
Timestamp: ${new Date(conversationTimestamp).toISOString()}

STEP 1: CLASSIFY the content type:
- PROFILE: Biographical information about the user ("My birthday is Dec 29", "I work at Google", "I live in Miami")  
- MEMORY: Past events, preferences, experiences ("I love Italian food", "Had great dinner last night", "Meeting went well")
- EXPERIENCE: Future/planned events ("Dentist appointment next Friday", "Vacation next month", "Meeting tomorrow")

STEP 2: UNIVERSAL ENTITY EXTRACTION (for ALL classifications):
Extract people, organizations, and locations from the content:

- people: Array of {name: string, relationship?: string, confidence: number}
  * "my friend Sarah" → {name: "Sarah", relationship: "friend", confidence: 0.9}
  * "Dr. Smith" → {name: "Dr. Smith", relationship: "doctor", confidence: 0.9}
  * "with Mom" → {name: "Mom", relationship: "mother", confidence: 0.8}

- organizations: Array of {name: string, type?: string, role?: string, confidence: number}
  * "Google" → {name: "Google", type: "company", role: "workplace", confidence: 0.9}
  * "Luigi's restaurant" → {name: "Luigi's", type: "restaurant", role: "location", confidence: 0.9}
  * "downtown clinic" → {name: "Downtown Clinic", type: "medical", role: "service", confidence: 0.8}

- locations: Array of strings
  * ["downtown", "Miami", "Luigi's", "office"]

STEP 3: UNIVERSAL DATE RESOLUTION (for ALL classifications):
Convert ALL temporal references to structured dates with timestamps:
- "Dec 29" → {original: "Dec 29", type: "date", value: "2024-12-29", timestamp: 1703808000000, confidence: 0.9}
- "next Friday" → {original: "next Friday", type: "date", value: "2025-08-08", timestamp: 1754668800000, confidence: 0.9}
- "last night" → {original: "last night", type: "date", value: "2025-07-29", timestamp: 1753833600000, confidence: 0.8}
- "next week" → {original: "next week", type: "range", start: "2025-08-04", end: "2025-08-10", confidence: 0.8}

STEP 4: CLASSIFICATION-SPECIFIC DATA:
Based on classification, extract specialized data:

IF PROFILE: Extract personal attributes
- personalInfo: ["Birthday: December 29th", "Lives in: Miami"]
- workInfo: ["Company: Google", "Position: Software Engineer"] 
- preferences: ["Diet: Vegetarian", "Hobby: Photography"]
- serviceProviders: ["Dr. Smith - Dentist"]

IF MEMORY: Extract contextual information
- keywords: ["dinner", "restaurant", "great", "Italian"]
- entities: ["Sarah", "Luigi's", "downtown"]
- relationships: ["Sarah - friend", "Luigi's - favorite restaurant"]
- sentiment: "positive"
- emotionalContext: "happy"

IF EXPERIENCE: Extract event details
- scheduledDate: primary timestamp for the event
- participants: ["Dr. Smith", "Sarah"]
- location: "downtown"
- status: "pending"
- priority: "medium"

Return VALID JSON with this EXACT structure:

{
  "classification": "PROFILE|MEMORY|EXPERIENCE",
  
  // UNIVERSAL fields (all classifications get these)
  "resolvedDates": [
    {
      "original": "Dec 29",
      "type": "date", 
      "value": "2024-12-29",
      "timestamp": 1703808000000,
      "confidence": 0.9
    }
  ],
  
  "extractedEntities": {
    "people": [
      {"name": "Sarah", "relationship": "friend", "confidence": 0.9}
    ],
    "organizations": [
      {"name": "Google", "type": "company", "role": "workplace", "confidence": 0.9}
    ],
    "locations": ["downtown", "Miami"]
  },
  
  // CLASSIFICATION-SPECIFIC nested data (only include relevant section)
  "profileData": {
    "personalInfo": ["Birthday: December 29th"],
    "workInfo": ["Company: Google"],
    "preferences": ["Diet: Vegetarian"],
    "serviceProviders": ["Dr. Smith - Dentist"],
    "extractionConfidence": 0.9
  },
  
  // OR for MEMORY classification:
  "memoryData": {
    "keywords": ["dinner", "restaurant", "great"],
    "entities": ["Sarah", "Luigi's"],
    "relationships": ["Sarah - friend"],
    "sentiment": "positive",
    "emotionalContext": "happy"
  },
  
  // OR for EXPERIENCE classification:
  "experienceData": {
    "scheduledDate": 1754668800000,
    "participants": ["Dr. Smith"],
    "location": "downtown",
    "status": "pending",
    "priority": "medium"
  },
  
  "metadata": {
    "importance": 8,
    "emotionalContext": "neutral",
    "priority": "medium",
    "actionItems": [],
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
      
      // Store in enhanced single table with universal entity extraction
      memoryId = await ctx.runMutation(api.memoryExtraction.storeEnhancedMemory, {
        userId: userId!,
        content: args.content,
        messageId: args.messageId,
        conversationId: args.conversationId,
        context: args.context,
        extractedContent: extractedContent,
        embedding: embeddingResult.embedding || [],
      });
      
      console.log('✅ THREE-TIER DEBUG: Memory stored:', memoryId);
      
      // UNIVERSAL CONTACT PROCESSING (for all classifications)
      if (extractedContent.extractedEntities?.people?.length) {
        console.log('👥 ENHANCED: Processing extracted people for contact creation...');
        try {
          const contactsCreated = await ctx.runMutation(api.memoryExtraction.processExtractedContacts, {
            userId: userId!,
            extractedPeople: extractedContent.extractedEntities.people,
            memoryId: memoryId,
            context: args.context
          });
          console.log('✅ ENHANCED: Contacts processed:', contactsCreated);
        } catch (error) {
          console.error('❌ ENHANCED: Contact processing failed:', error);
        }
      }
      
      // Route to specialized systems based on classification
      if (extractedContent.classification === "PROFILE") {
        console.log('👤 THREE-TIER DEBUG: Processing PROFILE content...');
        try {
          profileUpdated = await ctx.runMutation(api.memoryExtraction.updateUserProfileMutation, {
            userId: userId!,
            profileEntities: extractedContent.profileEntities!,
            context: args.context
          });
        } catch (error) {
          console.error('❌ THREE-TIER: Profile update failed:', error);
          profileUpdated = false;
        }
      } else if (extractedContent.classification === "EXPERIENCE") {
        console.log('📅 THREE-TIER DEBUG: Processing EXPERIENCE content...');
        try {
          experienceId = await ctx.runMutation(api.memoryExtraction.createExperienceMutation, {
            userId: userId!,
            experienceEntities: extractedContent.experienceEntities!,
            context: args.context
          });
          
          // Generate hidden system task for proactive intelligence
          if (experienceId && extractedContent.experienceEntities?.resolvedDates?.length) {
            systemTaskId = await ctx.runMutation(api.memoryExtraction.generateSystemTaskMutation, {
              userId: userId!,
              experienceId,
              extractedContent
            });
          }
        } catch (error) {
          console.error('❌ THREE-TIER: Experience creation failed:', error);
          experienceId = null;
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
 * Store enhanced single table memory with universal entity extraction and date resolution
 */
export const storeEnhancedMemory = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    messageId: v.string(),
    conversationId: v.string(),
    context: v.string(),
    extractedContent: v.object({
      classification: v.string(),
      
      // Universal fields (all classifications)
      resolvedDates: v.optional(v.array(v.object({
        original: v.string(),
        type: v.string(),
        value: v.optional(v.string()),
        start: v.optional(v.string()),
        end: v.optional(v.string()),
        timestamp: v.optional(v.number()),
        confidence: v.number(),
      }))),
      
      extractedEntities: v.optional(v.object({
        people: v.optional(v.array(v.object({
          name: v.string(),
          relationship: v.optional(v.string()),
          confidence: v.number(),
        }))),
        organizations: v.optional(v.array(v.object({
          name: v.string(),
          type: v.optional(v.string()),
          role: v.optional(v.string()),
          confidence: v.number(),
        }))),
        locations: v.optional(v.array(v.string())),
      })),
      
      // Classification-specific nested data
      profileData: v.optional(v.object({
        personalInfo: v.optional(v.array(v.string())),
        workInfo: v.optional(v.array(v.string())),
        preferences: v.optional(v.array(v.string())),
        serviceProviders: v.optional(v.array(v.string())),
        extractionConfidence: v.optional(v.number()),
      })),
      
      memoryData: v.optional(v.object({
        keywords: v.optional(v.array(v.string())),
        entities: v.optional(v.array(v.string())),
        relationships: v.optional(v.array(v.string())),
        sentiment: v.optional(v.string()),
        emotionalContext: v.optional(v.string()),
      })),
      
      experienceData: v.optional(v.object({
        scheduledDate: v.optional(v.number()),
        participants: v.optional(v.array(v.string())),
        location: v.optional(v.string()),
        status: v.optional(v.string()),
        priority: v.optional(v.string()),
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
    const extractedContent = args.extractedContent as any;
    
    // Create summary based on classification type and universal entities
    const summary = generateEnhancedSummary(extractedContent, args.content);
    
    // Generate keywords from universal entities and classification-specific data
    const keywords = extractUniversalKeywords(extractedContent);
    
    // Generate entities array from universal entity extraction
    const entities = extractUniversalEntitiesArray(extractedContent);
    
    // Determine memory type from classification and content
    const memoryType = inferMemoryTypeFromClassification(extractedContent.classification, extractedContent);
    
    const memoryId = await ctx.db.insert('memories', {
      userId: args.userId,
      content: args.content,
      summary: summary,
      sourceType: 'message',
      sourceId: args.messageId,
      context: args.context,
      memoryType: memoryType,
      importance: extractedContent.metadata.importance,
      
      // THREE-TIER CLASSIFICATION SYSTEM (Enhanced Single Table)
      classification: extractedContent.classification,
      
      // UNIVERSAL FIELDS (all classifications get these)
      resolvedDates: extractedContent.resolvedDates || [],
      extractedEntities: extractedContent.extractedEntities || {},
      
      // CLASSIFICATION-SPECIFIC NESTED DATA
      profileData: extractedContent.profileData || null,
      memoryData: extractedContent.memoryData || null,
      experienceData: extractedContent.experienceData || null,
      
      // Vector embedding for semantic search
      embedding: args.embedding,
      
      // Legacy fields (backward compatibility)
      entities: entities,
      keywords: keywords,
      sentiment: convertEmotionalContextToSentiment(extractedContent.metadata.emotionalContext),
      extractedData: extractedContent, // Keep full data for backward compatibility
      
      // Usage tracking
      accessCount: 0,
      isActive: true,
      
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return memoryId;
  },
});

// Keep old function for backward compatibility
export const storeThreeTierMemory = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    messageId: v.string(),
    conversationId: v.string(),
    context: v.string(),
    extractedContent: v.any(),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    // Redirect to enhanced function
    return await ctx.runMutation(api.memoryExtraction.storeEnhancedMemory, args);
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
 * THREE-TIER MUTATION FUNCTIONS
 * These mutations handle database operations for specialized processing
 */

// Update user profile with extracted biographical data
export const updateUserProfileMutation = mutation({
  args: {
    userId: v.id("users"),
    profileEntities: v.object({
      personalInfo: v.array(v.string()),
      workInfo: v.array(v.string()),
      preferences: v.array(v.string()),
      serviceProviders: v.array(v.string()),
    }),
    context: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    try {
      console.log('👤 THREE-TIER: Updating user profile...', args.profileEntities);
      
      // Check if user profile exists
      const existingProfile = await ctx.db
        .query('profiles')
        .filter((q: any) => q.eq(q.field('userId'), args.userId))
        .first();
      
      const profileUpdates: any = {
        personalInfo: args.profileEntities.personalInfo,
        workInfo: args.profileEntities.workInfo,
        preferences: args.profileEntities.preferences,
        serviceProviders: args.profileEntities.serviceProviders,
        lastUpdated: Date.now(),
        extractionConfidence: 0.8,
      };
      
      if (existingProfile) {
        // Update existing profile
        await ctx.db.patch(existingProfile._id, {
          ...profileUpdates,
          updatedAt: Date.now(),
        });
      } else {
        // Create new profile
        await ctx.db.insert('profiles', {
          userId: args.userId,
          ...profileUpdates,
          completionScore: 60, // Initial score
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
  },
});

// Create experience record from extracted data
export const createExperienceMutation = mutation({
  args: {
    userId: v.id("users"),
    experienceEntities: v.object({
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
    }),
    context: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      console.log('📅 THREE-TIER: Creating experience record...', args.experienceEntities);
      
      const experienceId = await ctx.db.insert('experiences', {
        userId: args.userId,
        title: args.experienceEntities.what[0] || 'Unnamed Experience',
        description: `${args.experienceEntities.what.join(', ')}`,
        context: args.context,
        status: 'pending',
        participantNames: args.experienceEntities.who,
        locationName: args.experienceEntities.where[0] || null,
        resolvedDates: args.experienceEntities.resolvedDates,
        originalTimeReferences: args.experienceEntities.when,
        extractedEntities: args.experienceEntities,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      console.log('✅ THREE-TIER: Experience created:', experienceId);
      return experienceId;
    } catch (error) {
      console.error('❌ THREE-TIER: Experience creation failed:', error);
      return null;
    }
  },
});

// Generate hidden system task for proactive intelligence
export const generateSystemTaskMutation = mutation({
  args: {
    userId: v.id("users"),
    experienceId: v.id("experiences"),
    extractedContent: v.any(), // Full extracted content for task generation
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      console.log('🤖 THREE-TIER: Generating system task for proactive intelligence...');
      
      const experienceEntities = args.extractedContent.experienceEntities;
      const resolvedDates = experienceEntities?.resolvedDates || [];
      
      if (resolvedDates.length === 0) {
        console.log('⏭️ THREE-TIER: No resolved dates, skipping system task');
        return null;
      }
      
      // Calculate appropriate follow-up timing
      const primaryDate = resolvedDates.find((d: any) => d.confidence > 0.7) || resolvedDates[0];
      const followUpTiming = calculateFollowUpTiming(experienceEntities.what[0] || '', primaryDate);
      
      const systemTaskId = await ctx.db.insert('system_tasks', {
        userId: args.userId,
        experienceId: args.experienceId,
        taskType: 'proactive_followup',
        description: `Follow up on: ${experienceEntities.what.join(', ')}`,
        priority: args.extractedContent.metadata.priority,
        triggerDate: followUpTiming.triggerDate,
        status: 'pending',
        isHidden: true, // Hidden from user - magical UX
        metadata: {
          originalExperience: experienceEntities.what[0],
          participants: experienceEntities.who,
          expectedTiming: followUpTiming,
          extractedContent: args.extractedContent,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      console.log('✅ THREE-TIER: System task created:', systemTaskId);
      return systemTaskId;
    } catch (error) {
      console.error('❌ THREE-TIER: System task creation failed:', error);
      return null;
    }
  },
});

/**
 * ENHANCED SINGLE TABLE MUTATION FUNCTIONS
 */

// Process extracted people for smart contact creation
export const processExtractedContacts = mutation({
  args: {
    userId: v.id("users"),
    extractedPeople: v.array(v.object({
      name: v.string(),
      relationship: v.optional(v.string()),
      confidence: v.number(),
    })),
    memoryId: v.id("memories"),
    context: v.string(),
  },
  handler: async (ctx, args): Promise<number> => {
    let contactsCreated = 0;
    
    for (const person of args.extractedPeople) {
      try {
        // Check if contact already exists
        const existingContact = await ctx.db
          .query('contacts')
          .withIndex('by_name_type')
          .filter(q => q.and(
            q.eq(q.field('name'), person.name),
            q.eq(q.field('userId'), args.userId)
          ))
          .first();
        
        if (existingContact) {
          // Update existing contact with new interaction
          await ctx.db.patch(existingContact._id, {
            experienceCount: existingContact.experienceCount + 1,
            lastInteraction: Date.now(),
            notes: existingContact.notes + `\nMentioned in memory ${args.memoryId}`,
            updatedAt: Date.now(),
          });
          console.log(`✅ Updated existing contact: ${person.name}`);
        } else {
          // Create new contact with smart scope suggestion
          const suggestedScope = suggestContactScope(person.relationship || 'unknown');
          
          const contactId = await ctx.db.insert('contacts', {
            userId: args.userId,
            name: person.name,
            type: inferContactType(person.relationship || 'unknown'),
            context: args.context,
            
            // Family-aware scoping
            scope: 'personal', // Start as personal, can be elevated later
            suggestedScope: suggestedScope.scope,
            scopeConfidence: suggestedScope.confidence,
            
            // Basic relationship info
            relationships: [{
              userId: args.userId,
              relationship: person.relationship || 'unknown',
              notes: `First mentioned in memory ${args.memoryId}`,
              addedAt: Date.now(),
            }],
            
            // Contact completion tracking
            completionStatus: 'incomplete',
            completionScore: calculateInitialCompletionScore(person),
            completionPriority: prioritizeContactCompletion(person.relationship || 'unknown'),
            
            // Basic fields
            experienceCount: 1,
            averageRating: 0,
            lastInteraction: Date.now(),
            trustLevel: 'unknown',
            
            // Discovery tracking
            discoveryMethod: 'conversation',
            firstMention: Date.now(),
            notes: `Discovered through AI extraction. Relationship: ${person.relationship || 'unknown'}. Confidence: ${person.confidence}`,
            originalUserId: args.userId,
            
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          
          contactsCreated++;
          console.log(`✅ Created new contact: ${person.name} (${person.relationship})`);
        }
      } catch (error) {
        console.error(`❌ Failed to process contact ${person.name}:`, error);
      }
    }
    
    return contactsCreated;
  },
});

/**
 * ENHANCED HELPER FUNCTIONS FOR SINGLE TABLE SYSTEM
 */

// Generate enhanced summary from universal entities and classification data
function generateEnhancedSummary(extractedContent: any, originalContent: string): string {
  const { classification, extractedEntities } = extractedContent;
  
  const parts: string[] = [];
  
  // Add people
  if (extractedEntities?.people?.length) {
    const peopleStr = extractedEntities.people.map((p: any) => 
      p.relationship ? `${p.name} (${p.relationship})` : p.name
    ).join(', ');
    parts.push(`People: ${peopleStr}`);
  }
  
  // Add organizations/locations
  if (extractedEntities?.organizations?.length) {
    const orgsStr = extractedEntities.organizations.map((o: any) => 
      o.type ? `${o.name} (${o.type})` : o.name
    ).join(', ');
    parts.push(`Organizations: ${orgsStr}`);
  }
  
  if (extractedEntities?.locations?.length) {
    parts.push(`Locations: ${extractedEntities.locations.join(', ')}`);
  }
  
  // Add classification-specific summary
  if (classification === 'PROFILE' && extractedContent.profileData) {
    const pd = extractedContent.profileData;
    if (pd.personalInfo?.length) parts.push(`Personal: ${pd.personalInfo.join(', ')}`);
    if (pd.workInfo?.length) parts.push(`Work: ${pd.workInfo.join(', ')}`);
  } else if (classification === 'MEMORY' && extractedContent.memoryData) {
    const md = extractedContent.memoryData;
    if (md.keywords?.length) parts.push(`Keywords: ${md.keywords.join(', ')}`);
  } else if (classification === 'EXPERIENCE' && extractedContent.experienceData) {
    const ed = extractedContent.experienceData;
    if (ed.participants?.length) parts.push(`Participants: ${ed.participants.join(', ')}`);
    if (ed.location) parts.push(`Location: ${ed.location}`);
  }
  
  return parts.length > 0 ? parts.join(' | ') : originalContent.substring(0, 100) + '...';
}

// Extract universal keywords from all entity types
function extractUniversalKeywords(extractedContent: any): string[] {
  const keywords: string[] = [];
  
  // From extracted entities
  if (extractedContent.extractedEntities?.people?.length) {
    extractedContent.extractedEntities.people.forEach((p: any) => {
      keywords.push(p.name);
      if (p.relationship) keywords.push(p.relationship);
    });
  }
  
  if (extractedContent.extractedEntities?.organizations?.length) {
    extractedContent.extractedEntities.organizations.forEach((o: any) => {
      keywords.push(o.name);
      if (o.type) keywords.push(o.type);
    });
  }
  
  if (extractedContent.extractedEntities?.locations?.length) {
    keywords.push(...extractedContent.extractedEntities.locations);
  }
  
  // From classification-specific data
  if (extractedContent.memoryData?.keywords?.length) {
    keywords.push(...extractedContent.memoryData.keywords);
  }
  
  if (extractedContent.profileData?.workInfo?.length) {
    keywords.push(...extractedContent.profileData.workInfo);
  }
  
  return keywords.filter(Boolean).slice(0, 20); // Limit to 20 keywords
}

// Extract universal entities array for legacy compatibility
function extractUniversalEntitiesArray(extractedContent: any): string[] {
  const entities: string[] = [];
  
  if (extractedContent.extractedEntities?.people?.length) {
    entities.push(...extractedContent.extractedEntities.people.map((p: any) => p.name));
  }
  
  if (extractedContent.extractedEntities?.organizations?.length) {
    entities.push(...extractedContent.extractedEntities.organizations.map((o: any) => o.name));
  }
  
  if (extractedContent.extractedEntities?.locations?.length) {
    entities.push(...extractedContent.extractedEntities.locations);
  }
  
  return entities.filter(Boolean).slice(0, 15);
}

// Infer memory type from classification and content
function inferMemoryTypeFromClassification(classification: string, extractedContent: any): string {
  switch (classification) {
    case 'PROFILE':
      return 'profile';
    case 'EXPERIENCE':
      if (extractedContent.experienceData?.participants?.some((p: string) => 
        p.toLowerCase().includes('doctor') || p.toLowerCase().includes('dentist'))) {
        return 'health_maintenance';
      }
      return 'experience';
    case 'MEMORY':
    default:
      if (extractedContent.memoryData?.sentiment === 'positive') {
        return 'positive_experience';
      }
      return 'general';
  }
}

// Smart contact scope suggestion based on relationship type
function suggestContactScope(relationship: string): {scope: string, confidence: number} {
  const rel = relationship.toLowerCase();
  
  // High confidence family suggestions
  if (['doctor', 'dentist', 'physician', 'pediatrician'].some(r => rel.includes(r))) {
    return { scope: 'family', confidence: 0.9 };
  }
  
  if (['restaurant', 'mechanic', 'plumber', 'electrician'].some(r => rel.includes(r))) {
    return { scope: 'family', confidence: 0.8 };
  }
  
  // High confidence personal suggestions
  if (['friend', 'colleague', 'coworker', 'boss', 'manager'].some(r => rel.includes(r))) {
    return { scope: 'personal', confidence: 0.9 };
  }
  
  // Medium confidence suggestions
  if (['mother', 'father', 'mom', 'dad', 'parent'].some(r => rel.includes(r))) {
    return { scope: 'family', confidence: 0.7 };
  }
  
  // Default to personal with low confidence
  return { scope: 'personal', confidence: 0.3 };
}

// Infer contact type from relationship
function inferContactType(relationship: string): string {
  const rel = relationship.toLowerCase();
  
  if (['doctor', 'dentist', 'physician'].some(r => rel.includes(r))) return 'medical';
  if (['restaurant', 'cafe', 'bar'].some(r => rel.includes(r))) return 'restaurant';
  if (['friend', 'buddy', 'pal'].some(r => rel.includes(r))) return 'friend';
  if (['colleague', 'coworker', 'boss'].some(r => rel.includes(r))) return 'professional';
  if (['mechanic', 'plumber', 'electrician'].some(r => rel.includes(r))) return 'service';
  if (['mother', 'father', 'parent', 'sibling'].some(r => rel.includes(r))) return 'family';
  
  return 'general';
}

// Calculate initial completion score for contact
function calculateInitialCompletionScore(person: any): number {
  let score = 0;
  
  // Have name
  if (person.name) score += 20;
  
  // Have relationship
  if (person.relationship && person.relationship !== 'unknown') score += 30;
  
  // High confidence extraction
  if (person.confidence > 0.8) score += 20;
  
  return score;
}

// Prioritize contact completion based on relationship type
function prioritizeContactCompletion(relationship: string): string {
  const rel = relationship.toLowerCase();
  
  // High priority - service providers and medical
  if (['doctor', 'dentist', 'mechanic', 'plumber'].some(r => rel.includes(r))) {
    return 'high';
  }
  
  // Medium priority - frequently mentioned contacts
  if (['friend', 'colleague', 'restaurant'].some(r => rel.includes(r))) {
    return 'medium';
  }
  
  // Low priority - others
  return 'low';
}

/**
 * THREE-TIER HELPER FUNCTIONS (Legacy)
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