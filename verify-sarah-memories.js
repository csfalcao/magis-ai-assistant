/**
 * Verify Sarah Memories
 * Check what Sarah memories exist and create missing ones
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function verifySarahMemories() {
  console.log("🔍 VERIFYING SARAH MEMORIES");
  console.log("===========================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    // Get all memories and filter for Sarah
    console.log("📚 Checking existing memories...");
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const sarahMemories = memories.filter(memory => 
      memory.content.toLowerCase().includes('sarah')
    );
    
    console.log(`\n📊 Found ${sarahMemories.length} Sarah-related memories:`);
    sarahMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   Type: ${memory.memoryType || 'unknown'}`);
      console.log(`   Context: ${memory.context || 'unknown'}`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
      console.log();
    });
    
    // Check specifically for required memories
    const dinnerMemory = sarahMemories.find(memory => 
      memory.content.toLowerCase().includes('dinner') || 
      memory.content.toLowerCase().includes("luigi's")
    );
    
    const meetingMemory = sarahMemories.find(memory => 
      memory.content.toLowerCase().includes('meeting') &&
      memory.content.toLowerCase().includes('friday')
    );
    
    console.log("🎯 REQUIRED MEMORIES CHECK:");
    console.log(`Dinner memory: ${dinnerMemory ? '✅ EXISTS' : '❌ MISSING'}`);
    if (dinnerMemory) {
      console.log(`   Content: "${dinnerMemory.content}"`);
    }
    
    console.log(`Meeting memory: ${meetingMemory ? '✅ EXISTS' : '❌ MISSING'}`);
    if (meetingMemory) {
      console.log(`   Content: "${meetingMemory.content}"`);
    }
    
    // If meeting memory is missing, we need to find it from the original test data
    if (!meetingMemory) {
      console.log("\n🔍 SEARCHING FOR MEETING MEMORY IN ALL MEMORIES...");
      
      const allMeetingMemories = memories.filter(memory =>
        memory.content.toLowerCase().includes('meeting') ||
        memory.content.toLowerCase().includes('friday at 2pm') ||
        memory.content.toLowerCase().includes('wedding plans')
      );
      
      console.log(`Found ${allMeetingMemories.length} potential meeting memories:`);
      allMeetingMemories.forEach((memory, index) => {
        console.log(`${index + 1}. "${memory.content}"`);
        const hasSarah = memory.content.toLowerCase().includes('sarah');
        console.log(`   Contains Sarah: ${hasSarah ? '✅' : '❌'}`);
      });
    }
    
    return {
      total: sarahMemories.length,
      dinnerExists: !!dinnerMemory,
      meetingExists: !!meetingMemory,
      dinnerMemory,
      meetingMemory
    };
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    return null;
  }
}

async function testCoreSearch() {
  console.log("\n" + "=".repeat(50));
  console.log("🎯 TESTING CORE MULTI-DIMENSIONAL SEARCH");
  console.log("=========================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const query = "When is my meeting with Sarah?";
  
  console.log(`Query: "${query}"`);
  console.log("Expected: Should prioritize meeting memory over dinner memory\n");
  
  try {
    // Test core enhanced search (no task system)
    const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: query,
      developmentUserId: developmentUserId,
      limit: 5,
      threshold: 0.1
    });
    
    console.log(`📊 Enhanced search returned ${results?.length || 0} results\n`);
    
    if (results && results.length > 0) {
      results.forEach((result, index) => {
        console.log(`--- RESULT ${index + 1} ---`);
        console.log(`Content: "${result.content}"`);
        console.log(`Scores: ${JSON.stringify(result.searchScores || {})}`);
        console.log(`Final Score: ${result.finalScore?.toFixed(3)}`);
        
        // Analyze content type
        const isDinner = result.content.toLowerCase().includes('dinner') || 
                         result.content.toLowerCase().includes("luigi's");
        const isMeeting = result.content.toLowerCase().includes('meeting') &&
                         result.content.toLowerCase().includes('friday');
        
        console.log(`Type: ${isDinner ? 'DINNER' : isMeeting ? 'MEETING' : 'OTHER'}`);
        console.log();
      });
      
      // Analysis
      const topResult = results[0];
      const topIsMeeting = topResult.content.toLowerCase().includes('meeting') &&
                          topResult.content.toLowerCase().includes('friday');
      const topIsDinner = topResult.content.toLowerCase().includes('dinner') ||
                         topResult.content.toLowerCase().includes("luigi's");
      
      console.log("🔍 ANALYSIS:");
      console.log(`Top result is meeting-related: ${topIsMeeting ? '✅ CORRECT' : '❌ WRONG'}`);
      console.log(`Top result is dinner-related: ${topIsDinner ? '❌ DISAMBIGUATION FAILED' : '✅ GOOD'}`);
      
      if (topIsMeeting) {
        console.log("\n🎉 SUCCESS: Core search correctly disambiguates!");
        console.log("✅ Goal 1/4 may already be solved by core search");
        console.log("✅ No need for task-memory hybrid system");
      } else if (topIsDinner) {
        console.log("\n❌ ISSUE: Core search prefers dinner over meeting");
        console.log("📊 Score analysis needed to understand why");
        
        if (results.length > 1) {
          const meetingResult = results.find(r => 
            r.content.toLowerCase().includes('meeting') &&
            r.content.toLowerCase().includes('friday')
          );
          
          if (meetingResult) {
            console.log("\n📊 COMPARING SCORES:");
            console.log(`Dinner final score: ${topResult.finalScore?.toFixed(3)}`);
            console.log(`Meeting final score: ${meetingResult.finalScore?.toFixed(3)}`);
            console.log(`Score difference: ${(topResult.finalScore - meetingResult.finalScore).toFixed(3)}`);
            
            console.log("\nDinner scores:", topResult.searchScores);
            console.log("Meeting scores:", meetingResult.searchScores);
          }
        }
      }
      
    } else {
      console.log("❌ No results returned from enhanced search");
    }
    
  } catch (error) {
    console.error("❌ Search test failed:", error.message);
  }
}

// Execute verification and testing
console.log("🚀 Starting Sarah Memory Verification and Core Search Test...\n");

verifySarahMemories()
  .then(async (verification) => {
    if (verification) {
      if (verification.dinnerExists && verification.meetingExists) {
        console.log("\n✅ Both memories exist - proceeding with core search test");
        await testCoreSearch();
      } else {
        console.log("\n⚠️ Missing required memories for proper disambiguation test");
        console.log("Need both dinner and meeting memories to test disambiguation");
      }
    }
    
    console.log("\n✅ Verification and Test Complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Process Failed:", error);
    process.exit(1);
  });