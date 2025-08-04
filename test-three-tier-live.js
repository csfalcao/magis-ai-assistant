/**
 * Live Testing Script for Three-Tier Intelligence System
 * Tests the actual implementation with real Convex calls
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

// Test cases for three-tier classification
const testCases = [
  {
    id: 1,
    content: "My birthday is December 29th and I work at Google as a software engineer",
    expectedClassification: "PROFILE",
    description: "Biographical information should be PROFILE"
  },
  {
    id: 2, 
    content: "I had a great dinner at Luigi's restaurant last night with my friend Sarah",
    expectedClassification: "MEMORY",
    description: "Past experience should be MEMORY"
  },
  {
    id: 3,
    content: "I need to go to the dentist next Friday at 2 PM downtown with Dr. Smith",
    expectedClassification: "EXPERIENCE",
    description: "Future appointment should be EXPERIENCE with date resolution"
  },
  {
    id: 4,
    content: "Meeting with the client next week to discuss the project timeline",
    expectedClassification: "EXPERIENCE", 
    description: "Future meeting should be EXPERIENCE with date range"
  }
];

async function testThreeTierClassification() {
  console.log("🎯 TESTING THREE-TIER INTELLIGENCE SYSTEM");
  console.log("==========================================");
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n${testCase.id}. ${testCase.description}`);
    console.log(`Input: "${testCase.content}"`);
    console.log(`Expected: ${testCase.expectedClassification}`);
    
    try {
      // Call the actual Convex function
      const result = await convex.action("memoryExtraction:extractEntitiesFromContent", {
        content: testCase.content,
        context: "personal", 
        messageId: `test-message-${testCase.id}`,
        conversationId: `test-conversation-${testCase.id}`,
        userId: "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a" // Test user
      });
      
      console.log(`✅ Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success) {
        console.log(`📊 Classification: ${result.classification}`);
        console.log(`💾 Memory ID: ${result.memoryId}`);
        
        if (result.experienceId) {
          console.log(`📅 Experience ID: ${result.experienceId}`);
        }
        
        if (result.systemTaskId) {
          console.log(`🤖 System Task ID: ${result.systemTaskId}`);
        }
        
        // Check if classification matches expected
        const classificationCorrect = result.classification === testCase.expectedClassification;
        console.log(`🎯 Classification Match: ${classificationCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        results.push({
          testId: testCase.id,
          success: true,
          classificationCorrect,
          actualClassification: result.classification,
          extractedContent: result.extractedContent
        });
      } else {
        console.log(`❌ Error: ${result.error}`);
        results.push({
          testId: testCase.id,
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
      results.push({
        testId: testCase.id,
        success: false,
        error: error.message
      });
    }
    
    console.log("─".repeat(50));
  }
  
  // Summary
  console.log("\n📊 TEST SUMMARY");
  console.log("================");
  
  const successful = results.filter(r => r.success).length;
  const correctClassifications = results.filter(r => r.classificationCorrect).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successful}/${results.length}`);
  console.log(`Correct Classifications: ${correctClassifications}/${results.length}`);
  
  if (successful === results.length && correctClassifications === results.length) {
    console.log("\n🎉 ALL TESTS PASSED! Three-tier system working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Review results above.");
  }
  
  return results;
}

// Run the tests
testThreeTierClassification()
  .then(results => {
    console.log("\n✅ Testing complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Testing failed:", error);
    process.exit(1);
  });