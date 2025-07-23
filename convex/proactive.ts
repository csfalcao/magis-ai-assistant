import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

// Simple proactive conversation system with natural follow-ups

// Generate proactive messages for ready experiences
export const generateProactiveMessages = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get experiences ready for follow-up
    const readyExperiences = await ctx.runQuery(api.experiences.getReadyForFollowUp);
    
    const proactiveMessages = [];

    for (const experience of readyExperiences) {
      // Generate natural follow-up message
      const message = await generateFollowUpMessage(experience);
      
      if (message) {
        // Create proactive conversation entry
        const proactiveId = await ctx.runMutation(api.proactive.createProactiveMessage, {
          experienceId: experience._id,
          message: message,
          messageType: 'follow_up',
        });

        proactiveMessages.push({
          id: proactiveId,
          experienceId: experience._id,
          message: message,
          experience: experience,
        });
      }
    }

    return proactiveMessages;
  },
});

// Generate contact completion messages
export const generateContactCompletionMessages = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get high priority incomplete contacts
    const incompleteContacts = await ctx.runQuery(api.contacts.getIncompleteContacts, {
      priority: 'high',
      limit: 3, // Don't overwhelm user
    });

    const proactiveMessages = [];

    for (const contact of incompleteContacts) {
      // Don't ask too frequently (wait at least 24 hours between requests)
      if (contact.lastCompletionRequest) {
        const hoursSinceLastRequest = (Date.now() - contact.lastCompletionRequest) / (1000 * 60 * 60);
        if (hoursSinceLastRequest < 24) {
          continue; // Skip this contact for now
        }
      }

      // Generate natural completion request
      const message = generateContactCompletionMessage(contact);
      
      if (message) {
        // Create proactive conversation entry
        const proactiveId = await ctx.runMutation(api.proactive.createProactiveMessage, {
          contactId: contact._id,
          message: message,
          messageType: 'contact_completion',
        });

        // Mark that we asked about this contact
        await ctx.runMutation(api.contacts.markCompletionRequest, {
          contactId: contact._id,
        });

        proactiveMessages.push({
          id: proactiveId,
          contactId: contact._id,
          message: message,
          contact: contact,
        });
      }
    }

    return proactiveMessages;
  },
});

// Create a proactive message
export const createProactiveMessage = mutation({
  args: {
    experienceId: v.optional(v.id('experiences')),
    contactId: v.optional(v.id('contacts')),
    message: v.string(),
    messageType: v.string(), // 'follow_up', 'contact_completion', 'check_in'
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const proactiveId = await ctx.db.insert('proactiveMessages', {
      userId,
      experienceId: args.experienceId,
      contactId: args.contactId,
      message: args.message,
      messageType: args.messageType,
      status: 'pending', // 'pending', 'sent', 'completed'
      createdAt: Date.now(),
      sentAt: undefined,
      completedAt: undefined,
    });

    return proactiveId;
  },
});

// Get pending proactive messages
export const getPendingProactiveMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query('proactiveMessages')
      .withIndex('by_user_status', (q) => q.eq('userId', userId).eq('status', 'pending'))
      .order('asc')
      .take(args.limit || 5);
  },
});

// Mark proactive message as sent
export const markProactiveMessageSent = mutation({
  args: {
    proactiveId: v.id('proactiveMessages'),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const proactive = await ctx.db.get(args.proactiveId);
    if (!proactive || proactive.userId !== userId) {
      throw new Error('Proactive message not found');
    }

    await ctx.db.patch(args.proactiveId, {
      status: 'sent',
      sentAt: Date.now(),
    });

    return args.proactiveId;
  },
});

// Mark proactive message as completed (user responded)
export const markProactiveMessageCompleted = mutation({
  args: {
    proactiveId: v.id('proactiveMessages'),
    userResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const proactive = await ctx.db.get(args.proactiveId);
    if (!proactive || proactive.userId !== userId) {
      throw new Error('Proactive message not found');
    }

    await ctx.db.patch(args.proactiveId, {
      status: 'completed',
      completedAt: Date.now(),
      userResponse: args.userResponse,
    });

    // If this was an experience follow-up, mark the experience as completed
    if (proactive.experienceId) {
      await ctx.runMutation(api.experiences.completeFollowUp, {
        experienceId: proactive.experienceId,
        outcome: args.userResponse,
      });
    }

    return args.proactiveId;
  },
});

// Process conversation for proactive triggers
export const processConversationForProactive = action({
  args: {
    messageContent: v.string(),
    conversationId: v.id('conversations'),
    context: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const results = [];

    // 1. Detect and create experiences
    const experienceId = await ctx.runAction(api.experiences.detectAndCreateExperience, {
      messageContent: args.messageContent,
      conversationId: args.conversationId,
      context: args.context,
    });

    if (experienceId) {
      results.push({ type: 'experience_created', id: experienceId });
    }

    // 2. Detect and create contacts
    const contacts = await detectContactsFromMessage(args.messageContent, args.context);
    
    for (const contactInfo of contacts) {
      const contactId = await ctx.runMutation(api.contacts.createContact, {
        name: contactInfo.name,
        type: contactInfo.type,
        context: args.context,
        discoveryMethod: 'conversation',
        notes: contactInfo.notes,
      });

      results.push({ type: 'contact_created', id: contactId, contact: contactInfo });
    }

    return results;
  },
});

// Helper function to generate follow-up messages
async function generateFollowUpMessage(experience: any): Promise<string> {
  // Simple template-based message generation
  const templates = {
    'dentist': [
      `Hey! How did your dentist appointment go?`,
      `Hope your dental appointment went smoothly! How was Dr. ${extractDoctorName(experience.title)}?`,
      `How was your dentist visit? Everything okay with your teeth?`,
    ],
    'doctor': [
      `How did your doctor appointment go today?`,
      `Hope everything went well at your medical appointment!`,
      `How was your visit with the doctor?`,
    ],
    'restaurant': [
      `Good morning! How was dinner at ${extractRestaurantName(experience.title)} last night?`,
      `How was your meal yesterday? Hope you enjoyed it!`,
      `Did you have a nice dinner out yesterday?`,
    ],
    'meeting': [
      `How did your meeting go?`,
      `Hope your meeting went well! Was it productive?`,
      `How was the meeting earlier?`,
    ],
    'travel': [
      `Welcome back! How was your trip?`,
      `Hope you had a great time traveling! How was everything?`,
      `How was your travel experience?`,
    ],
  };

  const experienceTemplates = templates[experience.experienceType as keyof typeof templates] || [
    `How did things go with ${experience.title}?`,
    `Hope everything went well!`,
  ];

  // Pick a random template for natural variety
  const randomTemplate = experienceTemplates[Math.floor(Math.random() * experienceTemplates.length)];
  
  return randomTemplate;
}

// Generate contact completion message
function generateContactCompletionMessage(contact: any): string {
  const missingFields = [];
  if (!contact.phone) missingFields.push('phone number');
  if (!contact.address) missingFields.push('address');

  if (missingFields.length === 0) return '';

  const templates = [
    `By the way, do you have ${contact.name}'s ${missingFields[0]}? I'd love to add it to your contacts.`,
    `What's ${contact.name}'s ${missingFields[0]}? Might be handy to have on file.`,
    `Do you happen to know ${contact.name}'s ${missingFields[0]}? I can store it for future reference.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

// Simple contact detection from message text
async function detectContactsFromMessage(content: string, context: string): Promise<any[]> {
  const contacts = [];
  const lowerContent = content.toLowerCase();

  // Look for doctor/dentist names
  const doctorPattern = /(dr\.?\s+(\w+)|doctor\s+(\w+))/gi;
  let match;
  while ((match = doctorPattern.exec(content)) !== null) {
    const name = match[2] || match[3];
    if (name && name.length > 1) {
      contacts.push({
        name: `Dr. ${name}`,
        type: lowerContent.includes('dentist') ? 'dentist' : 'doctor',
        notes: `Mentioned in conversation`,
      });
    }
  }

  // Look for restaurant names
  const restaurantPatterns = [
    /(?:at|restaurant|ate at|dinner at|lunch at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+restaurant/gi,
  ];

  for (const pattern of restaurantPatterns) {
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1];
      if (name && name.length > 2 && !['the', 'a', 'an', 'that', 'this'].includes(name.toLowerCase())) {
        contacts.push({
          name: name,
          type: 'restaurant',
          notes: `Restaurant mentioned in conversation`,
        });
      }
    }
  }

  return contacts;
}

// Helper functions for extracting names from titles
function extractDoctorName(title: string): string {
  const match = title.match(/Dr\.?\s+(\w+)/i);
  return match ? match[1] : 'your dentist';
}

function extractRestaurantName(title: string): string {
  // Try to extract restaurant name from title
  const match = title.match(/at\s+(.+)/i);
  return match ? match[1] : 'the restaurant';
}