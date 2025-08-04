/**
 * Debug Memory Retrieval
 * Test the memory search functions directly
 */

const { ConvexHttpClient } = require("convex/browser");

const convex = new ConvexHttpClient("https://glorious-alligator-892.convex.cloud");

async function debugMemoryRetrieval() {
  console.log("🔍 DEBUGGING MEMORY RETRIEVAL");
  console.log("=============================");
  
  // Test 1: Check if we have memories
  console.log("\n1. Checking stored memories...");
  try {
    const allMemories = await convex.query("memory:getAllMemoriesDebug", {});
    console.log(`✅ Found ${allMemories.length} stored memories`);
    
    // Show birthday-related memories
    const birthdayMemories = allMemories.filter(m => 
      m.content.toLowerCase().includes('birthday') || 
      m.content.toLowerCase().includes('december')
    );
    console.log(`🎂 Birthday-related memories: ${birthdayMemories.length}`);
    birthdayMemories.forEach(m => {
      console.log(`   - "${m.content}"`);
    });
    
  } catch (error) {
    console.error("❌ Error getting memories:", error.message);
    return;
  }
  
  // Test 2: Test smart memory search directly
  console.log("\n2. Testing smart memory search...");
  try {
    const smartResults = await convex.action("memory:smartMemorySearch", {
      query: "When is my birthday?",
      context: "personal",
      limit: 5
    });
    
    console.log(`✅ Smart search returned ${smartResults?.length || 0} results`);
    if (smartResults && smartResults.length > 0) {
      smartResults.forEach((result, index) => {
        console.log(`   ${index + 1}. "${result.content}" (importance: ${result.importance})`);
      });
    }
    
  } catch (error) {
    console.error("❌ Smart search failed:", error.message);
    console.error("❌ Error details:", error);
  }
  
  // Test 3: Test keyword search
  console.log("\n3. Testing keyword search (may fail due to auth)...");
  try {
    const keywordResults = await convex.query("memory:searchByKeywords", {
      keywords: ["birthday", "december"],
      limit: 5
    });
    
    console.log(`✅ Keyword search returned ${keywordResults?.length || 0} results`);
    if (keywordResults && keywordResults.length > 0) {
      keywordResults.forEach((result, index) => {
        console.log(`   ${index + 1}. "${result.content}"`);
      });
    }
    
  } catch (error) {
    console.error("❌ Keyword search failed (expected due to auth):", error.message);
  }
  
  // Test 4: Test the exact query extraction
  console.log("\n4. Testing query keyword extraction...");
  const query = "When is my birthday?";
  const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
  console.log(`📝 Query: "${query}"`);
  console.log(`🔑 Extracted keywords: [${keywords.join(', ')}]`);
  
  // Test 5: Manual memory filtering simulation
  console.log("\n5. Simulating memory filtering...");
  try {
    const allMemories = await convex.query("memory:getAllMemoriesDebug", {});
    
    // Simulate what the chat API should be doing
    const relevantMemories = allMemories.filter(memory => {
      const content = memory.content.toLowerCase();
      return keywords.some(keyword => content.includes(keyword)) ||
             content.includes('birthday') ||
             content.includes('december');
    });
    
    console.log(`🎯 Manually filtered memories: ${relevantMemories.length}`);
    relevantMemories.forEach(memory => {
      console.log(`   - "${memory.content}" (Classification: ${memory.classification})`);
    });
    
    if (relevantMemories.length > 0) {
      console.log("\n✅ CONCLUSION: Memories exist and can be filtered!");
      console.log("❌ ISSUE: Chat API is not properly retrieving these memories");
    } else {
      console.log("\n❌ CONCLUSION: No relevant memories found even with manual filtering");
    }
    
  } catch (error) {
    console.error("❌ Manual filtering failed:", error.message);
  }
}

// Run debug
debugMemoryRetrieval()
  .then(() => {
    console.log("\n🔍 Debug completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  });