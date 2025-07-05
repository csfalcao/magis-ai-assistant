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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, context = 'personal', aiProvider = 'openai' } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Create system prompt based on context
    const systemPrompts = {
      work: `You are MAGIS, an AI assistant specialized in workplace productivity and professional communication. 
             You help with tasks, meetings, project management, and maintaining work-life balance. 
             Be professional, concise, and action-oriented.
             
             You have access to helpful tools:
             - Calculator: For mathematical calculations and number crunching
             - Search: For finding information (currently simulated)
             
             Use these tools when appropriate to help users more effectively.`,
      personal: `You are MAGIS, a personal AI companion who knows the user well and helps with daily life. 
                 You're friendly, supportive, and proactive in following up on experiences and goals. 
                 Remember conversations and build genuine relationships.
                 
                 You have access to helpful tools:
                 - Calculator: For mathematical calculations and number crunching
                 - Search: For finding information (currently simulated)
                 
                 Use these tools when appropriate to help users more effectively.`,
      family: `You are MAGIS, a family-oriented AI assistant who helps with household management, 
               parenting, relationships, and family activities. You're warm, understanding, and focused on 
               bringing families closer together.
               
               You have access to helpful tools:
               - Calculator: For mathematical calculations and number crunching
               - Search: For finding information (currently simulated)
               
               Use these tools when appropriate to help users more effectively.`
    };

    const systemPrompt = systemPrompts[context as keyof typeof systemPrompts] || systemPrompts.personal;

    // Prepare messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    if (aiProvider === 'claude') {
      // Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
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
      // Call OpenAI API (default) with tools
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: apiMessages as any,
        stream: false, // Disable streaming for function calls
        temperature: 0.7,
        max_tokens: 1000,
        tools: tools as any,
        tool_choice: "auto",
      });

      // Check if the response includes function calls
      const message = response.choices[0].message;
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        
        // Execute function calls
        const toolMessages = [];
        for (const toolCall of message.tool_calls) {
          const { name, arguments: args } = toolCall.function;
          const toolResult = await executeFunction(name, JSON.parse(args));
          
          toolMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult
          });
        }
        
        // Add function call and results to conversation
        const enhancedMessages = [
          ...apiMessages,
          message,
          ...toolMessages
        ];
        
        // Make another API call to get the final response
        const finalResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: enhancedMessages as any,
          stream: true,
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        const stream = OpenAIStream(finalResponse as any);
        return new StreamingTextResponse(stream);
      } else {
        // No function calls, return regular response
        const textContent = message.content || '';
        
        // Create a simple stream from the text content
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(textContent));
            controller.close();
          }
        });
        
        return new StreamingTextResponse(stream);
      }
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