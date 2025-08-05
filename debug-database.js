/**
 * Debug Database Contents
 * Check what memories and tasks exist for our test user
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function debugDatabase() {
  console.log("🔍 DATABASE DEBUG: Checking memories and tasks");
  console.log("=".repeat(50));
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    // Check memories
    console.log("📚 CHECKING MEMORIES:");
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    console.log(`Found ${memories?.length || 0} memories\n`);
    
    if (memories && memories.length > 0) {
      // Look for Sarah-related memories
      const sarahMemories = memories.filter(memory => 
        memory.content.toLowerCase().includes('sarah')
      );
      
      console.log(`📝 SARAH MEMORIES (${sarahMemories.length}):`);
      sarahMemories.forEach((memory, index) => {
        console.log(`${index + 1}. ${memory.content}`);
        console.log(`   Type: ${memory.memoryType || 'unknown'}`);
        console.log(`   Context: ${memory.context || 'unknown'}`);
        console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
        console.log();
      });
      
      // Look specifically for meeting memory
      const meetingMemories = memories.filter(memory =>
        memory.content.toLowerCase().includes('meeting') &&
        memory.content.toLowerCase().includes('sarah')
      );
      
      console.log(`🤝 SARAH MEETING MEMORIES (${meetingMemories.length}):`);
      meetingMemories.forEach((memory, index) => {
        console.log(`${index + 1}. ${memory.content}`);
        console.log(`   Classification: ${memory.classification || 'none'}`);
        console.log(`   Entities: ${JSON.stringify(memory.extractedEntities || {})}`);
        console.log();
      });
    }
    
    // Check tasks
    console.log("=" .repeat(50));
    console.log("📅 CHECKING TASKS:");
    
    try {
      const tasks = await convex.query("memory:searchTasksForDevelopment", {
        developmentUserId: developmentUserId,
        query: "sarah meeting",
      });
      
      console.log(`Found ${tasks?.length || 0} tasks\n`);
      
      if (tasks && tasks.length > 0) {
        tasks.forEach((task, index) => {
          console.log(`${index + 1}. ${task.title}`);
          console.log(`   Description: ${task.description}`);
          console.log(`   Tags: ${task.tags?.join(', ')}`);
          console.log(`   Context: ${task.context}`);
          console.log(`   Due: ${task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}`);
          console.log();
        });
      } else {
        console.log("❌ NO TASKS FOUND");
        console.log("This explains why the hybrid search fell back to memory search");
      }
      
    } catch (error) {
      console.log("❌ Task search failed:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

// Execute debug
console.log("🚀 Starting Database Debug...\n");
debugDatabase()
  .then(() => {
    console.log("\n✅ Debug Complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Debug Failed:", error);
    process.exit(1);
  });