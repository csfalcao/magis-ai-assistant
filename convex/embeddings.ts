import { action } from './_generated/server';
import { v } from 'convex/values';
import OpenAI from 'openai';
import { VoyageAIClient } from 'voyageai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

// Generate embeddings for text content using Voyage 3.5 Lite
export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log('🚀 VOYAGE DEBUG: generateEmbedding called');
      console.log('🚀 VOYAGE DEBUG: Text length:', args.text.length);
      console.log('🚀 VOYAGE DEBUG: Text preview:', args.text.substring(0, 100));
      
      const response = await voyage.embed({
        input: [args.text],
        model: 'voyage-3.5-lite',
        inputType: 'document',
      });

      console.log('🚀 VOYAGE DEBUG: Response received');
      console.log('🚀 VOYAGE DEBUG: Response structure:', {
        hasData: !!response.data,
        dataLength: response.data?.length || 0,
        hasUsage: !!response.usage,
        totalTokens: response.usage?.totalTokens || 0
      });

      const embedding = response.data?.[0]?.embedding || [];
      console.log('🚀 VOYAGE DEBUG: Embedding generated, length:', embedding.length);

      return {
        embedding: embedding,
        tokens: response.usage?.totalTokens || 0,
      };
    } catch (error) {
      console.error('❌ VOYAGE DEBUG: Error generating Voyage embedding:', error);
      console.error('❌ VOYAGE DEBUG: Error details:', error instanceof Error ? error.stack : 'No stack');
      throw new Error('Failed to generate embedding');
    }
  },
});

// Generate embeddings for multiple texts in batch (more efficient)
export const generateBatchEmbeddings = action({
  args: {
    texts: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Voyage allows batch processing - process all texts at once
      const response = await voyage.embed({
        input: args.texts,
        model: 'voyage-3.5-lite',
        inputType: 'document',
      });

      const results = response.data?.map((item: any, index: number) => ({
        embedding: item.embedding,
        index: index,
      })) || [];

      return {
        embeddings: results,
        totalTokens: response.usage?.totalTokens || 0,
      };
    } catch (error) {
      console.error('Error generating batch Voyage embeddings:', error);
      throw new Error('Failed to generate batch embeddings');
    }
  },
});

// Extract entities and keywords from text using GPT-4 for memory metadata
export const extractMemoryMetadata = action({
  args: {
    text: v.string(),
    context: v.string(), // 'work', 'personal', 'family'
    memoryType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const prompt = `Analyze the following text and extract relevant metadata for personal AI memory storage.

Context: ${args.context}
${args.memoryType ? `Memory Type: ${args.memoryType}` : ''}

Text: "${args.text}"

Please extract:
1. Key entities (people, places, organizations, dates, etc.)
2. Important keywords and concepts
3. Memory type (fact, preference, experience, skill, relationship)
4. Importance score (1-10, where 10 is very important personal information)
5. Sentiment score (-1 to 1, where -1 is negative, 0 is neutral, 1 is positive)
6. A concise summary (1-2 sentences)

Return as JSON:
{
  "entities": ["entity1", "entity2"],
  "keywords": ["keyword1", "keyword2"],
  "memoryType": "preference|fact|experience|skill|relationship",
  "importance": 7,
  "sentiment": 0.2,
  "summary": "Brief summary of the memory"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from GPT-4');
      }

      // Parse JSON response
      try {
        const metadata = JSON.parse(content);
        return {
          entities: metadata.entities || [],
          keywords: metadata.keywords || [],
          memoryType: metadata.memoryType || 'fact',
          importance: Math.max(1, Math.min(10, metadata.importance || 5)),
          sentiment: Math.max(-1, Math.min(1, metadata.sentiment || 0)),
          summary: metadata.summary || '',
          tokensUsed: response.usage?.total_tokens || 0,
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          entities: [],
          keywords: [],
          memoryType: 'fact',
          importance: 5,
          sentiment: 0,
          summary: args.text.substring(0, 100) + '...',
          tokensUsed: response.usage?.total_tokens || 0,
        };
      }
    } catch (error) {
      console.error('Error extracting memory metadata:', error);
      throw new Error('Failed to extract memory metadata');
    }
  },
});

// Utility function to calculate text similarity using embeddings
export const calculateSimilarity = action({
  args: {
    embedding1: v.array(v.number()),
    embedding2: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    // Calculate cosine similarity between two embeddings
    const dotProduct = args.embedding1.reduce((sum, a, i) => sum + a * args.embedding2[i], 0);
    const magnitude1 = Math.sqrt(args.embedding1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(args.embedding2.reduce((sum, a) => sum + a * a, 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  },
});

// Generate query embedding for search
export const generateQueryEmbedding = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await voyage.embed({
        input: [args.query],
        model: 'voyage-3.5-lite',
        inputType: 'query', // Use 'query' input type for search queries
      });

      return response.data?.[0]?.embedding || [];
    } catch (error) {
      console.error('Error generating Voyage query embedding:', error);
      throw new Error('Failed to generate query embedding');
    }
  },
});