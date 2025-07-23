import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI helper functions for memory extraction and analysis
 */

export const extractStructuredData = action({
  args: {
    prompt: v.string(),
    userId: v.union(v.id("users"), v.string()), // Allow string for testing
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('🤖 extractStructuredData called with userId:', args.userId);
    
    // For actions, we'll use default provider since we can't query DB here
    // User profile preferences would need to be passed as parameters
    
    const provider = args.provider || "openai";
    console.log('🤖 Using AI provider:', provider);
    
    try {
      console.log('🤖 Calling OpenAI directly...');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: args.prompt }],
        temperature: 0.1, // Low temperature for structured extraction
        max_tokens: 2000,
      });
      
      const text = response.choices[0]?.message?.content || '';
      
      console.log('✅ Generated text length:', text.length);
      console.log('✅ Generated text preview:', text.substring(0, 200));
      
      return {
        content: text,
        provider: 'openai',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      console.error("❌ AI extraction failed:", error);
      console.error("❌ Error details:", error.stack);
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  },
});

export const analyzeMemoryRelationships = action({
  args: {
    newMemoryContent: v.string(),
    relatedMemories: v.array(v.object({
      content: v.string(),
      entities: v.optional(v.array(v.string())),
      keywords: v.optional(v.array(v.string())),
      importance: v.number(),
    })),
    userId: v.union(v.id("users"), v.string()), // Allow string for testing
  },
  handler: async (ctx, args) => {
    const analysisPrompt = `
Analyze the relationship between this new memory and existing related memories:

NEW MEMORY: "${args.newMemoryContent}"

RELATED MEMORIES:
${args.relatedMemories.map((mem, i) => `${i + 1}. "${mem.content}"`).join('\n')}

For each related memory, determine:
1. Connection type: "similar", "contradicts", "updates", "related_to", "caused_by"
2. Strength: 0.0-1.0 (how strong is the connection)
3. Reason: Brief explanation of the connection

Return JSON array:
[
  {
    "memoryIndex": 1,
    "connectionType": "updates",
    "strength": 0.8,
    "reason": "New appointment time replaces old one"
  }
]`;

    // For actions, we'll use default provider
    const provider = "openai";
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.2,
        max_tokens: 1000,
      });
      
      const text = response.choices[0]?.message?.content || '[]';
      
      return {
        relationships: JSON.parse(text),
        provider: 'openai',
      };
    } catch (error: any) {
      console.error("Memory relationship analysis failed:", error);
      return {
        relationships: [],
        error: error.message,
      };
    }
  },
});

/**
 * Generate natural follow-up messages for proactive conversations
 */
export const generateFollowUpMessage = action({
  args: {
    prompt: v.string(),
    userId: v.union(v.id("users"), v.string()),
    experienceType: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('🤖 Generating follow-up message for experience type:', args.experienceType);
    
    const provider = args.provider || "openai";
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: args.prompt }],
        temperature: 0.7, // Higher temperature for more natural, varied responses
        max_tokens: 200, // Keep follow-ups concise
      });
      
      const message = response.choices[0]?.message?.content || '';
      
      console.log('✅ Generated follow-up message:', message.substring(0, 100) + '...');
      
      // Extract tone from the generated message (simple analysis)
      const tone = inferMessageTone(message);
      
      return {
        message: message.trim(),
        tone,
        provider: 'openai',
        experienceType: args.experienceType,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      console.error("❌ Follow-up message generation failed:", error);
      
      // Fallback to a simple, generic follow-up
      const fallbackMessage = generateFallbackFollowUp(args.experienceType);
      
      return {
        message: fallbackMessage,
        tone: "caring",
        provider: 'fallback',
        experienceType: args.experienceType,
        error: error.message,
      };
    }
  },
});

/**
 * Infer the tone of a generated message for quality tracking
 */
function inferMessageTone(message: string): string {
  const lowercaseMessage = message.toLowerCase();
  
  if (lowercaseMessage.includes('hope') || lowercaseMessage.includes('thinking') || lowercaseMessage.includes('care')) {
    return 'caring';
  } else if (lowercaseMessage.includes('exciting') || lowercaseMessage.includes('great') || lowercaseMessage.includes('wonderful')) {
    return 'enthusiastic';
  } else if (lowercaseMessage.includes('how did') || lowercaseMessage.includes('how was') || lowercaseMessage.includes('how are')) {
    return 'inquisitive';
  } else if (lowercaseMessage.includes('help') || lowercaseMessage.includes('support') || lowercaseMessage.includes('assist')) {
    return 'supportive';
  } else {
    return 'friendly';
  }
}

/**
 * Generate fallback follow-up messages when AI generation fails
 */
function generateFallbackFollowUp(experienceType: string): string {
  const fallbacks: Record<string, string[]> = {
    health: [
      "Hope your appointment went well! How are you feeling?",
      "Just checking in - how did your appointment go?",
      "Thinking of you after your appointment. How are you doing?",
    ],
    meal: [
      "How was your dining experience?",
      "Did you enjoy your meal?",
      "Hope you had a great time! How was the food?",
    ],
    meeting: [
      "How did your meeting go?",
      "Just checking in - how was your meeting?",
      "Hope your meeting went well!",
    ],
    travel: [
      "Hope you had a safe trip! How was your travel?",
      "Welcome back! How was your trip?",
      "How did your travel experience go?",
    ],
    entertainment: [
      "How was your experience?",
      "Did you enjoy it?",
      "Hope you had a great time!",
    ],
    other: [
      "How did everything go?",
      "Just checking in - how was your experience?",
      "Hope everything went well!",
    ],
  };
  
  const options = fallbacks[experienceType] || fallbacks.other;
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}