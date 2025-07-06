import { internalMutation, internalAction } from './_generated/server';
import { v } from 'convex/values';

// Simplified memory pipeline for Day 3 implementation
// Will be expanded with full RAG capabilities in future iterations

// Process a conversation and extract memories automatically
export const processConversationForMemories = internalAction({
  args: {
    conversationId: v.id('conversations'),
    userId: v.id('users'),
  },
  handler: async (ctx, args): Promise<any> => {
    // Simplified implementation - stores conversation summary as memory
    // In full implementation, this would:
    // 1. Extract user messages
    // 2. Analyze for important information
    // 3. Generate embeddings
    // 4. Store memories with proper metadata

    return {
      memoriesCreated: 0,
      memoriesFailed: 0,
      conversationId: args.conversationId,
      status: 'simplified_implementation',
    };
  },
});

// Determine if a message should be remembered
export const shouldRememberMessage = internalAction({
  args: {
    content: v.string(),
    context: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Simple heuristic for memory worthiness
    const content = args.content.toLowerCase();
    const personalIndicators = ['i ', 'my ', 'me ', 'mine', 'myself'];
    const planningWords = ['will', 'going to', 'plan', 'want', 'need', 'like', 'prefer'];
    const experienceWords = ['went', 'did', 'was', 'were', 'had', 'saw', 'met', 'tried'];
    
    const hasPersonal = personalIndicators.some(word => content.includes(word));
    const hasPlanning = planningWords.some(word => content.includes(word));
    const hasExperience = experienceWords.some(word => content.includes(word));
    
    const isLongEnough = args.content.length >= 50;
    const hasKeywords = hasPersonal || hasPlanning || hasExperience;
    
    const shouldRemember = isLongEnough && hasKeywords;
    
    return {
      remember: shouldRemember,
      reason: shouldRemember 
        ? `Contains important personal information`
        : 'Too short or lacks personal context',
      memoryType: hasExperience ? 'experience' : hasPlanning ? 'preference' : 'fact',
      importance: shouldRemember ? 7 : 3,
    };
  },
});

// Store a learning pattern
export const storeLearningPattern = internalMutation({
  args: {
    userId: v.id('users'),
    patternType: v.string(),
    category: v.string(),
    pattern: v.string(),
    confidence: v.number(),
    evidence: v.array(v.string()),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if similar pattern already exists
    const existingPatterns = await ctx.db
      .query('learningPatterns')
      .withIndex('by_user_category', (q) => 
        q.eq('userId', args.userId).eq('category', args.category)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // If similar pattern exists, update confidence instead of creating duplicate
    const similarPattern = existingPatterns.find(p => 
      p.pattern.toLowerCase().includes(args.pattern.toLowerCase().substring(0, 20))
    );

    if (similarPattern) {
      // Update existing pattern with new evidence
      await ctx.db.patch(similarPattern._id, {
        confidence: Math.min(1.0, similarPattern.confidence + args.confidence * 0.1),
        evidence: [...similarPattern.evidence, ...args.evidence],
        lastValidated: Date.now(),
        updatedAt: Date.now(),
      });
      return similarPattern._id;
    } else {
      // Create new pattern
      const patternId = await ctx.db.insert('learningPatterns', {
        userId: args.userId,
        patternType: args.patternType,
        category: args.category,
        pattern: args.pattern,
        confidence: args.confidence,
        evidence: args.evidence,
        context: args.context,
        applicableContexts: args.context ? [args.context] : ['work', 'personal', 'family'],
        isActive: true,
        contradictionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return patternId;
    }
  },
});

// Scheduled action to process recent conversations for memories
export const scheduleMemoryProcessing = internalAction({
  args: {},
  handler: async (ctx, args): Promise<any> => {
    // Placeholder for scheduled memory processing
    return { processed: 0, message: 'Memory processing scheduled - simplified implementation' };
  },
});