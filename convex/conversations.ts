import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// ==================== QUERIES ====================

export const list = query({
  args: {
    context: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    let conversationsQuery = ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false));

    // Filter by context if provided
    if (args.context) {
      conversationsQuery = conversationsQuery.filter((q) =>
        q.eq(q.field("context"), args.context)
      );
    }

    return await conversationsQuery
      .order("desc")
      .take(args.limit || 20);
  },
});

export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const conversation = await ctx.db.get(args.conversationId);
    
    // Check if user owns this conversation
    if (!conversation || conversation.userId !== userId) {
      return null;
    }

    return conversation;
  },
});

export const getMessages = query({
  args: { 
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    // Verify user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      return [];
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) => 
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("asc")
      .take(args.limit || 100);
  },
});

// ==================== MUTATIONS ====================

export const create = mutation({
  args: {
    title: v.string(),
    context: v.string(),
    aiProvider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const now = Date.now();

    return await ctx.db.insert("conversations", {
      userId,
      title: args.title,
      context: args.context,
      messageCount: 0,
      isArchived: false,
      isPinned: false,
      settings: args.aiProvider ? {
        aiProvider: args.aiProvider,
      } : undefined,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    });
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    metadata: v.optional(v.object({
      provider: v.optional(v.string()),
      model: v.optional(v.string()),
      usage: v.optional(v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
        cost: v.optional(v.number()),
      })),
      inputMethod: v.optional(v.string()),
      processingTime: v.optional(v.number()),
      toolsUsed: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    // Verify user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    const now = Date.now();

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      content: args.content,
      role: args.role,
      metadata: args.metadata || {
        inputMethod: "text",
      },
      isEdited: false,
      isDeleted: false,
      createdAt: now,
    });

    // Update conversation metadata
    await ctx.db.patch(args.conversationId, {
      messageCount: conversation.messageCount + 1,
      lastMessageAt: now,
      lastMessagePreview: args.content.substring(0, 100),
      updatedAt: now,
    });

    return messageId;
  },
});

export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const archive = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, {
      isArchived: true,
      updatedAt: Date.now(),
    });
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => 
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});