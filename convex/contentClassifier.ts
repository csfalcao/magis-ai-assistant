import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * AI Content Classification for Three-Tier Intelligence System
 * Classifies user content into PROFILE / MEMORY / EXPERIENCE
 */

export type ContentClassification = "PROFILE" | "MEMORY" | "EXPERIENCE";

interface ClassificationResult {
  classification: ContentClassification;
  confidence: number;
  reasoning: string;
  subType?: string; // e.g., "work_info", "personal_info", "preference"
}

// Classification examples for AI context
const CLASSIFICATION_EXAMPLES = `
PROFILE (WHO I AM - Biographical/Current State):
- "I work at Microsoft" → PROFILE (work_info)
- "My birthday is December 29th" → PROFILE (personal_info)
- "I live in Miami" → PROFILE (personal_info)
- "Dr. Smith is my dentist" → PROFILE (service_providers)
- "I'm vegetarian" → PROFILE (preferences)
- "Just started working at Microsoft last week" → PROFILE (work_info)
- "Started working at Google last week" → PROFILE (work_info)
- "I joined Amazon recently" → PROFILE (work_info)
- "My new job at Tesla is amazing" → PROFILE (work_info)
- "I'm now working at Apple" → PROFILE (work_info)
- "Got hired at Meta" → PROFILE (work_info)
- "I'm a software engineer at Microsoft" → PROFILE (work_info)
- "My wife's name is Sarah" → PROFILE (family_info)
- "Started a new position at IBM" → PROFILE (work_info)
- "I'm the new CTO at a startup" → PROFILE (work_info)

MEMORY (WHAT I DID - Past Events/Experiences):
- "Had dinner at Luigi's last night" → MEMORY
- "The meeting with Bob went well yesterday" → MEMORY
- "I loved the sushi at Nobu" → MEMORY
- "Visited the dentist last month" → MEMORY
- "My trip to Paris was amazing" → MEMORY
- "Sarah and I discussed the wedding plans" → MEMORY
- "Interviewed at Google last week" → MEMORY (past event, not current job)
- "Quit my job last month" → MEMORY (past event, not current state)

EXPERIENCE (WHAT I'LL DO - Future Events/Plans):
- "Meeting with Sarah next Friday at 2pm" → EXPERIENCE
- "Need to renew my passport next month" → EXPERIENCE
- "Dentist appointment tomorrow" → EXPERIENCE
- "Going to Miami next week" → EXPERIENCE
- "Have to finish the report by Monday" → EXPERIENCE
- "Dinner reservation at 7pm tonight" → EXPERIENCE
- "Starting my new job next Monday" → EXPERIENCE (future event)
- "Will interview at Amazon tomorrow" → EXPERIENCE (future event)
`;

/**
 * Classify content using AI to determine if it's PROFILE, MEMORY, or EXPERIENCE
 */
export const classifyContent = action({
  args: {
    content: v.string(),
    context: v.string(), // 'work', 'personal', 'family'
  },
  handler: async (ctx, args): Promise<ClassificationResult> => {
    const { content, context } = args;
    
    console.log(`🤖 Classifying content: "${content.substring(0, 100)}..."`);

    try {
      const prompt = `You are an AI classifier for a personal assistant's Three-Tier Intelligence System.

Classify the following user content into one of three categories:

1. PROFILE - Biographical information, current state, identity
   - Current job, address, family members
   - Preferences, habits, service providers
   - Any "I am", "I work at", "I live in" statements
   - Updates to personal information
   - IMPORTANT: Job updates like "started working", "new job", "joined company" are PROFILE
   - Even if mentioned with time reference (last week, recently), job changes update current state

2. MEMORY - Past events, experiences, things that happened
   - Past activities, meetings, dinners
   - Previous experiences, trips, events
   - Things that happened but don't change current state
   - NOT job changes or moves - those are PROFILE updates

3. EXPERIENCE - Future events, plans, upcoming activities
   - Scheduled meetings, appointments
   - Future plans, deadlines, reminders
   - Anything with future time indicators
   - Starting a job "next week" is EXPERIENCE until it happens

Context: ${context}
Content: "${content}"

Examples:
${CLASSIFICATION_EXAMPLES}

Analyze the content and provide:
1. Classification: PROFILE, MEMORY, or EXPERIENCE
2. Confidence: 0.0 to 1.0
3. Reasoning: Brief explanation of why
4. SubType (if PROFILE): work_info, personal_info, family_info, preferences, or service_providers

Respond with valid JSON only (no markdown formatting):
{
  "classification": "PROFILE|MEMORY|EXPERIENCE",
  "confidence": 0.95,
  "reasoning": "Brief explanation",
  "subType": "work_info" // only if PROFILE
}`;

      const result = await generateText({
        model: openai('gpt-4-turbo'),
        prompt: prompt,
        temperature: 0.1, // Low temperature for consistent classification
      });

      // Parse the JSON response
      try {
        // Handle potential markdown-wrapped JSON
        let jsonText = result.text.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        }
        const classification = JSON.parse(jsonText);
        
        // Validate the classification
        if (!["PROFILE", "MEMORY", "EXPERIENCE"].includes(classification.classification)) {
          throw new Error(`Invalid classification: ${classification.classification}`);
        }

        console.log(`✅ Classification: ${classification.classification} (${classification.confidence})`);
        console.log(`   Reasoning: ${classification.reasoning}`);
        if (classification.subType) {
          console.log(`   SubType: ${classification.subType}`);
        }

        return {
          classification: classification.classification as ContentClassification,
          confidence: classification.confidence || 0.8,
          reasoning: classification.reasoning || "AI classification",
          subType: classification.subType,
        };
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        
        // Fallback rule-based classification
        return fallbackClassification(content);
      }
    } catch (error) {
      console.error("AI classification failed:", error);
      
      // Fallback to simple rule-based classification
      return fallbackClassification(content);
    }
  },
});

/**
 * Fallback rule-based classification when AI fails
 */
function fallbackClassification(content: string): ClassificationResult {
  const contentLower = content.toLowerCase();
  
  // Check for PROFILE indicators
  const profileIndicators = [
    'i work at', 'i am', 'i\'m', 'my name is', 'i live', 'my birthday',
    'my wife', 'my husband', 'my doctor', 'my dentist', 'i prefer',
    'started working at', 'new job', 'just joined', 'joined', 'working at',
    'got hired', 'new position', 'my job', 'i\'m now', 'recently joined',
    'started at', 'work for', 'employed at', 'position at'
  ];
  
  // Check for EXPERIENCE indicators (future)
  const experienceIndicators = [
    'next', 'tomorrow', 'will', 'going to', 'have to', 'need to',
    'appointment', 'meeting with', 'scheduled', 'planning to',
    'remind me', 'don\'t forget'
  ];
  
  // Check for MEMORY indicators (past)
  const memoryIndicators = [
    'yesterday', 'last', 'went', 'had', 'was', 'did', 'visited',
    'met with', 'finished', 'completed', 'ate at', 'saw'
  ];
  
  // Count indicators
  const profileCount = profileIndicators.filter(indicator => 
    contentLower.includes(indicator)
  ).length;
  
  const experienceCount = experienceIndicators.filter(indicator => 
    contentLower.includes(indicator)
  ).length;
  
  const memoryCount = memoryIndicators.filter(indicator => 
    contentLower.includes(indicator)
  ).length;
  
  // Determine classification based on highest count
  if (profileCount > experienceCount && profileCount > memoryCount) {
    return {
      classification: "PROFILE",
      confidence: 0.7,
      reasoning: "Rule-based: Contains profile indicators",
    };
  } else if (experienceCount > memoryCount) {
    return {
      classification: "EXPERIENCE",
      confidence: 0.7,
      reasoning: "Rule-based: Contains future event indicators",
    };
  } else {
    return {
      classification: "MEMORY",
      confidence: 0.7,
      reasoning: "Rule-based: Default to memory for past events",
    };
  }
}

/**
 * Batch classify multiple pieces of content
 */
export const batchClassifyContent = action({
  args: {
    contents: v.array(v.object({
      content: v.string(),
      context: v.string(),
    })),
  },
  handler: async (ctx, args): Promise<ClassificationResult[]> => {
    console.log(`🤖 Batch classifying ${args.contents.length} pieces of content`);
    
    const results = await Promise.all(
      args.contents.map(item => 
        ctx.runAction(api.contentClassifier.classifyContent, {
          content: item.content,
          context: item.context,
        })
      )
    );
    
    return results;
  },
});