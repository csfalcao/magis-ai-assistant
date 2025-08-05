/**
 * Investigate Entity Scoring Bug
 * Sarah memory has ["Sarah"] in entities but gets 0% entity score
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function investigateEntityScoringBug() {
  console.log("🐛 INVESTIGATING ENTITY SCORING BUG");
  console.log("==================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const query = "When is my meeting with Sarah?";
  
  console.log(`Query: "${query}"`);
  console.log("Expected entities in query: ['Sarah']");
  console.log("Known memory entities: ['Sarah']");
  console.log("Expected entity score: 100% (perfect match)");
  console.log("Actual entity score: 0% (BUG)\n");
  
  try {
    // Get the Sarah meeting memory directly
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const sarahMeeting = memories.find(memory =>
      memory.content.toLowerCase().includes('sarah') &&
      memory.content.toLowerCase().includes('meeting')
    );
    
    if (!sarahMeeting) {
      console.log("❌ Sarah meeting memory not found");
      return;
    }
    
    console.log("📋 SARAH MEETING MEMORY DETAILS:");
    console.log(`Content: "${sarahMeeting.content}"`);
    console.log(`Stored entities: ${JSON.stringify(sarahMeeting.entities)}`);
    console.log(`Stored keywords: ${JSON.stringify(sarahMeeting.keywords)}`);
    console.log();
    
    // Test the search and see detailed scoring
    console.log("🔍 TESTING ENTITY SCORING IN SEARCH:");
    const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: query,
      developmentUserId: developmentUserId,
      limit: 3,
      threshold: 0.1
    });
    
    if (results && results.length > 0) {
      const sarahResult = results.find(r => 
        r.content.toLowerCase().includes('sarah') &&
        r.content.toLowerCase().includes('meeting')
      );
      
      if (sarahResult) {
        console.log("🎯 SARAH MEETING SEARCH RESULT:");
        console.log(`Content: "${sarahResult.content}"`);
        console.log(`Entity Score: ${sarahResult.searchScores?.entity?.toFixed(3) || 'N/A'}`);
        console.log(`Semantic Score: ${sarahResult.searchScores?.semantic?.toFixed(3) || 'N/A'}`);
        console.log(`Temporal Score: ${sarahResult.searchScores?.temporal?.toFixed(3) || 'N/A'}`);
        console.log(`Keyword Score: ${sarahResult.searchScores?.keyword?.toFixed(3) || 'N/A'}`);
        console.log(`Final Score: ${sarahResult.finalScore?.toFixed(3) || 'N/A'}`);
        
        console.log("\n🐛 BUG ANALYSIS:");
        if (sarahResult.searchScores?.entity === 0) {
          console.log("❌ CONFIRMED BUG: Entity score is 0 despite perfect entity match");
          console.log("🔍 Possible causes:");
          console.log("   1. Entity extraction from query not working");
          console.log("   2. Entity matching algorithm broken");
          console.log("   3. Case sensitivity issues");
          console.log("   4. Array comparison logic issues");
        } else {
          console.log("✅ Entity scoring appears to be working");
        }
        
        console.log("\n💡 DEBUGGING STEPS:");
        console.log("1. Check what entities are extracted from the query");
        console.log("2. Check entity matching logic in the scoring algorithm");
        console.log("3. Test with different entity variations (case, etc.)");
      } else {
        console.log("❌ Sarah meeting result not found in search results");
      }
    } else {
      console.log("❌ No search results returned");
    }
    
    return {
      memoryHasEntities: sarahMeeting.entities && sarahMeeting.entities.length > 0,
      memoryEntities: sarahMeeting.entities,
      entityScoreInSearch: results?.[0]?.searchScores?.entity || 0
    };
    
  } catch (error) {
    console.error("❌ Entity scoring investigation failed:", error.message);
    return null;
  }
}

async function investigateTemporalScoringBug() {
  console.log("\n" + "=".repeat(60));
  console.log("⏰ INVESTIGATING TEMPORAL SCORING BUG");
  console.log("====================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const query = "When is my meeting with Sarah?";
  
  console.log(`Query: "${query}"`);
  console.log("Expected temporal context: Query asks about timing ('When')");
  console.log("Memory temporal context: 'next Friday at 2pm' (future date)");
  console.log("Expected temporal score: High (temporal relevance)");
  console.log("Actual temporal score: 0% (BUG)\n");
  
  try {
    // Get the Sarah meeting memory
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const sarahMeeting = memories.find(memory =>
      memory.content.toLowerCase().includes('sarah') &&
      memory.content.toLowerCase().includes('meeting')
    );
    
    if (!sarahMeeting) {
      console.log("❌ Sarah meeting memory not found");
      return;
    }
    
    console.log("📋 TEMPORAL ANALYSIS:");
    console.log(`Memory keywords: ${JSON.stringify(sarahMeeting.keywords)}`);
    
    const temporalKeywords = sarahMeeting.keywords?.filter(k =>
      ['friday', 'next', '2pm', 'next friday'].includes(k.toLowerCase())
    );
    console.log(`Temporal keywords found: ${JSON.stringify(temporalKeywords)}`);
    
    // Check for any temporal-related fields
    const temporalFields = Object.keys(sarahMeeting).filter(key =>
      key.includes('date') || key.includes('time') || key.includes('temporal') || key.includes('when')
    );
    console.log(`Temporal fields in memory: ${JSON.stringify(temporalFields)}`);
    
    // Test temporal scoring
    const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: query,
      developmentUserId: developmentUserId,
      limit: 3,
      threshold: 0.1
    });
    
    if (results && results.length > 0) {
      const sarahResult = results.find(r => 
        r.content.toLowerCase().includes('sarah') &&
        r.content.toLowerCase().includes('meeting')
      );
      
      if (sarahResult) {
        console.log("\n🎯 TEMPORAL SCORING RESULT:");
        console.log(`Temporal Score: ${sarahResult.searchScores?.temporal?.toFixed(3) || 'N/A'}`);
        
        if (sarahResult.searchScores?.temporal === 0) {
          console.log("❌ CONFIRMED BUG: Temporal score is 0 despite temporal context");
          console.log("🔍 Possible causes:");
          console.log("   1. Query temporal extraction not working ('When' not detected)");
          console.log("   2. Memory temporal context not recognized ('next Friday')");
          console.log("   3. Temporal matching algorithm broken");
          console.log("   4. Date parsing issues");
        } else {
          console.log("✅ Temporal scoring appears to be working");
        }
      }
    }
    
    return {
      memoryHasTemporalKeywords: temporalKeywords && temporalKeywords.length > 0,
      temporalKeywords: temporalKeywords,
      temporalScoreInSearch: results?.[0]?.searchScores?.temporal || 0
    };
    
  } catch (error) {
    console.error("❌ Temporal scoring investigation failed:", error.message);
    return null;
  }
}

// Execute investigations
console.log("🚀 Starting Entity & Temporal Scoring Bug Investigation...\n");

Promise.all([
  investigateEntityScoringBug(),
  investigateTemporalScoringBug()
]).then(([entityResult, temporalResult]) => {
  
  console.log("\n" + "=".repeat(70));
  console.log("📊 BUG INVESTIGATION SUMMARY");
  console.log("============================");
  
  if (entityResult) {
    console.log("🐛 ENTITY SCORING:");
    console.log(`Memory has entities: ${entityResult.memoryHasEntities}`);
    console.log(`Memory entities: ${JSON.stringify(entityResult.memoryEntities)}`);
    console.log(`Search entity score: ${entityResult.entityScoreInSearch}`);
    
    if (entityResult.memoryHasEntities && entityResult.entityScoreInSearch === 0) {
      console.log("❌ ENTITY SCORING BUG CONFIRMED");
    }
  }
  
  if (temporalResult) {
    console.log("\n⏰ TEMPORAL SCORING:");
    console.log(`Memory has temporal keywords: ${temporalResult.memoryHasTemporalKeywords}`);
    console.log(`Temporal keywords: ${JSON.stringify(temporalResult.temporalKeywords)}`);
    console.log(`Search temporal score: ${temporalResult.temporalScoreInSearch}`);
    
    if (temporalResult.memoryHasTemporalKeywords && temporalResult.temporalScoreInSearch === 0) {
      console.log("❌ TEMPORAL SCORING BUG CONFIRMED");
    }
  }
  
  console.log("\n💡 NEXT STEPS:");
  console.log("1. Fix entity scoring algorithm in memory search");
  console.log("2. Fix temporal scoring algorithm in memory search");
  console.log("3. Re-test Goal 1/4 with properly working entity/temporal scores");
  console.log("4. This should improve overall disambiguation quality");
  
  console.log("\n✅ Bug Investigation Complete");
  process.exit(0);
  
}).catch(error => {
  console.error("❌ Bug Investigation Failed:", error);
  process.exit(1);
});