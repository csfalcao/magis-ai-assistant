import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Voice API called');
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.log('No audio file provided');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    console.log('Audio file received:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    });
    
    // Validate file type
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(audioFile.type)) {
      console.log('Invalid file type:', audioFile.type);
      return NextResponse.json(
        { error: 'Invalid audio file type. Please use webm, mp4, mpeg, wav, or ogg.' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 25MB for Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      console.log('File too large:', audioFile.size);
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }
    
    console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    
    // Convert File to format expected by OpenAI
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a File-like object for OpenAI
    const file = new File([buffer], audioFile.name, {
      type: audioFile.type,
    });
    
    console.log('Calling OpenAI Whisper API...');
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      temperature: 0,
    });
    
    console.log('Whisper transcription successful:', {
      text: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
    });
    
    return NextResponse.json({
      success: true,
      transcript: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
      segments: transcription.segments,
    });
    
  } catch (error) {
    console.error('Voice API error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid file format')) {
        return NextResponse.json(
          { error: 'Invalid audio file format. Please try a different format.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('File too large')) {
        return NextResponse.json(
          { error: 'Audio file too large. Please try a shorter recording.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API configuration error.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process voice input. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}