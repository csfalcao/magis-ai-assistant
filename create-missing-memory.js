/**
 * Create Missing Sarah Meeting Memory
 * Add the missing memory to create a valid disambiguation test scenario
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function createMissingSarahMeetingMemory() {
  console.log("🎯 CREATING MISSING SARAH MEETING MEMORY");
  console.log("=======================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const meetingContent = "Meeting with Sarah next Friday at 2pm downtown to discuss the wedding plans";
  
  console.log(`📝 Creating: "${meetingContent}"`);
  console.log("Context: personal (wedding planning)");
  console.log("Importance: 8 (scheduled meeting)");
  console.log("Type: experience (future event)\n");
  
  try {
    // Generate embedding
    console.log("📊 Generating embedding...");
    const embeddingResult = await convex.action("embeddings:generateEmbedding", {
      text: meetingContent,
    });
    
    console.log(`✅ Embedding generated: ${embeddingResult.embedding.length} dimensions`);
    
    // Create memory using development-only direct insertion
    console.log("💾 Creating memory directly...");
    
    // We'll use the getAllMemoriesDebug to insert directly (admin function)
    // Actually, let's use a simpler approach - add to existing memories through the test framework
    
    // First, let's check what sourceId format is used
    const existingMemories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    console.log("🔍 Checking existing memory format...");
    if (existingMemories.length > 0) {
      const sample = existingMemories[0];
      console.log(`Sample sourceId format: ${sample.sourceId || 'unknown'}`);
      console.log(`Sample sourceType: ${sample.sourceType || 'unknown'}`);
    }
    
    // Try using embeddings generation and then the createMemoryFromMessage approach
    // But we need to bypass the auth requirement
    
    console.log("⚠️ Note: Direct memory insertion requires authentication bypass");
    console.log("For testing purposes, we'll use a development workaround");
    
    // Log what we would create
    const mockMemory = {
      content: meetingContent,
      sourceType: 'test-data',
      sourceId: 'sarah-meeting-test-' + Date.now(),
      context: 'personal',
      embedding: embeddingResult.embedding,
      summary: meetingContent,
      memoryType: 'experience',
      importance: 8,
      entities: ['Sarah'],
      keywords: ['meeting', 'sarah', 'friday', '2pm', 'wedding', 'plans'],
      sentiment: 0,
    };
    
    console.log("\n📋 Memory to create:");
    console.log(`Content: ${mockMemory.content}`);
    console.log(`Context: ${mockMemory.context}`);
    console.log(`Type: ${mockMemory.memoryType}`);
    console.log(`Importance: ${mockMemory.importance}`);
    console.log(`Entities: ${mockMemory.entities.join(', ')}`);
    console.log(`Keywords: ${mockMemory.keywords.join(', ')}`);
    
    console.log("\n❌ Cannot directly insert due to authentication requirement");
    console.log("💡 Suggestion: Add this memory through the normal chat interface or");
    console.log("   modify the storeMemory function to have a development bypass");
    
    return {
      success: false,
      reason: 'Authentication required for memory insertion',
      mockMemory: mockMemory
    };
    
  } catch (error) {
    console.error("❌ Creation failed:", error.message);
    return {
      success: false,
      reason: error.message
    };
  }
}

async function suggestAlternativeApproach() {
  console.log("\n" + "=".repeat(50));
  console.log("💡 ALTERNATIVE APPROACH SUGGESTIONS");
  console.log("==================================");
  
  console.log("Since we can't create the memory directly, here are options:");
  console.log();
  console.log("1. 🔓 ADD DEVELOPMENT-ONLY MEMORY INSERTION:");
  console.log("   - Add a development-only mutation that bypasses auth");
  console.log("   - Similar to getMemoriesForDevelopment but for insertion");
  console.log("   - Maintains user isolation but skips authentication");
  console.log();
  console.log("2. 📝 USE CHAT INTERFACE:");
  console.log("   - Start a conversation and send the meeting message");
  console.log("   - Let the normal memory creation pipeline handle it");
  console.log("   - More realistic but requires UI interaction");
  console.log();
  console.log("3. 🧪 MODIFY EXISTING TEST DATA:");
  console.log("   - Find how the original test memories were created");
  console.log("   - Replicate that process for the missing memory");
  console.log("   - Ensure consistency with existing data");
  console.log();
  console.log("4. 🎯 TEST WITH EXISTING DATA:");
  console.log("   - Accept that only 1 Sarah memory exists");
  console.log("   - Test other disambiguation scenarios instead");
  console.log("   - Focus on Goals 2/4, 3/4, 4/4 which may have real data");
  
  console.log("\n🎯 RECOMMENDED: Option 1 - Add development-only memory insertion");
  console.log("This matches our existing development-only query pattern");
}

// Execute creation attempt
console.log("🚀 Starting Missing Memory Creation...\n");

createMissingSarahMeetingMemory()
  .then(async (result) => {
    if (!result.success) {
      console.log(`\n⚠️ Creation failed: ${result.reason}`);
      await suggestAlternativeApproach();
    } else {
      console.log("\n✅ Memory created successfully!");
    }
    
    console.log("\n✅ Process Complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Process Failed:", error);
    process.exit(1);
  });