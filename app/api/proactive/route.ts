import { NextRequest, NextResponse } from 'next/server';

// Simple API to get proactive messages
export async function GET(request: NextRequest) {
  try {
    // TODO: Add Convex client initialization
    // const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // This would call our proactive generation functions:
    // const followUpMessages = await convex.action(api.proactive.generateProactiveMessages);
    // const contactMessages = await convex.action(api.proactive.generateContactCompletionMessages);
    
    // For now, return mock proactive messages for testing
    const mockProactiveMessages = [
      {
        id: 'mock-1',
        message: "Hey! How did your dentist appointment go yesterday?",
        messageType: 'follow_up',
        createdAt: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
      }
    ];
    
    return NextResponse.json({ 
      success: true, 
      messages: mockProactiveMessages 
    });
    
  } catch (error) {
    console.error('Failed to get proactive messages:', error);
    return NextResponse.json(
      { error: 'Failed to get proactive messages' },
      { status: 500 }
    );
  }
}

// Create or process a proactive conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageContent, conversationId, context } = body;
    
    if (!messageContent || !context) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // TODO: Add Convex client and processing
    // const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    // const results = await convex.action(api.proactive.processConversationForProactive, {
    //   messageContent,
    //   conversationId,
    //   context
    // });
    
    console.log('Processing proactive triggers for:', messageContent.substring(0, 50));
    
    return NextResponse.json({ 
      success: true, 
      processed: true,
      message: 'Proactive processing completed'
    });
    
  } catch (error) {
    console.error('Failed to process proactive triggers:', error);
    return NextResponse.json(
      { error: 'Failed to process proactive triggers' },
      { status: 500 }
    );
  }
}