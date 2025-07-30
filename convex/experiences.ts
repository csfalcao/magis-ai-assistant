import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

// Simple experience detection and management with duplicate prevention

// Detect experiences from conversation messages
export const detectAndCreateExperience = action({
  args: {
    messageContent: v.string(),
    conversationId: v.id("conversations"),
    context: v.string(), // 'work', 'personal', 'family'
    userId: v.optional(v.id("users")), // Allow passing userId directly
  },
  handler: async (ctx, args): Promise<any> => {
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

    // Simple keyword-based experience detection
    const content = args.messageContent.toLowerCase();
    const experience = await detectExperienceFromText(content);
    
    if (!experience) {
      return null; // No experience detected
    }

    // Check for duplicates before creating
    const isDuplicate = await ctx.runQuery(api.experiences.checkForDuplicates, {
      experienceType: experience.type,
      title: experience.title,
      scheduledTimeframe: experience.scheduledTimeframe,
      context: args.context,
    });

    if (isDuplicate) {
      console.log("Duplicate experience detected, skipping creation");
      return null;
    }

    // Create the experience
    const experienceId = await ctx.runMutation(api.experiences.createExperience, {
      title: experience.title,
      description: experience.description,
      experienceType: experience.type,
      context: args.context,
      scheduledTimeframe: experience.scheduledTimeframe,
      importance: experience.importance,
      userId: userId || undefined, // Convert null to undefined for TypeScript
    });

    return experienceId;
  },
});

// Check for duplicate experiences
export const checkForDuplicates = query({
  args: {
    experienceType: v.string(),
    title: v.string(),
    scheduledTimeframe: v.string(),
    context: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return false;
    }

    // Get recent experiences (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const recentExperiences = await ctx.db
      .query('experiences')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.gte(q.field('createdAt'), thirtyDaysAgo))
      .collect();

    // Check for duplicates using fuzzy matching
    const isDuplicate = recentExperiences.some(existing => {
      // Same experience type
      if (existing.experienceType !== args.experienceType) return false;
      
      // Same context
      if (existing.context !== args.context) return false;
      
      // Similar title (simple word matching)
      const titleSimilarity = calculateSimpleSimilarity(args.title, existing.title);
      if (titleSimilarity > 0.7) return true;
      
      // Same timeframe mentioned
      if (args.scheduledTimeframe && existing.scheduledTimeframe === args.scheduledTimeframe) return true;
      
      return false;
    });

    return isDuplicate;
  },
});

// Create a new experience
export const createExperience = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    experienceType: v.string(),
    context: v.string(),
    scheduledTimeframe: v.optional(v.string()), // "next month", "tomorrow", etc.
    importance: v.number(),
    userId: v.optional(v.id("users")), // Allow passing userId from action
  },
  handler: async (ctx, args) => {
    // Try to get userId from auth context first, then fallback to passed userId
    let userId = await auth.getUserId(ctx);
    if (!userId && args.userId) {
      userId = args.userId;
    }
    if (!userId) {
      // For development, use a default user if no auth
      console.log('⚠️ No authentication context in createExperience, using default user for development');
      userId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a" as any;
    }

    const now = Date.now();

    const experienceId = await ctx.db.insert('experiences', {
      userId: userId!,
      title: args.title,
      description: args.description,
      context: args.context,
      experienceType: args.experienceType,
      importance: args.importance,
      status: 'planned', // 'planned', 'in_progress', 'completed', 'cancelled'
      
      // Simple scheduling (no complex objects)
      scheduledTimeframe: args.scheduledTimeframe || '',
      scheduledAt: undefined, // Will be set when specific date is confirmed
      actualStartAt: undefined,
      actualEndAt: undefined,
      
      // Follow-up tracking
      followUpEnabled: true,
      followUpCount: 0,
      lastFollowUpAt: undefined,
      followUpCompleted: false,
      
      // Simple location and people tracking
      location: undefined,
      participants: [],
      
      createdAt: now,
      updatedAt: now,
    });

    // Schedule follow-up if this is a trackable experience type
    await ctx.runMutation(api.experiences.scheduleFollowUp, {
      experienceId,
    });

    return experienceId;
  },
});

// Schedule follow-up for an experience
export const scheduleFollowUp = mutation({
  args: {
    experienceId: v.id('experiences'),
  },
  handler: async (ctx, args) => {
    const experience = await ctx.db.get(args.experienceId);
    if (!experience) return;

    // Simple follow-up timing rules (in hours)
    const followUpTimings: Record<string, number> = {
      'dentist': 4,        // 4 hours after appointment
      'doctor': 4,         // 4 hours after appointment
      'restaurant': 18,    // Next morning (18 hours)
      'meeting': 2,        // 2 hours after meeting
      'travel': 24,        // Next day
      'therapy': 24,       // Next day, give processing time
      'entertainment': 12, // Half day later
    };

    const followUpDelayHours = followUpTimings[experience.experienceType || 'default'] || 6;
    const followUpAt = Date.now() + (followUpDelayHours * 60 * 60 * 1000);

    // Update experience with follow-up timing
    await ctx.db.patch(args.experienceId, {
      followUpScheduledAt: followUpAt,
      updatedAt: Date.now(),
    });

    return followUpAt;
  },
});

// Get experiences ready for follow-up
export const getReadyForFollowUp = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const now = Date.now();
    
    return await ctx.db
      .query('experiences')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.and(
        q.eq(q.field('followUpEnabled'), true),
        q.eq(q.field('followUpCompleted'), false),
        q.lt(q.field('followUpScheduledAt'), now)
      ))
      .collect();
  },
});

// Mark follow-up as completed
export const completeFollowUp = mutation({
  args: {
    experienceId: v.id('experiences'),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const experience = await ctx.db.get(args.experienceId);
    if (!experience || experience.userId !== userId) {
      throw new Error('Experience not found');
    }

    await ctx.db.patch(args.experienceId, {
      followUpCompleted: true,
      lastFollowUpAt: Date.now(),
      followUpCount: (experience.followUpCount || 0) + 1,
      outcome: args.outcome,
      updatedAt: Date.now(),
    });

    return experience;
  },
});

// Get user's experiences
export const getUserExperiences = query({
  args: {
    context: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db
      .query('experiences')
      .withIndex('by_user', (q) => q.eq('userId', userId));

    if (args.context) {
      query = query.filter((q) => q.eq(q.field('context'), args.context));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status));
    }

    return await query
      .order('desc')
      .take(args.limit || 20);
  },
});

// Helper function to detect experiences from text
async function detectExperienceFromText(content: string): Promise<any> {
  // Simple keyword-based detection patterns
  const patterns = [
    {
      keywords: ['dentist', 'dental'],
      type: 'dentist',
      title: 'Dentist appointment',
      description: 'Dental care appointment',
      importance: 7,
    },
    {
      keywords: ['doctor', 'physician', 'medical appointment'],
      type: 'doctor', 
      title: 'Doctor appointment',
      description: 'Medical appointment',
      importance: 8,
    },
    {
      keywords: ['restaurant', 'dinner', 'lunch', 'eating out'],
      type: 'restaurant',
      title: 'Restaurant visit', 
      description: 'Dining experience',
      importance: 5,
    },
    {
      keywords: ['meeting', 'conference', 'call'],
      type: 'meeting',
      title: 'Work meeting',
      description: 'Professional meeting or call', 
      importance: 6,
    },
    {
      keywords: ['travel', 'trip', 'vacation', 'flight'],
      type: 'travel',
      title: 'Travel experience',
      description: 'Travel or vacation',
      importance: 7,
    },
  ];

  // Look for experience patterns
  for (const pattern of patterns) {
    const hasKeyword = pattern.keywords.some(keyword => content.includes(keyword));
    if (hasKeyword) {
      // Look for timeframe indicators
      const timeframe = extractTimeframe(content);
      
      return {
        type: pattern.type,
        title: pattern.title,
        description: pattern.description,
        importance: pattern.importance,
        scheduledTimeframe: timeframe,
      };
    }
  }

  return null;
}

// Extract timeframe from text
function extractTimeframe(content: string): string {
  const timePatterns = [
    { pattern: /next month/i, timeframe: 'next month' },
    { pattern: /next week/i, timeframe: 'next week' },
    { pattern: /tomorrow/i, timeframe: 'tomorrow' },
    { pattern: /today/i, timeframe: 'today' },
    { pattern: /this week/i, timeframe: 'this week' },
    { pattern: /this month/i, timeframe: 'this month' },
    { pattern: /soon/i, timeframe: 'soon' },
  ];

  for (const timePattern of timePatterns) {
    if (timePattern.pattern.test(content)) {
      return timePattern.timeframe;
    }
  }

  return '';
}

// Simple similarity calculation
function calculateSimpleSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(' ');
  const words2 = str2.toLowerCase().split(' ');
  
  let commonWords = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  words1.forEach(word => {
    if (words2.includes(word)) {
      commonWords++;
    }
  });
  
  return commonWords / totalWords;
}