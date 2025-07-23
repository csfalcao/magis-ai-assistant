import { mutation, query, action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { auth } from './auth';

// ==================== PROFILE RETRIEVAL ====================

// Get user's complete profile
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Return profile with safe defaults for missing data
    return {
      _id: user._id,
      email: user.email || '',
      name: user.name || '',
      avatar: user.avatar || null,
      assistantName: user.assistantName || 'MAGIS',
      personalInfo: user.personalInfo || {},
      workInfo: user.workInfo || {},
      familyInfo: user.familyInfo || {},
      personalPreferences: user.personalPreferences || {},
      serviceProviders: user.serviceProviders || {},
      profileCompletion: user.profileCompletion || { overall: 0 },
      preferences: user.preferences || {},
      onboardingCompleted: user.onboardingCompleted || false,
    };
  },
});

// Get specific profile section
export const getProfileSection = query({
  args: {
    section: v.union(
      v.literal('personalInfo'),
      v.literal('workInfo'), 
      v.literal('familyInfo'),
      v.literal('personalPreferences'),
      v.literal('serviceProviders'),
      v.literal('preferences')
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user[args.section] || null;
  },
});

// ==================== PROFILE UPDATES ====================

// Update personal information
export const updatePersonalInfo = mutation({
  args: {
    personalInfo: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      nickname: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      location: v.optional(v.object({
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })),
      contactInfo: v.optional(v.object({
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        emergencyContact: v.optional(v.object({
          name: v.string(),
          phone: v.string(),
          relationship: v.string(),
        })),
      })),
      healthInfo: v.optional(v.object({
        allergies: v.optional(v.array(v.string())),
        medications: v.optional(v.array(v.string())),
        medicalConditions: v.optional(v.array(v.string())),
        preferredPharmacy: v.optional(v.string()),
        insuranceProvider: v.optional(v.string()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Merge with existing personal info
    const existingPersonalInfo = user.personalInfo || {};
    const updatedPersonalInfo = {
      ...existingPersonalInfo,
      ...args.personalInfo,
    };

    await ctx.db.patch(user._id, {
      personalInfo: updatedPersonalInfo,
    });

    // Update profile completion
    await ctx.runMutation(api.profile.updateProfileCompletion, {
      section: 'personalInfo',
    });

    return user._id;
  },
});

// Update work information
export const updateWorkInfo = mutation({
  args: {
    workInfo: v.object({
      employment: v.optional(v.object({
        status: v.optional(v.string()),
        type: v.optional(v.string()),
        company: v.optional(v.string()),
        position: v.optional(v.string()),
        department: v.optional(v.string()),
        startDate: v.optional(v.number()),
        industry: v.optional(v.string()),
      })),
      workSchedule: v.optional(v.object({
        regularHours: v.optional(v.object({
          monday: v.optional(v.object({ start: v.string(), end: v.string() })),
          tuesday: v.optional(v.object({ start: v.string(), end: v.string() })),
          wednesday: v.optional(v.object({ start: v.string(), end: v.string() })),
          thursday: v.optional(v.object({ start: v.string(), end: v.string() })),
          friday: v.optional(v.object({ start: v.string(), end: v.string() })),
          saturday: v.optional(v.object({ start: v.string(), end: v.string() })),
          sunday: v.optional(v.object({ start: v.string(), end: v.string() })),
        })),
        flexibleSchedule: v.optional(v.boolean()),
        remoteWork: v.optional(v.string()),
        timeOffBalance: v.optional(v.number()),
      })),
      workLocation: v.optional(v.object({
        office: v.optional(v.string()),
        remoteAddress: v.optional(v.string()),
        commute: v.optional(v.object({
          method: v.optional(v.string()),
          duration: v.optional(v.number()),
        })),
      })),
      workContacts: v.optional(v.array(v.object({
        name: v.string(),
        role: v.string(),
        relationship: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingWorkInfo = user.workInfo || {};
    const updatedWorkInfo = {
      ...existingWorkInfo,
      ...args.workInfo,
    };

    await ctx.db.patch(user._id, {
      workInfo: updatedWorkInfo,
    });

    await ctx.runMutation(api.profile.updateProfileCompletion, {
      section: 'workInfo',
    });

    return user._id;
  },
});

// Update family information
export const updateFamilyInfo = mutation({
  args: {
    familyInfo: v.object({
      relationshipStatus: v.optional(v.string()),
      spouse: v.optional(v.object({
        name: v.string(),
        nickname: v.optional(v.string()),
        dateOfBirth: v.optional(v.number()),
        occupation: v.optional(v.string()),
        workSchedule: v.optional(v.string()),
        phone: v.optional(v.string()),
        preferences: v.optional(v.array(v.string())),
      })),
      children: v.optional(v.array(v.object({
        name: v.string(),
        nickname: v.optional(v.string()),
        dateOfBirth: v.optional(v.number()),
        grade: v.optional(v.string()),
        school: v.optional(v.string()),
        activities: v.optional(v.array(v.string())),
        allergies: v.optional(v.array(v.string())),
        preferences: v.optional(v.array(v.string())),
        medicalInfo: v.optional(v.object({
          pediatrician: v.optional(v.string()),
          allergies: v.optional(v.array(v.string())),
          medications: v.optional(v.array(v.string())),
        })),
      }))),
      pets: v.optional(v.array(v.object({
        name: v.string(),
        type: v.string(),
        breed: v.optional(v.string()),
        dateOfBirth: v.optional(v.number()),
        veterinarian: v.optional(v.string()),
        medications: v.optional(v.array(v.string())),
        preferences: v.optional(v.array(v.string())),
      }))),
      extendedFamily: v.optional(v.array(v.object({
        name: v.string(),
        relationship: v.string(),
        phone: v.optional(v.string()),
        location: v.optional(v.string()),
        birthday: v.optional(v.number()),
        notes: v.optional(v.string()),
      }))),
      household: v.optional(v.object({
        address: v.optional(v.string()),
        type: v.optional(v.string()),
        residents: v.optional(v.array(v.string())),
        emergencyContacts: v.optional(v.array(v.object({
          name: v.string(),
          phone: v.string(),
          relationship: v.string(),
        }))),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingFamilyInfo = user.familyInfo || {};
    const updatedFamilyInfo = {
      ...existingFamilyInfo,
      ...args.familyInfo,
    };

    await ctx.db.patch(user._id, {
      familyInfo: updatedFamilyInfo,
    });

    await ctx.runMutation(api.profile.updateProfileCompletion, {
      section: 'familyInfo',
    });

    return user._id;
  },
});

// Add family member (child, pet, extended family)
export const addFamilyMember = mutation({
  args: {
    type: v.union(v.literal('child'), v.literal('pet'), v.literal('extendedFamily')),
    member: v.any(), // Will validate based on type
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const familyInfo = user.familyInfo || {};
    
    switch (args.type) {
      case 'child':
        const children = familyInfo.children || [];
        children.push(args.member);
        familyInfo.children = children;
        break;
      case 'pet':
        const pets = familyInfo.pets || [];
        pets.push(args.member);
        familyInfo.pets = pets;
        break;
      case 'extendedFamily':
        const extendedFamily = familyInfo.extendedFamily || [];
        extendedFamily.push(args.member);
        familyInfo.extendedFamily = extendedFamily;
        break;
    }

    await ctx.db.patch(user._id, { familyInfo });
    
    await ctx.runMutation(api.profile.updateProfileCompletion, {
      section: 'familyInfo',
    });

    return user._id;
  },
});

// Update service providers
export const updateServiceProviders = mutation({
  args: {
    serviceProviders: v.object({
      healthcare: v.optional(v.array(v.object({
        type: v.string(),
        name: v.string(),
        practice: v.optional(v.string()),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        notes: v.optional(v.string()),
        lastVisit: v.optional(v.number()),
        nextAppointment: v.optional(v.number()),
      }))),
      automotive: v.optional(v.array(v.object({
        type: v.string(),
        name: v.string(),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        vehicles: v.optional(v.array(v.string())),
      }))),
      home: v.optional(v.array(v.object({
        type: v.string(),
        name: v.string(),
        phone: v.optional(v.string()),
        notes: v.optional(v.string()),
        lastService: v.optional(v.number()),
      }))),
      financial: v.optional(v.array(v.object({
        type: v.string(),
        name: v.string(),
        phone: v.optional(v.string()),
        accountNumbers: v.optional(v.array(v.string())),
        notes: v.optional(v.string()),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingProviders = user.serviceProviders || {};
    const updatedProviders = {
      ...existingProviders,
      ...args.serviceProviders,
    };

    await ctx.db.patch(user._id, {
      serviceProviders: updatedProviders,
    });

    await ctx.runMutation(api.profile.updateProfileCompletion, {
      section: 'serviceProviders',
    });

    return user._id;
  },
});

// ==================== PROFILE COMPLETION TRACKING ====================

// Calculate and update profile completion percentage
export const updateProfileCompletion = mutation({
  args: {
    section: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate completion percentages for each section
    const personalInfoCompletion = calculatePersonalInfoCompletion(user.personalInfo);
    const workInfoCompletion = calculateWorkInfoCompletion(user.workInfo);
    const familyInfoCompletion = calculateFamilyInfoCompletion(user.familyInfo);
    const preferencesCompletion = calculatePreferencesCompletion(user.personalPreferences);
    const serviceProvidersCompletion = calculateServiceProvidersCompletion(user.serviceProviders);

    // Calculate overall completion
    const overallCompletion = Math.round(
      (personalInfoCompletion + workInfoCompletion + familyInfoCompletion + 
       preferencesCompletion + serviceProvidersCompletion) / 5
    );

    const profileCompletion = {
      personalInfo: personalInfoCompletion,
      workInfo: workInfoCompletion,
      familyInfo: familyInfoCompletion,
      preferences: preferencesCompletion,
      serviceProviders: serviceProvidersCompletion,
      overall: overallCompletion,
      lastUpdated: Date.now(),
    };

    await ctx.db.patch(user._id, { profileCompletion });

    return profileCompletion;
  },
});

// ==================== HELPER FUNCTIONS ====================

function calculatePersonalInfoCompletion(personalInfo: any): number {
  if (!personalInfo) return 0;
  
  const fields = [
    personalInfo.firstName,
    personalInfo.lastName,
    personalInfo.dateOfBirth,
    personalInfo.location?.city,
    personalInfo.location?.timezone,
    personalInfo.contactInfo?.phone,
  ];
  
  const completedFields = fields.filter(field => field !== undefined && field !== '').length;
  return Math.round((completedFields / fields.length) * 100);
}

function calculateWorkInfoCompletion(workInfo: any): number {
  if (!workInfo) return 0;
  
  const fields = [
    workInfo.employment?.status,
    workInfo.employment?.company,
    workInfo.employment?.position,
    workInfo.workSchedule?.remoteWork,
  ];
  
  const completedFields = fields.filter(field => field !== undefined && field !== '').length;
  return Math.round((completedFields / fields.length) * 100);
}

function calculateFamilyInfoCompletion(familyInfo: any): number {
  if (!familyInfo) return 0;
  
  let score = 0;
  if (familyInfo.relationshipStatus) score += 25;
  if (familyInfo.children && familyInfo.children.length > 0) score += 25;
  if (familyInfo.household?.address) score += 25;
  if (familyInfo.extendedFamily && familyInfo.extendedFamily.length > 0) score += 25;
  
  return score;
}

function calculatePreferencesCompletion(preferences: any): number {
  if (!preferences) return 0;
  
  const fields = [
    preferences.lifestyle?.diet,
    preferences.communication?.preferredStyle,
    preferences.scheduling?.preferredMeetingTimes,
    preferences.lifestyle?.sleepSchedule?.bedtime,
  ];
  
  const completedFields = fields.filter(field => field !== undefined && field !== '').length;
  return Math.round((completedFields / fields.length) * 100);
}

function calculateServiceProvidersCompletion(serviceProviders: any): number {
  if (!serviceProviders) return 0;
  
  let score = 0;
  if (serviceProviders.healthcare && serviceProviders.healthcare.length > 0) score += 40;
  if (serviceProviders.automotive && serviceProviders.automotive.length > 0) score += 20;
  if (serviceProviders.home && serviceProviders.home.length > 0) score += 20;
  if (serviceProviders.financial && serviceProviders.financial.length > 0) score += 20;
  
  return score;
}

// ==================== ONBOARDING ====================

// Mark onboarding as completed
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
    });

    return user._id;
  },
});

// Get onboarding status
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      completed: user.onboardingCompleted || false,
      profileCompletion: user.profileCompletion,
    };
  },
});