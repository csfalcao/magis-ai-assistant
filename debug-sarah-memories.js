/**
 * Debug Sarah Memories
 * Find out exactly what Sarah memories exist and their content
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function debugAllSarahMemories() {
  console.log("🔍 DEBUG: FINDING ALL SARAH MEMORIES");
  console.log("====================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    // Get ALL memories
    const allMemories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    console.log(`📊 Total memories in database: ${allMemories.length}\n`);
    
    // Search for Sarah in different ways
    const sarahMemories = allMemories.filter(memory => 
      memory.content.toLowerCase().includes('sarah')
    );
    
    const dinnerMemories = allMemories.filter(memory =>
      memory.content.toLowerCase().includes('dinner') ||
      memory.content.toLowerCase().includes("luigi's")
    );
    
    const meetingMemories = allMemories.filter(memory =>
      memory.content.toLowerCase().includes('meeting')
    );
    
    console.log("🔍 SEARCH RESULTS:");
    console.log(`Memories containing 'sarah': ${sarahMemories.length}`);
    console.log(`Memories containing 'dinner' or "luigi's": ${dinnerMemories.length}`);
    console.log(`Memories containing 'meeting': ${meetingMemories.length}`);
    
    console.log("\n📋 SARAH MEMORIES:");
    sarahMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   ID: ${memory._id}`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
      console.log();
    });
    
    console.log("🍽️ DINNER MEMORIES:");
    dinnerMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   ID: ${memory._id}`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
      console.log();
    });
    
    console.log("🤝 MEETING MEMORIES:");
    meetingMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   ID: ${memory._id}`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
      console.log();
    });
    
    // Find the specific memories we're looking for
    console.log("🎯 LOOKING FOR SPECIFIC TEST MEMORIES:");
    
    const sarahMeetingMemory = allMemories.find(memory =>
      memory.content.toLowerCase().includes('sarah') &&
      memory.content.toLowerCase().includes('meeting') &&
      memory.content.toLowerCase().includes('friday')
    );
    
    const sarahDinnerMemory = allMemories.find(memory =>
      memory.content.toLowerCase().includes('sarah') &&
      (memory.content.toLowerCase().includes('dinner') || memory.content.toLowerCase().includes("luigi's"))
    );
    
    console.log(`Sarah meeting memory: ${sarahMeetingMemory ? '✅ FOUND' : '❌ MISSING'}`);
    if (sarahMeetingMemory) {
      console.log(`   Content: "${sarahMeetingMemory.content}"`);
      console.log(`   Entities: ${JSON.stringify(sarahMeetingMemory.entities || [])}`);
      console.log(`   Keywords: ${JSON.stringify(sarahMeetingMemory.keywords || [])}`);
    }
    
    console.log(`Sarah dinner memory: ${sarahDinnerMemory ? '✅ FOUND' : '❌ MISSING'}`);
    if (sarahDinnerMemory) {
      console.log(`   Content: "${sarahDinnerMemory.content}"`);
      console.log(`   Entities: ${JSON.stringify(sarahDinnerMemory.entities || [])}`);
      console.log(`   Keywords: ${JSON.stringify(sarahDinnerMemory.keywords || [])}`);
    }
    
    // Show recent memories
    console.log("\n⏰ MOST RECENT 5 MEMORIES:");
    const recentMemories = allMemories
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
      
    recentMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
      console.log();
    });
    
    return {
      total: allMemories.length,
      sarahCount: sarahMemories.length,
      dinnerCount: dinnerMemories.length,
      meetingCount: meetingMemories.length,
      hasSarahMeeting: !!sarahMeetingMemory,
      hasSarahDinner: !!sarahDinnerMemory
    };
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    return null;
  }
}

// Execute debug
console.log("🚀 Starting Sarah Memories Debug...\n");

debugAllSarahMemories()
  .then((debugInfo) => {
    if (debugInfo) {
      console.log("\n📊 DEBUG SUMMARY:");
      console.log(`Total memories: ${debugInfo.total}`);
      console.log(`Sarah memories: ${debugInfo.sarahCount}`);
      console.log(`Dinner memories: ${debugInfo.dinnerCount}`);
      console.log(`Meeting memories: ${debugInfo.meetingCount}`);
      console.log(`Has Sarah meeting: ${debugInfo.hasSarahMeeting}`);
      console.log(`Has Sarah dinner: ${debugInfo.hasSarahDinner}`);
      
      if (!debugInfo.hasSarahDinner) {
        console.log("\n⚠️ ISSUE: Sarah dinner memory is missing from database");
        console.log("This might explain why Goal 1/4 disambiguation test is not working as expected");
      }
    }
    
    console.log("\n✅ Debug Complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Debug Failed:", error);
    process.exit(1);
  });