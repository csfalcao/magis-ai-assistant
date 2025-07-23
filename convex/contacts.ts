import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

// Contact management with completion priority system

// Create a new contact from conversation
export const createContact = mutation({
  args: {
    name: v.string(),
    type: v.string(), // 'dentist', 'restaurant', 'doctor', 'friend', 'business'
    context: v.string(), // 'work', 'personal', 'family'
    discoveryMethod: v.optional(v.string()), // How we learned about them
    notes: v.optional(v.string()), // Initial notes about them
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Check if contact already exists (same name + type)
    const existingContact = await ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.and(
        q.eq(q.field('name'), args.name),
        q.eq(q.field('type'), args.type)
      ))
      .first();

    if (existingContact) {
      return existingContact._id; // Return existing contact instead of creating duplicate
    }

    const now = Date.now();

    const contactId = await ctx.db.insert('contacts', {
      userId,
      name: args.name,
      type: args.type,
      context: args.context,
      
      // Contact information (essential data)
      phone: undefined,
      address: undefined,
      email: undefined,
      website: undefined,
      
      // Completion tracking
      completionStatus: 'incomplete', // 'incomplete', 'partial', 'complete'
      completionScore: calculateInitialCompletionScore(args.name, undefined, undefined),
      lastCompletionRequest: undefined,
      
      // Experience and trust tracking
      experienceCount: 0,
      averageRating: 0,
      lastInteraction: undefined,
      trustLevel: 'unknown', // 'unknown', 'researched', 'tried', 'trusted'
      
      // Discovery information
      discoveryMethod: args.discoveryMethod || 'conversation',
      firstMention: now,
      notes: args.notes || '',
      
      // Priority for proactive completion
      completionPriority: 'high', // 'high', 'medium', 'low'
      
      createdAt: now,
      updatedAt: now,
    });

    return contactId;
  },
});

// Update contact information
export const updateContact = mutation({
  args: {
    contactId: v.id('contacts'),
    phone: v.optional(v.string()),
    address: v.optional(v.string()), 
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error('Contact not found');
    }

    // Update fields
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.address !== undefined) updates.address = args.address;
    if (args.email !== undefined) updates.email = args.email;
    if (args.website !== undefined) updates.website = args.website;
    if (args.notes !== undefined) updates.notes = args.notes;

    // Recalculate completion status
    const updatedContact = { ...contact, ...updates };
    updates.completionScore = calculateCompletionScore(
      updatedContact.name,
      updatedContact.phone,
      updatedContact.address
    );
    updates.completionStatus = getCompletionStatus(updates.completionScore);
    updates.completionPriority = getCompletionPriority(updates.completionStatus);

    await ctx.db.patch(args.contactId, updates);

    return args.contactId;
  },
});

// Get incomplete contacts that need completion
export const getIncompleteContacts = query({
  args: {
    priority: v.optional(v.string()), // 'high', 'medium', 'low'
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.neq(q.field('completionStatus'), 'complete'));

    if (args.priority) {
      query = query.filter((q) => q.eq(q.field('completionPriority'), args.priority));
    }

    const contacts = await query
      .order('desc') // Most recent first
      .take(args.limit || 10);

    // Sort by priority: high -> medium -> low
    return contacts.sort((a, b) => {
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      return priorityOrder[a.completionPriority as keyof typeof priorityOrder] - 
             priorityOrder[b.completionPriority as keyof typeof priorityOrder];
    });
  },
});

// Add experience rating to contact
export const addContactExperience = mutation({
  args: {
    contactId: v.id('contacts'),
    rating: v.number(), // 1-10 rating
    experience: v.string(), // Description of experience
    cost: v.optional(v.string()), // Cost assessment
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error('Contact not found');
    }

    // Update experience tracking
    const newExperienceCount = contact.experienceCount + 1;
    const newAverageRating = ((contact.averageRating * contact.experienceCount) + args.rating) / newExperienceCount;

    // Update trust level based on experience
    let trustLevel = contact.trustLevel;
    if (trustLevel === 'unknown' || trustLevel === 'researched') {
      trustLevel = 'tried';
    }
    if (args.rating >= 8 && newExperienceCount >= 2) {
      trustLevel = 'trusted';
    }

    // Add experience entry to notes
    const experienceNote = `[${new Date().toLocaleDateString()}] Rating: ${args.rating}/10 - ${args.experience}${args.cost ? ` (Cost: ${args.cost})` : ''}${args.notes ? ` - ${args.notes}` : ''}`;
    const updatedNotes = contact.notes ? `${contact.notes}\n${experienceNote}` : experienceNote;

    await ctx.db.patch(args.contactId, {
      experienceCount: newExperienceCount,
      averageRating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal
      lastInteraction: Date.now(),
      trustLevel,
      notes: updatedNotes,
      updatedAt: Date.now(),
    });

    return args.contactId;
  },
});

// Get contacts by type or context
export const getContacts = query({
  args: {
    type: v.optional(v.string()),
    context: v.optional(v.string()),
    trustLevel: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', userId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field('type'), args.type));
    }

    if (args.context) {
      query = query.filter((q) => q.eq(q.field('context'), args.context));
    }

    if (args.trustLevel) {
      query = query.filter((q) => q.eq(q.field('trustLevel'), args.trustLevel));
    }

    return await query
      .order('desc')
      .take(args.limit || 20);
  },
});

// Get trusted providers for recommendations
export const getTrustedProviders = query({
  args: {
    type: v.optional(v.string()),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('trustLevel'), 'trusted'));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field('type'), args.type));
    }

    if (args.minRating !== undefined) {
      const minRating = args.minRating;
      query = query.filter((q) => q.gte(q.field('averageRating'), minRating));
    }

    return await query
      .order('desc')
      .take(10);
  },
});

// Mark completion request to avoid over-asking
export const markCompletionRequest = mutation({
  args: {
    contactId: v.id('contacts'),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error('Contact not found');
    }

    await ctx.db.patch(args.contactId, {
      lastCompletionRequest: Date.now(),
      updatedAt: Date.now(),
    });

    return args.contactId;
  },
});

// Helper functions

function calculateInitialCompletionScore(name: string, phone?: string, address?: string): number {
  let score = 0;
  if (name) score += 33; // Name is worth 33%
  if (phone) score += 33; // Phone is worth 33%
  if (address) score += 34; // Address is worth 34%
  return score;
}

function calculateCompletionScore(name: string, phone?: string, address?: string): number {
  let score = 0;
  if (name) score += 33;
  if (phone) score += 33;
  if (address) score += 34;
  return score;
}

function getCompletionStatus(score: number): string {
  if (score >= 100) return 'complete';
  if (score >= 66) return 'partial'; // Have 2 out of 3 essential fields
  return 'incomplete';
}

function getCompletionPriority(status: string): string {
  switch (status) {
    case 'incomplete': return 'high';
    case 'partial': return 'medium';
    case 'complete': return 'low';
    default: return 'medium';
  }
}