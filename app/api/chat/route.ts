import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '../../../convex/_generated/api';
import { auth } from '../../../convex/auth';

export async function POST(req: Request) {
  try {
    const { messages, conversationId, context = 'personal', aiProvider = 'openai' } = await req.json();

    // Get authenticated user
    const convexAuthToken = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!convexAuthToken) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user from Convex Auth
    const user = await fetchQuery(api.users.getCurrentUser, {}, { token: convexAuthToken });
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Select AI provider based on user preference or parameter
    const provider = aiProvider === 'claude' ? anthropic : openai;
    const model = aiProvider === 'claude' ? 'claude-3-sonnet-20240229' : 'gpt-4-turbo-preview';

    // Create system prompt based on context
    const systemPrompts = {
      work: `You are MAGIS, an AI assistant specialized in workplace productivity and professional communication. 
             You help with tasks, meetings, project management, and maintaining work-life balance. 
             Be professional, concise, and action-oriented.`,
      personal: `You are MAGIS, a personal AI companion who knows the user well and helps with daily life. 
                 You're friendly, supportive, and proactive in following up on experiences and goals. 
                 Remember conversations and build genuine relationships.`,
      family: `You are MAGIS, a family-oriented AI assistant who helps with household management, 
               parenting, relationships, and family activities. You're warm, understanding, and focused on 
               bringing families closer together.`
    };

    const systemPrompt = systemPrompts[context as keyof typeof systemPrompts] || systemPrompts.personal;

    // Prepare conversation history for AI
    const conversationMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Stream response from AI
    const result = await streamText({
      model: provider(model),
      system: systemPrompt,
      messages: conversationMessages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Save user message to Convex
    await fetchMutation(
      api.conversations.sendMessage,
      {
        conversationId,
        content: messages[messages.length - 1].content,
        role: 'user',
        metadata: {
          inputMethod: 'text',
          processingTime: Date.now(),
        },
      },
      { token: convexAuthToken }
    );

    // Create a transform stream to save AI response
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        
        for await (const delta of result.textStream) {
          fullResponse += delta;
          controller.enqueue(new TextEncoder().encode(delta));
        }

        // Save AI response to Convex
        try {
          await fetchMutation(
            api.conversations.sendMessage,
            {
              conversationId,
              content: fullResponse,
              role: 'assistant',
              metadata: {
                provider: aiProvider,
                model,
                usage: result.usage ? {
                  promptTokens: await result.usage.then(u => u.promptTokens),
                  completionTokens: await result.usage.then(u => u.completionTokens),
                  totalTokens: await result.usage.then(u => u.totalTokens),
                } : undefined,
                processingTime: Date.now(),
              },
            },
            { token: convexAuthToken }
          );
        } catch (error) {
          console.error('Failed to save AI response:', error);
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}