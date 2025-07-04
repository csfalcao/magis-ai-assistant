import { convexAuth } from "@convex-dev/auth/server";
import Password from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password(),
  ],
});

// Default user preferences for new users
export const DEFAULT_USER_PREFERENCES = {
  defaultContext: "personal",
  aiProvider: "openai",
  responseStyle: "detailed",
  voiceEnabled: true,
  voiceProvider: "browser",
  voiceSpeed: 1.0,
  notifications: {
    pushNotifications: true,
    emailFollowUps: false,
    proactiveMessages: true,
    quietHours: {
      enabled: true,
      start: "22:00",
      end: "08:00",
    },
  },
  privacy: {
    shareDataForImprovement: true,
    longTermMemory: true,
    crossContextLearning: true,
    dataRetentionDays: 0, // Keep forever by default
  },
  theme: "system",
  language: "en",
  timezone: "America/New_York",
};