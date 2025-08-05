/**
 * Investigate Goal 1/4 Storage Quality
 * Analyze why entity and temporal scores are 0% despite semantic success
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function analyzeSarahMemoriesStorage() {
  console.log("🔍 ANALYZING SARAH MEMORIES STORAGE QUALITY");
  console.log("==========================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    // Get all memories and find Sarah-related ones
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const sarahMemories = memories.filter(memory => 
      memory.content.toLowerCase().includes('sarah')
    );
    
    console.log(`📊 Found ${sarahMemories.length} Sarah-related memories\n`);
    
    // Find specific memories
    const meetingMemory = sarahMemories.find(memory => 
      memory.content.toLowerCase().includes('meeting') &&
      memory.content.toLowerCase().includes('friday')
    );
    
    const dinnerMemory = sarahMemories.find(memory => 
      memory.content.toLowerCase().includes('dinner') || 
      memory.content.toLowerCase().includes("luigi's")
    );
    
    if (!meetingMemory) {
      console.log("❌ Meeting memory not found!");
      return;
    }
    
    if (!dinnerMemory) {
      console.log("❌ Dinner memory not found!");
      return;
    }
    
    console.log("🎯 MEETING MEMORY ANALYSIS");
    console.log("=========================");
    console.log(`Content: "${meetingMemory.content}"`);
    console.log(`Memory Type: ${meetingMemory.memoryType || 'undefined'}`);
    console.log(`Context: ${meetingMemory.context || 'undefined'}`);
    console.log(`Importance: ${meetingMemory.importance || 'undefined'}`);
    console.log(`Sentiment: ${meetingMemory.sentiment || 'undefined'}`);
    console.log(`Entities: ${JSON.stringify(meetingMemory.entities || [])}`);
    console.log(`Keywords: ${JSON.stringify(meetingMemory.keywords || [])}`);
    console.log(`Created: ${new Date(meetingMemory.createdAt).toLocaleString()}`);
    console.log(`Source Type: ${meetingMemory.sourceType || 'undefined'}`);
    
    console.log("\n🍽️ DINNER MEMORY ANALYSIS");
    console.log("=========================");
    console.log(`Content: "${dinnerMemory.content}"`);
    console.log(`Memory Type: ${dinnerMemory.memoryType || 'undefined'}`);
    console.log(`Context: ${dinnerMemory.context || 'undefined'}`);
    console.log(`Importance: ${dinnerMemory.importance || 'undefined'}`);
    console.log(`Sentiment: ${dinnerMemory.sentiment || 'undefined'}`);
    console.log(`Entities: ${JSON.stringify(dinnerMemory.entities || [])}`);
    console.log(`Keywords: ${JSON.stringify(dinnerMemory.keywords || [])}`);
    console.log(`Created: ${new Date(dinnerMemory.createdAt).toLocaleString()}`);
    console.log(`Source Type: ${dinnerMemory.sourceType || 'undefined'}`);
    
    // Compare storage quality
    console.log("\n📊 STORAGE QUALITY COMPARISON");
    console.log("=============================");
    
    console.log("🎯 ENTITY ANALYSIS:");
    console.log(`Meeting entities: ${meetingMemory.entities?.length || 0} - ${JSON.stringify(meetingMemory.entities || [])}`);
    console.log(`Dinner entities: ${dinnerMemory.entities?.length || 0} - ${JSON.stringify(dinnerMemory.entities || [])}`);
    
    const meetingHasSarah = meetingMemory.entities?.includes('Sarah') || meetingMemory.entities?.includes('sarah');
    const dinnerHasSarah = dinnerMemory.entities?.includes('Sarah') || dinnerMemory.entities?.includes('sarah');
    
    console.log(`Meeting has 'Sarah' entity: ${meetingHasSarah ? '✅ YES' : '❌ NO'}`);
    console.log(`Dinner has 'Sarah' entity: ${dinnerHasSarah ? '✅ YES' : '❌ NO'}`);
    
    console.log("\n⏰ TEMPORAL ANALYSIS:");
    console.log(`Meeting keywords: ${JSON.stringify(meetingMemory.keywords || [])}`);
    console.log(`Dinner keywords: ${JSON.stringify(dinnerMemory.keywords || [])}`);
    
    const meetingHasTemporal = meetingMemory.keywords?.some(k => 
      ['friday', 'next', '2pm', 'next friday'].includes(k.toLowerCase())
    );
    const dinnerHasTemporal = dinnerMemory.keywords?.some(k => 
      ['last night', 'yesterday', 'tonight'].includes(k.toLowerCase())
    );
    
    console.log(`Meeting has temporal keywords: ${meetingHasTemporal ? '✅ YES' : '❌ NO'}`);
    console.log(`Dinner has temporal keywords: ${dinnerHasTemporal ? '✅ YES' : '❌ NO'}`);
    
    // Check for specific temporal/date fields
    const meetingTemporalFields = Object.keys(meetingMemory).filter(key => 
      key.includes('date') || key.includes('time') || key.includes('temporal')
    );
    const dinnerTemporalFields = Object.keys(dinnerMemory).filter(key => 
      key.includes('date') || key.includes('time') || key.includes('temporal')
    );
    
    console.log(`Meeting temporal fields: ${JSON.stringify(meetingTemporalFields)}`);
    console.log(`Dinner temporal fields: ${JSON.stringify(dinnerTemporalFields)}`);
    
    return {
      meetingMemory,
      dinnerMemory,
      entityIssues: {
        meetingHasSarah,
        dinnerHasSarah,
        bothShouldHaveSarah: true
      },
      temporalIssues: {
        meetingHasTemporal,
        dinnerHasTemporal,
        meetingTemporalFields,
        dinnerTemporalFields
      }
    };
    
  } catch (error) {
    console.error("❌ Storage analysis failed:", error.message);
    return null;
  }
}

async function testEntityMatchingLogic() {
  console.log("\n" + "=".repeat(60));
  console.log("🧠 TESTING ENTITY MATCHING LOGIC");
  console.log("================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const query = "When is my meeting with Sarah?";
  
  console.log(`Query: "${query}"`);
  console.log("Expected entities in query: ['Sarah']");
  console.log("Testing how entity scores are calculated...\n");
  
  try {
    // Get detailed search results to see scoring breakdown
    const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: query,
      developmentUserId: developmentUserId,
      limit: 3,
      threshold: 0.1
    });
    
    if (results && results.length > 0) {
      results.forEach((result, index) => {
        console.log(`--- RESULT ${index + 1} ---`);
        console.log(`Content: "${result.content}"`);
        console.log(`Entity Score: ${result.searchScores?.entity?.toFixed(3) || 'N/A'}`);
        
        // Analyze why entity score is what it is
        const isSarahMemory = result.content.toLowerCase().includes('sarah');
        console.log(`Contains 'Sarah' in content: ${isSarahMemory ? '✅ YES' : '❌ NO'}`);
        
        if (isSarahMemory && result.searchScores?.entity === 0) {
          console.log("⚠️ ENTITY SCORING ISSUE: Memory contains Sarah but entity score is 0");
        }
        
        console.log();
      });
    }
    
  } catch (error) {
    console.error("❌ Entity matching test failed:", error.message);
  }
}

async function testTemporalScoringLogic() {
  console.log("\n" + "=".repeat(60));
  console.log("⏰ TESTING TEMPORAL SCORING LOGIC");
  console.log("=================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  const temporalQueries = [
    {
      query: "When is my meeting with Sarah?",
      expected: "Should find 'next Friday' temporal context"
    },
    {
      query: "What did I do last night?",
      expected: "Should find 'last night' temporal context"
    }
  ];
  
  for (const test of temporalQueries) {
    console.log(`--- TESTING: "${test.query}" ---`);
    console.log(`Expected: ${test.expected}`);
    
    try {
      const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
        query: test.query,
        developmentUserId: developmentUserId,
        limit: 3,
        threshold: 0.1
      });
      
      if (results && results.length > 0) {
        const topResult = results[0];
        console.log(`Top result: "${topResult.content.substring(0, 60)}..."`);
        console.log(`Temporal Score: ${topResult.searchScores?.temporal?.toFixed(3) || 'N/A'}`);
        
        if (topResult.searchScores?.temporal === 0) {
          console.log("⚠️ TEMPORAL SCORING ISSUE: No temporal scoring detected");
        }
      }
      
    } catch (error) {
      console.error(`❌ Temporal test failed: ${error.message}`);
    }
    
    console.log();
  }
}

// Execute comprehensive storage analysis
console.log("🚀 Starting Goal 1/4 Storage Quality Investigation...\n");

analyzeSarahMemoriesStorage()
  .then(async (storageAnalysis) => {
    if (storageAnalysis) {
      console.log("\n🔍 STORAGE ANALYSIS COMPLETE");
      
      // Test entity matching logic
      await testEntityMatchingLogic();
      
      // Test temporal scoring logic  
      await testTemporalScoringLogic();
      
      // Generate recommendations
      console.log("\n" + "=".repeat(70));
      console.log("💡 RECOMMENDATIONS");
      console.log("==================");
      
      if (!storageAnalysis.entityIssues.meetingHasSarah || !storageAnalysis.entityIssues.dinnerHasSarah) {
        console.log("🔧 ENTITY STORAGE ISSUE:");
        console.log("- Sarah entity not properly extracted during memory creation");
        console.log("- Fix entity extraction logic in memory storage pipeline");
      }
      
      if (!storageAnalysis.temporalIssues.meetingHasTemporal) {
        console.log("🔧 TEMPORAL STORAGE ISSUE:");
        console.log("- 'next Friday' temporal context not captured in keywords");
        console.log("- Fix temporal extraction logic in memory storage pipeline");
      }
      
      console.log("\n✅ Investigation Complete - Issues identified for fixing");
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Storage Investigation Failed:", error);
    process.exit(1);
  });