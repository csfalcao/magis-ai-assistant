/**
 * Create Sarah Meeting Memory - Final Implementation
 * Using the new development-only memory insertion function
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function createSarahMeetingMemoryFinal() {
  console.log("🎯 CREATING SARAH MEETING MEMORY (FINAL)");
  console.log("=======================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const meetingContent = "Meeting with Sarah next Friday at 2pm downtown to discuss the wedding plans";
  
  console.log(`📝 Creating: "${meetingContent}"`);
  console.log(`👤 User: ${developmentUserId}`);
  console.log(`📅 Context: personal (wedding planning)\n`);
  
  try {
    // Generate embedding
    console.log("📊 Generating embedding...");
    const embeddingResult = await convex.action("embeddings:generateEmbedding", {
      text: meetingContent,
    });
    
    console.log(`✅ Embedding generated: ${embeddingResult.embedding.length} dimensions`);
    
    // Create memory using development-only insertion
    console.log("💾 Inserting memory using development function...");
    const memoryId = await convex.mutation("memory:storeMemoryForDevelopment", {
      developmentUserId: developmentUserId,
      content: meetingContent,
      sourceType: 'test-data',
      sourceId: 'sarah-meeting-goal1-' + Date.now(),
      context: 'personal',
      embedding: embeddingResult.embedding,
      summary: meetingContent,
      memoryType: 'experience',
      importance: 8,
      entities: ['Sarah'],
      keywords: ['meeting', 'sarah', 'friday', '2pm', 'wedding', 'plans'],
      sentiment: 0,
    });
    
    console.log(`✅ Memory created successfully!`);
    console.log(`📄 Memory ID: ${memoryId}`);
    
    return {
      success: true,
      memoryId: memoryId
    };
    
  } catch (error) {
    console.error("❌ Creation failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function verifySarahMemoriesAfterCreation() {
  console.log("\n" + "=".repeat(50));
  console.log("🔍 VERIFICATION: Checking Sarah memories after creation");
  console.log("=====================================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const sarahMemories = memories.filter(memory => 
      memory.content.toLowerCase().includes('sarah')
    );
    
    console.log(`📊 Found ${sarahMemories.length} Sarah-related memories:`);
    sarahMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   Type: ${memory.memoryType || 'unknown'}`);
      console.log(`   Context: ${memory.context || 'unknown'}`);
      console.log(`   Importance: ${memory.importance || 'unknown'}`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
      console.log();
    });
    
    // Check for both required memories
    const dinnerMemory = sarahMemories.find(memory => 
      memory.content.toLowerCase().includes('dinner') || 
      memory.content.toLowerCase().includes("luigi's")
    );
    
    const meetingMemory = sarahMemories.find(memory => 
      memory.content.toLowerCase().includes('meeting') &&
      memory.content.toLowerCase().includes('friday')
    );
    
    console.log("🎯 REQUIRED MEMORIES STATUS:");
    console.log(`Dinner memory: ${dinnerMemory ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`Meeting memory: ${meetingMemory ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (dinnerMemory && meetingMemory) {
      console.log("\n🎉 SUCCESS: Both Sarah memories now exist!");
      console.log("✅ Ready for disambiguation testing");
      return true;
    } else {
      console.log("\n⚠️ Still missing required memories for disambiguation test");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    return false;
  }
}

async function testCoreMultiDimensionalSearch() {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 TESTING CORE MULTI-DIMENSIONAL SEARCH");
  console.log("=========================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const query = "When is my meeting with Sarah?";
  
  console.log(`Query: "${query}"`);
  console.log("Expected: Should prioritize meeting memory over dinner memory");
  console.log("This tests the core enhanced search without task system\n");
  
  try {
    const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: query,
      developmentUserId: developmentUserId,
      limit: 5,
      threshold: 0.1
    });
    
    console.log(`📊 Enhanced search returned ${results?.length || 0} results\n`);
    
    if (results && results.length > 0) {
      // Show all results
      results.forEach((result, index) => {
        console.log(`--- RESULT ${index + 1} ---`);
        console.log(`Content: "${result.content}"`);
        console.log(`Final Score: ${result.finalScore?.toFixed(3)}`);
        console.log(`Scores: ${JSON.stringify(result.searchScores || {})}`);
        
        // Classify result type
        const isDinner = result.content.toLowerCase().includes('dinner') || 
                         result.content.toLowerCase().includes("luigi's");
        const isMeeting = result.content.toLowerCase().includes('meeting') &&
                         result.content.toLowerCase().includes('friday');
        
        console.log(`Type: ${isDinner ? '🍽️ DINNER' : isMeeting ? '🤝 MEETING' : '❓ OTHER'}`);
        console.log();
      });
      
      // Analyze top result
      const topResult = results[0];
      const topIsMeeting = topResult.content.toLowerCase().includes('meeting') &&
                          topResult.content.toLowerCase().includes('friday');
      const topIsDinner = topResult.content.toLowerCase().includes('dinner') ||
                         topResult.content.toLowerCase().includes("luigi's");
      
      console.log("🔍 ANALYSIS:");
      console.log(`Top result is meeting-related: ${topIsMeeting ? '✅ CORRECT' : '❌ WRONG'}`);
      console.log(`Top result is dinner-related: ${topIsDinner ? '❌ DISAMBIGUATION FAILED' : '✅ GOOD'}`);
      
      if (topIsMeeting) {
        console.log("\n🎉 SUCCESS: Goal 1/4 SOLVED!");
        console.log("✅ Core multi-dimensional search correctly disambiguates");
        console.log("✅ No need for additional task-memory hybrid complexity");
        console.log("✅ The enhanced search system is working perfectly");
        
        return {
          success: true,
          message: "Core search successfully disambiguates Sarah memories"
        };
      } else if (topIsDinner) {
        console.log("\n❌ PROBLEM CONFIRMED: Core search fails disambiguation");
        console.log("📊 Need to analyze why dinner scores higher than meeting");
        
        // Find meeting result for comparison
        const meetingResult = results.find(r => 
          r.content.toLowerCase().includes('meeting') &&
          r.content.toLowerCase().includes('friday')
        );
        
        if (meetingResult) {
          console.log("\n📊 SCORE COMPARISON:");
          console.log(`Dinner final score: ${topResult.finalScore?.toFixed(3)}`);
          console.log(`Meeting final score: ${meetingResult.finalScore?.toFixed(3)}`);
          console.log(`Score difference: ${(topResult.finalScore - meetingResult.finalScore).toFixed(3)}`);
          
          console.log("\n🔍 DETAILED SCORE BREAKDOWN:");
          console.log("Dinner scores:", topResult.searchScores);
          console.log("Meeting scores:", meetingResult.searchScores);
          
          console.log("\n💡 ANALYSIS NEEDED:");
          console.log("- Why does dinner have higher semantic similarity?");
          console.log("- Why doesn't query context ('meeting') boost meeting memory?");
          console.log("- Should we enhance context matching in the scoring?");
        }
        
        return {
          success: false,
          message: "Core search prioritizes dinner over meeting - disambiguation problem confirmed"
        };
      } else {
        console.log("\n⚠️ UNEXPECTED: Neither dinner nor meeting is top result");
        return {
          success: false,
          message: "Unexpected search results - neither expected memory is top result"
        };
      }
      
    } else {
      console.log("❌ No results returned from enhanced search");
      return {
        success: false,
        message: "Enhanced search returned no results"
      };
    }
    
  } catch (error) {
    console.error("❌ Search test failed:", error.message);
    return {
      success: false,
      message: `Search test failed: ${error.message}`
    };
  }
}

// Execute the complete test sequence
console.log("🚀 Starting Complete Sarah Meeting Memory Test...\n");

createSarahMeetingMemoryFinal()
  .then(async (creationResult) => {
    if (creationResult.success) {
      console.log("✅ Memory creation successful");
      
      // Verify both memories exist
      const bothExist = await verifySarahMemoriesAfterCreation();
      
      if (bothExist) {
        // Test the core search
        const testResult = await testCoreMultiDimensionalSearch();
        
        console.log("\n" + "=".repeat(60));
        console.log("🏁 FINAL RESULT");
        console.log("===============");
        
        if (testResult.success) {
          console.log("🎉 GOAL 1/4: SOLVED!");
          console.log("✅ Core enhanced search successfully disambiguates Sarah memories");
          console.log("✅ The multi-dimensional scoring system works correctly");
        } else {
          console.log("❌ GOAL 1/4: PROBLEM CONFIRMED");
          console.log("📊 Core search needs improvement for disambiguation");
          console.log(`📝 Issue: ${testResult.message}`);
        }
      }
    } else {
      console.log(`❌ Memory creation failed: ${creationResult.error}`);
    }
    
    console.log("\n✅ Complete Test Sequence Finished");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Test Sequence Failed:", error);
    process.exit(1);
  });