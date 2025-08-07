// Debug script for Convex production issues
// Tests individual functions to isolate problems

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient("https://basic-fish-163.convex.cloud");
const userId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";

async function debugConvexProduction() {
  console.log("🔍 CONVEX PRODUCTION DEBUG SCRIPT");
  console.log("=".repeat(50));
  
  // Test 1: Basic connectivity
  console.log("\n1️⃣ Testing Basic Connectivity...");
  try {
    const user = await client.query(api.users.getUserById, { userId });
    if (user) {
      console.log("✅ Basic connectivity works");
      console.log("   User found:", user.email || "No email");
      console.log("   Has profile data:", {
        personalInfo: !!user.personalInfo,
        workInfo: !!user.workInfo,
        familyInfo: !!user.familyInfo
      });
    } else {
      console.log("❌ User not found in database");
    }
  } catch (error) {
    console.error("❌ Basic connectivity failed:", error.message);
  }

  // Test 2: Content Classification
  console.log("\n2️⃣ Testing Content Classification...");
  const testPhrases = [
    { content: "I work at Microsoft", expected: "PROFILE" },
    { content: "Just started working at Google last week", expected: "PROFILE" },
    { content: "My new job at Amazon is great", expected: "PROFILE" },
    { content: "Had dinner last night", expected: "MEMORY" },
    { content: "Meeting tomorrow at 2pm", expected: "EXPERIENCE" }
  ];

  for (const test of testPhrases) {
    try {
      const result = await client.action(api.contentClassifier.classifyContent, {
        content: test.content,
        context: "personal"
      });
      const status = result.classification === test.expected ? "✅" : "❌";
      console.log(`   ${status} "${test.content}"`);
      console.log(`      Expected: ${test.expected}, Got: ${result.classification} (${result.confidence})`);
      if (result.classification !== test.expected) {
        console.log(`      Reasoning: ${result.reasoning}`);
      }
    } catch (error) {
      console.error(`   ❌ Classification failed: ${error.message}`);
    }
  }

  // Test 3: Profile Extraction
  console.log("\n3️⃣ Testing Profile Extraction...");
  try {
    const testContent = "I work at Microsoft as a Software Engineer";
    const extraction = await client.action(api.profileExtractor.extractProfileData, {
      content: testContent,
      classification: "PROFILE",
      context: "personal",
      subType: "work_info"
    });
    
    if (extraction.success) {
      console.log("✅ Profile extraction works");
      console.log("   Extracted fields:", extraction.extractedFields);
      console.log("   Profile update:", JSON.stringify(extraction.profileUpdate, null, 2));
    } else {
      console.log("❌ Profile extraction failed");
    }
  } catch (error) {
    console.error("❌ Profile extraction error:", error.message);
  }

  // Test 4: Memory Extraction (The problematic one)
  console.log("\n4️⃣ Testing Memory Extraction...");
  try {
    // First check if the function exists
    console.log("   Checking if memory extraction function exists...");
    
    const testResult = await client.action(api.memoryExtraction.extractEntitiesFromContent, {
      content: "Test memory content",
      context: "personal",
      messageId: "test-msg-" + Date.now(),
      conversationId: "test-conversation",
      userId: userId,
      classification: "MEMORY"
    });
    
    console.log("✅ Memory extraction works!");
    console.log("   Result:", testResult);
  } catch (error) {
    console.error("❌ Memory extraction failed:", error.message);
    console.error("   Error details:", error);
    
    // Check if it's an auth issue
    if (error.message.includes("Not authenticated")) {
      console.log("   ⚠️  Authentication issue detected");
    }
    
    // Check if function doesn't exist
    if (error.message.includes("Could not find public function")) {
      console.log("   ⚠️  Function not found - may need deployment");
    }
  }

  // Test 5: Enhanced Memory Search
  console.log("\n5️⃣ Testing Enhanced Memory Search...");
  try {
    const searchResult = await client.action(api.memory.enhancedMemorySearchForDevelopment, {
      developmentUserId: userId,
      query: "where do I work?",
      context: "personal",
      limit: 5,
      threshold: 0.1
    });
    
    console.log("✅ Enhanced memory search works!");
    console.log("   Results found:", searchResult?.length || 0);
  } catch (error) {
    console.error("❌ Enhanced memory search failed:", error.message);
  }

  // Test 6: System Tasks
  console.log("\n6️⃣ Testing System Tasks...");
  try {
    const tasks = await client.query(api.systemTaskExecutor.getPendingSystemTasks, {
      limit: 5
    });
    console.log("✅ System tasks query works!");
    console.log("   Pending tasks:", tasks?.length || 0);
  } catch (error) {
    console.error("❌ System tasks query failed:", error.message);
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 DEBUG SUMMARY");
  console.log("Check the results above to identify which components are failing");
  console.log("Common issues:");
  console.log("- Authentication: Functions may require auth context");
  console.log("- Deployment: Functions may not be deployed to production");
  console.log("- User ID: Test user may not exist in production");
}

// Run the debug script
debugConvexProduction().then(() => {
  console.log("\n✅ Debug script completed");
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Debug script error:", error);
  process.exit(1);
});