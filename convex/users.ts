import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { DEFAULT_USER_PREFERENCES } from "./auth";

// Initialize user preferences after signup
export const initializeUserPreferences = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Only initialize if preferences don't exist
    if (!user.preferences) {
      await ctx.db.patch(args.userId, {
        preferences: DEFAULT_USER_PREFERENCES,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        onboardingCompleted: false,
        subscriptionTier: "free",
      });
    }
  },
});

// Get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(userId);
  },
});

// Update user preferences
export const updatePreferences = mutation({
  args: {
    preferences: v.object({
      defaultContext: v.string(),
      aiProvider: v.string(),
      responseStyle: v.string(),
      voiceEnabled: v.boolean(),
      voiceProvider: v.string(),
      voiceSpeed: v.number(),
      notifications: v.object({
        pushNotifications: v.boolean(),
        emailFollowUps: v.boolean(),
        proactiveMessages: v.boolean(),
        quietHours: v.object({
          enabled: v.boolean(),
          start: v.string(),
          end: v.string(),
        }),
      }),
      privacy: v.object({
        shareDataForImprovement: v.boolean(),
        longTermMemory: v.boolean(),
        crossContextLearning: v.boolean(),
        dataRetentionDays: v.number(),
      }),
      theme: v.string(),
      language: v.string(),
      timezone: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    await ctx.db.patch(userId, {
      preferences: args.preferences,
      lastActiveAt: Date.now(),
    });
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    assistantName: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const updates: any = {
      lastActiveAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.assistantName !== undefined) updates.assistantName = args.assistantName;
    if (args.avatar !== undefined) updates.avatar = args.avatar;

    await ctx.db.patch(userId, updates);
  },
});

// Mark onboarding as completed
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    await ctx.db.patch(userId, {
      onboardingCompleted: true,
      lastActiveAt: Date.now(),
    });
  },
});

// Get user by ID (for profile-first query resolution)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});