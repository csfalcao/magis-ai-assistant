/**
 * Create Sarah Dinner Memory
 * Complete the test dataset for Goal 1/4 disambiguation testing
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function createSarahDinnerMemory() {
  console.log("🍽️ CREATING SARAH DINNER MEMORY FOR GOAL 1/4");
  console.log("==============================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const dinnerContent = "Had dinner with my friend Sarah at Luigi's restaurant downtown last night";
  
  console.log(`📝 Creating: "${dinnerContent}"`);
  console.log(`👤 User: ${developmentUserId}`);
  console.log(`📅 Context: personal (dining experience)\n`);
  
  try {
    // Generate embedding
    console.log("📊 Generating embedding...");
    const embeddingResult = await convex.action("embeddings:generateEmbedding", {
      text: dinnerContent,
    });
    
    console.log(`✅ Embedding generated: ${embeddingResult.embedding.length} dimensions`);
    
    // Create memory using development-only insertion
    console.log("💾 Inserting Sarah dinner memory...");
    const memoryId = await convex.mutation("memory:storeMemoryForDevelopment", {
      developmentUserId: developmentUserId,
      content: dinnerContent,
      sourceType: 'test-data',
      sourceId: 'sarah-dinner-goal1-' + Date.now(),
      context: 'personal',
      embedding: embeddingResult.embedding,
      summary: dinnerContent,
      memoryType: 'experience',
      importance: 7,
      entities: ['Sarah', "Luigi's"],
      keywords: ['dinner', 'sarah', 'friend', 'luigi', 'restaurant', 'downtown', 'last night'],
      sentiment: 0.3,
    });
    
    console.log(`✅ Sarah dinner memory created successfully!`);
    console.log(`📄 Memory ID: ${memoryId}`);
    
    return {
      success: true,
      memoryId: memoryId,
      content: dinnerContent
    };
    
  } catch (error) {
    console.error("❌ Sarah dinner memory creation failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function verifyMemoryCreation() {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 VERIFYING SARAH DINNER MEMORY CREATION");
  console.log("=========================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    // Get all memories and find Sarah-related ones
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const sarahMemories = memories.filter(memory => 
      memory.content.toLowerCase().includes('sarah')
    );
    
    console.log(`📊 Found ${sarahMemories.length} Sarah-related memories:\n`);
    
    sarahMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   Type: ${memory.memoryType || 'unknown'}`);
      console.log(`   Context: ${memory.context || 'unknown'}`);
      console.log(`   Importance: ${memory.importance || 'unknown'}`);
      console.log(`   Entities: [${memory.entities?.join(', ') || 'none'}]`);
      console.log(`   Keywords: [${memory.keywords?.join(', ') || 'none'}]`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
      console.log();
    });
    
    // Check for specific required memories
    const meetingMemory = sarahMemories.find(memory => 
      memory.content.toLowerCase().includes('meeting') &&
      memory.content.toLowerCase().includes('friday')
    );
    
    const dinnerMemory = sarahMemories.find(memory => 
      memory.content.toLowerCase().includes('dinner') &&
      memory.content.toLowerCase().includes('luigi')
    );
    
    console.log("🎯 REQUIRED MEMORIES STATUS:");
    console.log(`Meeting memory: ${meetingMemory ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`Dinner memory: ${dinnerMemory ? '✅ EXISTS' : '❌ MISSING'}`);
    
    const bothExist = meetingMemory && dinnerMemory;
    
    if (bothExist) {
      console.log("\n🎉 SUCCESS: Both Sarah memories now exist!");
      console.log("✅ Goal 1/4 disambiguation test data is COMPLETE");
      console.log("✅ Ready for proper disambiguation testing");
    } else {
      console.log("\n⚠️ Incomplete: Still missing required memories");
    }
    
    return {
      meetingExists: !!meetingMemory,
      dinnerExists: !!dinnerMemory,
      bothExist: bothExist,
      totalSarahMemories: sarahMemories.length
    };
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    return null;
  }
}

async function testDisambiguationNow() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TESTING DISAMBIGUATION WITH COMPLETE DATA");
  console.log("=============================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const query = "When is my meeting with Sarah?";
  
  console.log(`Query: "${query}"`);
  console.log("Expected: Should prioritize meeting over dinner\n");
  
  try {
    const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: query,
      developmentUserId: developmentUserId,
      limit: 5,
      threshold: 0.1
    });
    
    if (results && results.length > 0) {
      console.log(`📊 Search returned ${results.length} results:\n`);
      
      results.forEach((result, index) => {
        console.log(`--- RESULT ${index + 1} ---`);
        console.log(`Content: "${result.content}"`);
        console.log(`Final Score: ${result.finalScore?.toFixed(3)}`);
        console.log(`Semantic: ${result.searchScores?.semantic?.toFixed(3)}`);
        console.log(`Entity: ${result.searchScores?.entity?.toFixed(3)}`);
        console.log(`Temporal: ${result.searchScores?.temporal?.toFixed(3)}`);
        console.log(`Keyword: ${result.searchScores?.keyword?.toFixed(3)}`);
        
        const isMeeting = result.content.toLowerCase().includes('meeting') &&
                         result.content.toLowerCase().includes('friday');
        const isDinner = result.content.toLowerCase().includes('dinner') &&
                        result.content.toLowerCase().includes('luigi');
        
        console.log(`Type: ${isMeeting ? '🤝 MEETING' : isDinner ? '🍽️ DINNER' : '❓ OTHER'}`);
        console.log();
      });
      
      // Analyze disambiguation success
      const topResult = results[0];
      const topIsMeeting = topResult.content.toLowerCase().includes('meeting') &&
                          topResult.content.toLowerCase().includes('friday');
      
      console.log("🔍 DISAMBIGUATION ANALYSIS:");
      if (topIsMeeting) {
        console.log("✅ SUCCESS: Meeting memory correctly prioritized over dinner");
        console.log("🎉 Goal 1/4 disambiguation is WORKING with semantic-dominant scoring");
      } else {
        console.log("❌ FAILURE: Dinner memory still prioritized over meeting");
        console.log("🔧 Need to investigate scoring algorithm issues");
      }
      
      return {
        success: topIsMeeting,
        topResult: topResult,
        allResults: results
      };
      
    } else {
      console.log("❌ No search results returned");
      return { success: false, reason: "No results" };
    }
    
  } catch (error) {
    console.error("❌ Disambiguation test failed:", error.message);
    return { success: false, error: error.message };
  }
}

// Execute complete Sarah dinner memory creation and testing
console.log("🚀 Starting Sarah Dinner Memory Creation & Testing...\n");

createSarahDinnerMemory()
  .then(async (creationResult) => {
    if (creationResult.success) {
      console.log("✅ Memory creation successful");
      
      // Verify both memories exist
      const verificationResult = await verifyMemoryCreation();
      
      if (verificationResult && verificationResult.bothExist) {
        console.log("✅ Verification successful");
        
        // Test disambiguation with complete data
        const disambiguationResult = await testDisambiguationNow();
        
        console.log("\n" + "=".repeat(70));
        console.log("🏁 FINAL RESULT");
        console.log("===============");
        
        if (disambiguationResult.success) {
          console.log("🎉 GOAL 1/4: DISAMBIGUATION WORKING!");
          console.log("✅ Complete test data created successfully");
          console.log("✅ Semantic-dominant scoring working for this scenario");
        } else {
          console.log("⚠️ GOAL 1/4: Algorithm issues remain");
          console.log("✅ Complete test data created successfully");
          console.log("🔧 Entity/temporal scoring bugs need fixing");
        }
      }
    } else {
      console.log(`❌ Memory creation failed: ${creationResult.error}`);
    }
    
    console.log("\n✅ Sarah Dinner Memory Process Complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Sarah Dinner Memory Process Failed:", error);
    process.exit(1);
  });