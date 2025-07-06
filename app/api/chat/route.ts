import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// Basic tools for MAGIS
const tools = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Perform basic mathematical calculations",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Mathematical expression to evaluate (e.g., '2+2', '10*5', 'sqrt(16)')"
          }
        },
        required: ["expression"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search",
      description: "Search for information (simulated for now)",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query"
          }
        },
        required: ["query"]
      }
    }
  }
];

// Tool execution functions
async function executeCalculator(expression: string): Promise<string> {
  try {
    // Basic safety check for the expression
    if (!/^[0-9+\-*/().\s]+$/.test(expression.replace(/sqrt|sin|cos|tan|log/g, ''))) {
      return "Error: Invalid mathematical expression";
    }
    
    // Simple math evaluation (basic calculator)
    const result = eval(expression.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)'));
    return `Result: ${result}`;
  } catch (error) {
    return `Error: Unable to calculate "${expression}"`;
  }
}

async function executeSearch(query: string): Promise<string> {
  // Simulated search for now - in real implementation this would call a search API
  return `Search results for "${query}": This is a simulated search result. In the full implementation, this would return real search results from a search API.`;
}

async function executeFunction(name: string, args: any): Promise<string> {
  switch (name) {
    case 'calculator':
      return await executeCalculator(args.expression);
    case 'search':
      return await executeSearch(args.query);
    default:
      return `Error: Unknown function "${name}"`;
  }
}

// Helper functions for RAG integration
async function retrieveRelevantMemories(query: string, context: string): Promise<any[]> {
  // For now, return empty array - will be integrated with Convex actions
  // In full implementation, this would:
  // 1. Generate embedding for the query
  // 2. Search the vector database
  // 3. Return relevant memories
  return [];
}

function formatMemoriesForContext(memories: any[]): string {
  if (memories.length === 0) return '';
  
  const memoryText = memories
    .slice(0, 5) // Limit to top 5 memories
    .map(memory => `- ${memory.summary || memory.content}`)
    .join('\n');
    
  return `\n\nRelevant memories about the user:\n${memoryText}\n`;
}

function getEnhancedSystemPrompt(basePrompt: string, memoryContext: string, context: string): string {
  const memorySection = memoryContext 
    ? `\n\nRelevant context about the user:${memoryContext}`
    : '';
    
  const ragInstructions = memoryContext
    ? `\n\nUse this context naturally in brief, conversational responses. Don't mention you're using stored information.`
    : '';
    
  return basePrompt + memorySection + ragInstructions;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Profile extraction function
async function extractAndUpdateProfile(userMessage: string, context: string) {
  try {
    // Simple rule-based extraction for now
    // In production, this would use more sophisticated NLP or LLM-based extraction
    
    const profileUpdates: any = {};
    const content = userMessage.toLowerCase();
    
    // Extract family information
    const familyInfo = extractFamilyFromMessage(content);
    if (Object.keys(familyInfo).length > 0) {
      profileUpdates.familyInfo = familyInfo;
    }
    
    // Extract work information
    const workInfo = extractWorkFromMessage(content);
    if (Object.keys(workInfo).length > 0) {
      profileUpdates.workInfo = workInfo;
    }
    
    // Extract preferences
    const preferences = extractPreferencesFromMessage(content);
    if (Object.keys(preferences).length > 0) {
      profileUpdates.personalPreferences = preferences;
    }
    
    // If we have updates, apply them via the backend
    if (Object.keys(profileUpdates).length > 0) {
      // Note: This would need proper authentication context
      // For now, we'll log the potential updates
      console.log('Profile updates detected:', profileUpdates);
      
      // In production, you'd call the Convex actions here:
      // await convex.mutation(api.profileFromMemory.applyProfileUpdates, {
      //   updates: profileUpdates,
      //   confidence: 0.7
      // });
    }
  } catch (error) {
    console.error('Profile extraction error:', error);
  }
}

function extractFamilyFromMessage(content: string): any {
  const familyInfo: any = {};
  
  // Extract children
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
        children.push({
          name: match[1].charAt(0).toUpperCase() + match[1].slice(1),
          relationship: 'child',
        });
      }
    }
  });
  
  if (children.length > 0) {
    familyInfo.children = children;
  }
  
  return familyInfo;
}

function extractWorkFromMessage(content: string): any {
  const workInfo: any = {};
  
  // Extract company
  const companyPatterns = [
    /(?:trabalho\s+na?|work\s+at)\s+([A-Z][a-zA-Z\s&]+)/gi,
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
  
  return workInfo;
}

function extractPreferencesFromMessage(content: string): any {
  const preferences: any = {};
  
  // Extract dietary preferences
  if (content.includes('vegetarian') || content.includes('vegetariano')) {
    preferences.lifestyle = { diet: 'vegetarian' };
  }
  if (content.includes('vegan') || content.includes('vegano')) {
    preferences.lifestyle = { diet: 'vegan' };
  }
  
  return preferences;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, context = 'personal', aiProvider = 'openai' } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Get the latest user message for RAG retrieval
    const userMessages = messages.filter((msg: any) => msg.role === 'user');
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // Retrieve relevant memories using RAG (if user message exists)
    let relevantMemories: any[] = [];
    let memoryContext = '';
    
    if (latestUserMessage.length > 10) {
      try {
        // This would call our Convex memory search functions
        // For now, we'll add a placeholder for the RAG integration
        relevantMemories = await retrieveRelevantMemories(latestUserMessage, context);
        
        if (relevantMemories.length > 0) {
          memoryContext = formatMemoriesForContext(relevantMemories);
        }
      } catch (error) {
        // RAG retrieval failed, continue without memories
        console.error('Memory retrieval failed:', error);
      }
    }

    // Create base system prompts - optimized for conversation
    const baseSystemPrompts = {
      work: `You are MAGIS, a practical AI assistant for work productivity. Be concise, professional, and action-oriented. Help with tasks, meetings, and work-life balance.

Tools available: Calculator, Search (use when helpful)

Keep responses brief and conversational unless detail is specifically requested.`,
      
      personal: `You are MAGIS, a helpful personal AI assistant. Be friendly, concise, and naturally conversational. Focus on practical help with daily life, appointments, and tasks.

Tools available: Calculator, Search (use when helpful)

Keep responses brief and to-the-point unless the user asks for more detail.`,
      
      family: `You are MAGIS, a family-focused AI assistant. Be warm but concise, helping with household management, schedules, and family coordination.

Tools available: Calculator, Search (use when helpful)

Keep responses brief and practical unless detailed help is requested.`
    };

    const basePrompt = baseSystemPrompts[context as keyof typeof baseSystemPrompts] || baseSystemPrompts.personal;
    const systemPrompt = getEnhancedSystemPrompt(basePrompt, memoryContext, context);

    // Prepare messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    if (aiProvider === 'claude') {
      // Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: true,
      });
      
      // Convert Claude stream to text stream
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                controller.enqueue(new TextEncoder().encode(chunk.delta.text));
              }
            }
          } catch (error) {
            // Silent error - streaming will end
          } finally {
            controller.close();
          }
        },
      });
      
      return new StreamingTextResponse(stream);
    } else {
      // Call OpenAI API (default) - try without tools first for simplicity
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: apiMessages as any,
        stream: true,
        temperature: 0.7,
        max_tokens: 500,
      });

      // Convert the response into a friendly text-stream
      const stream = OpenAIStream(response as any, {
        // Add callback to extract profile info from user messages
        onFinal: async () => {
          // Extract profile information from the conversation in the background
          if (latestUserMessage.length > 30) {
            try {
              // This runs after the response is sent, so it doesn't slow down the chat
              setTimeout(async () => {
                await extractAndUpdateProfile(latestUserMessage, context);
              }, 100);
            } catch (error) {
              console.error('Profile extraction failed:', error);
            }
          }
        }
      });
      
      // Respond with the stream
      return new StreamingTextResponse(stream);
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}