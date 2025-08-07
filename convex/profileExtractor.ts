import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Profile Data Extraction for Three-Tier Intelligence System
 * Extracts structured profile data from PROFILE-classified content
 */

// Profile update types matching schema
interface ProfileUpdate {
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: number;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  workInfo?: {
    employment?: {
      company?: string;
      position?: string;
      startDate?: number;
      status?: string;
      type?: string;
    };
  };
  familyInfo?: {
    spouse?: {
      name?: string;
    };
    children?: Array<{
      name: string;
    }>;
  };
  serviceProviders?: {
    healthcare?: Array<{
      type: string;
      name: string;
      practice?: string;
    }>;
  };
}

/**
 * Extract structured profile data from PROFILE-classified content
 */
export const extractProfileData = action({
  args: {
    content: v.string(),
    classification: v.string(),
    context: v.string(),
    subType: v.optional(v.string()), // From classifier: work_info, personal_info, etc.
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    profileUpdate?: ProfileUpdate;
    confidence: number;
    extractedFields: string[];
  }> => {
    // Only process PROFILE content
    if (args.classification !== "PROFILE") {
      return {
        success: false,
        confidence: 0,
        extractedFields: [],
      };
    }

    console.log(`👤 PROFILE EXTRACTOR: Processing ${args.subType || 'general'} profile content`);

    try {
      const prompt = `Extract structured profile data from this user statement.

Content: "${args.content}"
Context: ${args.context}
SubType: ${args.subType || 'unknown'}

Extract ONLY the explicitly stated information into this structure:

{
  "personalInfo": {
    "firstName": "string if mentioned",
    "lastName": "string if mentioned", 
    "dateOfBirth": timestamp if birthday mentioned,
    "location": {
      "city": "string if mentioned",
      "state": "string if mentioned",
      "country": "string if mentioned"
    }
  },
  "workInfo": {
    "employment": {
      "company": "string if mentioned (e.g., Microsoft, Google)",
      "position": "string if mentioned (e.g., Software Engineer)",
      "startDate": timestamp if start date mentioned,
      "status": "employed|self_employed|student|retired if determinable",
      "type": "full_time|part_time|contract if determinable"
    }
  },
  "familyInfo": {
    "spouse": {
      "name": "string if spouse mentioned"
    },
    "children": [
      {"name": "string for each child mentioned"}
    ]
  },
  "serviceProviders": {
    "healthcare": [
      {
        "type": "dentist|doctor|specialist",
        "name": "provider name",
        "practice": "practice name if mentioned"
      }
    ]
  }
}

Examples:
- "Started working at Microsoft last week" → {"workInfo": {"employment": {"company": "Microsoft", "startDate": [timestamp for last week]}}}
- "My birthday is December 29th" → {"personalInfo": {"dateOfBirth": [timestamp for Dec 29]}}
- "I live in Miami" → {"personalInfo": {"location": {"city": "Miami"}}}
- "Dr. Smith is my new dentist" → {"serviceProviders": {"healthcare": [{"type": "dentist", "name": "Dr. Smith"}]}}

Include ONLY fields that are explicitly mentioned. Return minimal JSON with:
{
  "profileUpdate": {extracted data},
  "confidence": 0.0-1.0,
  "extractedFields": ["list", "of", "field", "paths", "extracted"]
}`;

      const result = await generateText({
        model: openai('gpt-4-turbo'),
        prompt: prompt,
        temperature: 0.1,
      });

      // Parse the response
      try {
        // Handle potential markdown-wrapped JSON
        let jsonText = result.text.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        }
        const extracted = JSON.parse(jsonText);
        
        console.log(`✅ PROFILE EXTRACTOR: Extracted ${extracted.extractedFields.length} fields`);
        console.log(`   Fields: ${extracted.extractedFields.join(', ')}`);
        console.log(`   Confidence: ${extracted.confidence}`);

        return {
          success: true,
          profileUpdate: extracted.profileUpdate,
          confidence: extracted.confidence || 0.8,
          extractedFields: extracted.extractedFields || [],
        };
      } catch (parseError) {
        console.error("Failed to parse profile extraction:", parseError);
        return {
          success: false,
          confidence: 0,
          extractedFields: [],
        };
      }
    } catch (error) {
      console.error("Profile extraction failed:", error);
      return {
        success: false,
        confidence: 0,
        extractedFields: [],
      };
    }
  },
});

/**
 * Apply extracted profile data to user profile
 */
export const applyProfileUpdate = mutation({
  args: {
    userId: v.id('users'),
    profileUpdate: v.any(), // ProfileUpdate type
    extractedFields: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, profileUpdate, extractedFields } = args;

    console.log(`🔄 PROFILE UPDATE: Applying ${extractedFields.length} field updates`);

    // Get current user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Deep merge the profile update
    const updates: any = {};

    if (profileUpdate.personalInfo) {
      updates.personalInfo = {
        ...(user.personalInfo || {}),
        ...profileUpdate.personalInfo,
        location: {
          ...(user.personalInfo?.location || {}),
          ...(profileUpdate.personalInfo.location || {}),
        },
      };
    }

    if (profileUpdate.workInfo) {
      updates.workInfo = {
        ...(user.workInfo || {}),
        employment: {
          ...(user.workInfo?.employment || {}),
          ...(profileUpdate.workInfo.employment || {}),
        },
      };
    }

    if (profileUpdate.familyInfo) {
      updates.familyInfo = {
        ...(user.familyInfo || {}),
        ...(profileUpdate.familyInfo),
      };
    }

    if (profileUpdate.serviceProviders) {
      // Merge healthcare providers array
      const existingProviders = user.serviceProviders?.healthcare || [];
      const newProviders = profileUpdate.serviceProviders.healthcare || [];
      
      updates.serviceProviders = {
        ...(user.serviceProviders || {}),
        healthcare: [...existingProviders, ...newProviders],
      };
    }

    // Apply the updates
    await ctx.db.patch(userId, updates);

    // Update profile completion
    await ctx.runMutation(api.profile.updateProfileCompletion, {});

    console.log(`✅ PROFILE UPDATE: Successfully updated ${extractedFields.length} fields`);
    
    return {
      success: true,
      updatedFields: extractedFields,
    };
  },
});

/**
 * Generate proactive tasks based on profile updates
 */
export const generateProfileTasks = mutation({
  args: {
    userId: v.id('users'),
    profileUpdate: v.any(),
    updateType: v.string(),
  },
  handler: async (ctx, args) => {
    const tasks: any[] = [];

    // Job change tasks
    if (args.profileUpdate.workInfo?.employment?.company) {
      const company = args.profileUpdate.workInfo.employment.company;
      
      // One week check-in
      tasks.push({
        userId: args.userId,
        taskType: 'proactive_followup',
        description: `Check on ${company} transition`,
        priority: 'medium',
        triggerDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 1 week
        metadata: {
          company,
          followUpType: 'job_transition',
          question: `How's the new role at ${company} going? Settling in well?`,
        },
        status: 'pending',
        isHidden: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Two week colleague check
      tasks.push({
        userId: args.userId,
        taskType: 'proactive_followup',
        description: `Ask about colleagues at ${company}`,
        priority: 'low',
        triggerDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 2 weeks
        metadata: {
          company,
          followUpType: 'social_integration',
          question: `Met any interesting colleagues at ${company} yet?`,
        },
        status: 'pending',
        isHidden: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Location change tasks
    if (args.profileUpdate.personalInfo?.location) {
      const location = args.profileUpdate.personalInfo.location;
      
      tasks.push({
        userId: args.userId,
        taskType: 'proactive_followup',
        description: `Check on location adjustment`,
        priority: 'low',
        triggerDate: Date.now() + (3 * 24 * 60 * 60 * 1000), // 3 days
        metadata: {
          location,
          followUpType: 'location_change',
          question: `How are you finding ${location.city || 'the new location'}? Any favorite spots yet?`,
        },
        status: 'pending',
        isHidden: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create the tasks
    for (const task of tasks) {
      await ctx.db.insert('system_tasks', task);
    }

    console.log(`🎯 PROFILE TASKS: Generated ${tasks.length} proactive tasks`);
    
    return {
      tasksCreated: tasks.length,
    };
  },
});