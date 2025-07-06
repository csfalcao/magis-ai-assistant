import { action, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// ==================== CONVERSATION-DRIVEN PROFILE UPDATES ====================

// Extract profile information from conversation content
export const extractProfileFromConversation = action({
  args: {
    content: v.string(),
    context: v.string(), // 'work', 'personal', 'family'
  },
  handler: async (ctx, args): Promise<any> => {
    // Simple rule-based extraction for profile information
    // In full implementation, this would use LLM to extract structured data
    
    const content = args.content.toLowerCase();
    const profileUpdates: any = {};
    
    // Extract family information
    const familyUpdates = extractFamilyInfo(content);
    if (Object.keys(familyUpdates).length > 0) {
      profileUpdates.familyInfo = familyUpdates;
    }
    
    // Extract work information
    const workUpdates = extractWorkInfo(content);
    if (Object.keys(workUpdates).length > 0) {
      profileUpdates.workInfo = workUpdates;
    }
    
    // Extract personal preferences
    const preferenceUpdates = extractPersonalPreferences(content);
    if (Object.keys(preferenceUpdates).length > 0) {
      profileUpdates.personalPreferences = preferenceUpdates;
    }
    
    // Extract service providers
    const serviceUpdates = extractServiceProviders(content);
    if (Object.keys(serviceUpdates).length > 0) {
      profileUpdates.serviceProviders = serviceUpdates;
    }
    
    return {
      hasUpdates: Object.keys(profileUpdates).length > 0,
      updates: profileUpdates,
      extractedEntities: extractEntities(args.content),
    };
  },
});

// Apply extracted profile updates
export const applyProfileUpdates = action({
  args: {
    updates: v.any(),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    let updateCount = 0;
    
    // Apply family info updates
    if (args.updates.familyInfo) {
      await ctx.runMutation(api.profile.updateFamilyInfo, {
        familyInfo: args.updates.familyInfo,
      });
      updateCount++;
    }
    
    // Apply work info updates
    if (args.updates.workInfo) {
      await ctx.runMutation(api.profile.updateWorkInfo, {
        workInfo: args.updates.workInfo,
      });
      updateCount++;
    }
    
    // Apply personal preferences updates (these are stored differently)
    if (args.updates.personalPreferences) {
      // For now, skip personal preferences until we have proper schema
      // In production, this would update user preferences
      console.log('Personal preferences update detected:', args.updates.personalPreferences);
      updateCount++;
    }
    
    // Apply service providers updates
    if (args.updates.serviceProviders) {
      await ctx.runMutation(api.profile.updateServiceProviders, {
        serviceProviders: args.updates.serviceProviders,
      });
      updateCount++;
    }
    
    return {
      applied: updateCount > 0,
      updateCount,
    };
  },
});

// ==================== EXTRACTION HELPERS ====================

function extractFamilyInfo(content: string): any {
  const familyInfo: any = {};
  
  // Extract children information
  const childPatterns = [
    /(?:minha?\s+filha?|my\s+daughter)\s+(\w+)/gi,
    /(?:meu\s+filho|my\s+son)\s+(\w+)/gi,
    /(\w+)\s+(?:tem|is)\s+(\d+)\s+(?:anos?|years?\s+old)/gi,
  ];
  
  const children: any[] = [];
  
  childPatterns.forEach(pattern => {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        const existingChild = children.find(c => c.name.toLowerCase() === match![1].toLowerCase());
        if (!existingChild) {
          children.push({
            name: match[1].charAt(0).toUpperCase() + match[1].slice(1),
            relationship: 'child',
          });
        }
      }
    }
  });
  
  if (children.length > 0) {
    familyInfo.children = children;
  }
  
  // Extract spouse information
  const spousePatterns = [
    /(?:minha?\s+esposa|my\s+wife)\s+(\w+)/gi,
    /(?:meu\s+marido|my\s+husband)\s+(\w+)/gi,
  ];
  
  spousePatterns.forEach(pattern => {
    const match = content.match(pattern);
    if (match && match[1]) {
      familyInfo.spouse = {
        name: match[1].charAt(0).toUpperCase() + match[1].slice(1),
      };
    }
  });
  
  return familyInfo;
}

function extractWorkInfo(content: string): any {
  const workInfo: any = {};
  
  // Extract company information
  const companyPatterns = [
    /(?:trabalho\s+na?|work\s+at)\s+([A-Z][a-zA-Z\s&]+)(?:\.|,|$)/gi,
    /(?:empresa|company)\s+([A-Z][a-zA-Z\s&]+)/gi,
  ];
  
  companyPatterns.forEach(pattern => {
    const match = content.match(pattern);
    if (match && match[1]) {
      workInfo.employment = {
        company: match[1].trim(),
      };
    }
  });
  
  // Extract position information
  const positionPatterns = [
    /(?:sou|am\s+a?)\s+([\w\s]+?)(?:\s+na?|\s+at|\.|,|$)/gi,
    /(?:cargo|position)\s+(?:de\s+)?([A-Z][a-zA-Z\s]+)/gi,
  ];
  
  positionPatterns.forEach(pattern => {
    const match = content.match(pattern);
    if (match && match[1]) {
      if (!workInfo.employment) workInfo.employment = {};
      workInfo.employment.position = match[1].trim();
    }
  });
  
  return workInfo;
}

function extractPersonalPreferences(content: string): any {
  const preferences: any = {};
  
  // Extract dietary preferences
  const dietPatterns = [
    /(?:sou|am)\s+(vegetarian[oa]?|vegan[oa]?|vegetarian|vegan)/gi,
    /(?:não\s+como|don't\s+eat)\s+(carne|meat|dairy|glúten|gluten)/gi,
  ];
  
  dietPatterns.forEach(pattern => {
    const match = content.match(pattern);
    if (match && match[1]) {
      if (!preferences.lifestyle) preferences.lifestyle = {};
      
      const diet = match[1].toLowerCase();
      if (diet.includes('vegetarian')) preferences.lifestyle.diet = 'vegetarian';
      if (diet.includes('vegan')) preferences.lifestyle.diet = 'vegan';
    }
  });
  
  // Extract sleep schedule
  const sleepPatterns = [
    /(?:durmo|sleep)\s+(?:às?\s+)?(\d{1,2}):?(\d{2})?/gi,
    /(?:acordo|wake\s+up)\s+(?:às?\s+)?(\d{1,2}):?(\d{2})?/gi,
  ];
  
  sleepPatterns.forEach(pattern => {
    const match = content.match(pattern);
    if (match && match[1]) {
      if (!preferences.lifestyle) preferences.lifestyle = {};
      if (!preferences.lifestyle.sleepSchedule) preferences.lifestyle.sleepSchedule = {};
      
      const hour = match[1];
      const minute = match[2] || '00';
      const time = `${hour.padStart(2, '0')}:${minute}`;
      
      if (content.includes('durmo') || content.includes('sleep')) {
        preferences.lifestyle.sleepSchedule.bedtime = time;
      }
      if (content.includes('acordo') || content.includes('wake')) {
        preferences.lifestyle.sleepSchedule.wakeTime = time;
      }
    }
  });
  
  return preferences;
}

function extractServiceProviders(content: string): any {
  const providers: any = {};
  
  // Extract healthcare providers
  const healthcarePatterns = [
    /(?:dentista|dentist)\s+(?:dr\.?\s*|dra\.?\s*)?([A-Z][a-zA-Z\s]+)/gi,
    /(?:oftalmologista|ophthalmologist)\s+(?:dr\.?\s*|dra\.?\s*)?([A-Z][a-zA-Z\s]+)/gi,
    /(?:médico|doctor)\s+(?:dr\.?\s*|dra\.?\s*)?([A-Z][a-zA-Z\s]+)/gi,
  ];
  
  const healthcare: any[] = [];
  
  healthcarePatterns.forEach(pattern => {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        let type = 'primary_care';
        if (match[0].includes('dentista') || match[0].includes('dentist')) type = 'dentist';
        if (match[0].includes('oftalmologista') || match[0].includes('ophthalmologist')) type = 'ophthalmologist';
        
        healthcare.push({
          type,
          name: match[1].trim(),
        });
      }
    }
  });
  
  if (healthcare.length > 0) {
    providers.healthcare = healthcare;
  }
  
  return providers;
}

function extractEntities(content: string): string[] {
  const entities: string[] = [];
  
  // Extract names (capitalized words that could be people)
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match: RegExpExecArray | null;
  
  while ((match = namePattern.exec(content)) !== null) {
    const name = match[1];
    // Filter out common words that aren't names
    const commonWords = ['The', 'This', 'That', 'When', 'Where', 'How', 'Why', 'What', 'Who'];
    if (!commonWords.includes(name) && name.length > 2) {
      entities.push(name);
    }
  }
  
  return Array.from(new Set(entities)); // Remove duplicates
}

// ==================== PROFILE INTELLIGENCE ====================

// Suggest profile completions based on conversation patterns
export const suggestProfileCompletions = action({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args): Promise<any> => {
    // Get user's current profile
    const userProfile = await ctx.runQuery(api.profile.getUserProfile, {});
    
    // Get recent memories to analyze patterns
    const recentMemories = await ctx.runQuery(api.memory.getRecentMemories, {
      limit: 50,
    });
    
    const suggestions: any[] = [];
    
    // Analyze family mentions without complete family info
    if (!userProfile.familyInfo?.children || userProfile.familyInfo.children.length === 0) {
      const childMentions = recentMemories.filter(memory => 
        memory.content.match(/(?:filha?|filho|daughter|son)\s+\w+/gi)
      );
      
      if (childMentions.length > 0) {
        suggestions.push({
          type: 'family_member',
          category: 'children',
          suggestion: 'It looks like you mentioned family members. Would you like to add them to your profile?',
          confidence: 0.8,
        });
      }
    }
    
    // Analyze work mentions without complete work info
    if (!userProfile.workInfo?.employment?.company) {
      const workMentions = recentMemories.filter(memory =>
        memory.content.match(/(?:trabalho|work|empresa|company|office)/gi)
      );
      
      if (workMentions.length > 0) {
        suggestions.push({
          type: 'work_info',
          category: 'employment',
          suggestion: 'I noticed you mentioned work. Would you like to add your workplace details to your profile?',
          confidence: 0.7,
        });
      }
    }
    
    // Analyze healthcare mentions without providers
    if (!userProfile.serviceProviders?.healthcare || userProfile.serviceProviders.healthcare.length === 0) {
      const healthMentions = recentMemories.filter(memory =>
        memory.content.match(/(?:dentista|médico|doctor|dentist|appointment)/gi)
      );
      
      if (healthMentions.length > 0) {
        suggestions.push({
          type: 'service_provider',
          category: 'healthcare',
          suggestion: 'Would you like to save your healthcare providers for easy appointment scheduling?',
          confidence: 0.9,
        });
      }
    }
    
    return {
      suggestions,
      totalSuggestions: suggestions.length,
    };
  },
});

// Note: Personal preferences are stored in the user preferences field in the schema
// This function would be implemented when the preferences system is fully integrated