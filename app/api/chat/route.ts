import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    console.log('Chat API called');
    const body = await req.json();
    console.log('Request body:', body);
    
    const { messages, context = 'personal', aiProvider = 'openai' } = body;

    if (!messages || !Array.isArray(messages)) {
      console.log('Invalid messages format:', messages);
      return new Response('Invalid messages format', { status: 400 });
    }

    console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('Anthropic API Key present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('Using AI provider:', aiProvider);

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

    // Prepare messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log(`Calling ${aiProvider} with messages:`, apiMessages);

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

      console.log('Claude response received, creating stream');
      
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
            console.error('Claude streaming error:', error);
          } finally {
            controller.close();
          }
        },
      });
      
      return new StreamingTextResponse(stream);
    } else {
      // Call OpenAI API (default)
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: apiMessages as any,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      });

      console.log('OpenAI response received, creating stream');
      
      // Convert the response into a friendly text-stream
      const stream = OpenAIStream(response);
      
      // Respond with the stream
      return new StreamingTextResponse(stream);
    }

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