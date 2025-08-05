// Test Three-Tier Intelligence System - Goal 4/4
// Test if profile-first resolution solves the "where do I currently work?" query

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function testGoal4ProfileFirst() {
  console.log("🎯 Testing Three-Tier Intelligence System - Goal 4/4");
  console.log("📋 Test: Profile-First Query Resolution for 'Where do I currently work?'");
  console.log("=" .repeat(60));

  const userId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const testQuery = "where do i currently work?";

  try {
    // Step 1: First, let's add the job info to profile via chat
    console.log("\n📝 Step 1: Sending job update message...");
    const jobUpdateMessage = "I just started working at Microsoft last week as a Software Engineer";
    
    // Simulate content classification
    const classificationResult = await client.action(api.contentClassifier.classifyContent, {
      content: jobUpdateMessage,
      context: "work"
    });
    
    console.log("✅ Classification Result:", {
      classification: classificationResult.classification,
      confidence: classificationResult.confidence,
      subType: classificationResult.subType
    });

    // If it's PROFILE content, extract and update profile
    if (classificationResult.classification === "PROFILE") {
      console.log("\n👤 Step 2: Extracting profile data...");
      
      const profileExtraction = await client.action(api.profileExtractor.extractProfileData, {
        content: jobUpdateMessage,
        classification: classificationResult.classification,
        context: "work",
        subType: classificationResult.subType
      });

      console.log("✅ Profile Extraction:", {
        success: profileExtraction.success,
        extractedFields: profileExtraction.extractedFields,
        profileUpdate: profileExtraction.profileUpdate
      });

      if (profileExtraction.success && profileExtraction.profileUpdate) {
        // Apply the profile update
        await client.mutation(api.profileExtractor.applyProfileUpdate, {
          userId: userId,
          profileUpdate: profileExtraction.profileUpdate,
          extractedFields: profileExtraction.extractedFields
        });
        console.log("✅ Profile updated successfully!");
      }
    }

    // Step 3: Test profile-first query resolution
    console.log("\n🔍 Step 3: Testing query with profile-first resolution...");
    console.log(`Query: "${testQuery}"`);

    const searchResults = await client.action(api.memory.enhancedMemorySearchForDevelopment, {
      developmentUserId: userId,
      query: testQuery,
      context: "work",
      limit: 5,
      threshold: 0.1
    });

    console.log("\n📊 Search Results:");
    if (searchResults && searchResults.length > 0) {
      const topResult = searchResults[0];
      console.log("\n🏆 Top Result:");
      console.log(`Content: "${topResult.content}"`);
      console.log(`Type: ${topResult.memoryType}`);
      console.log("Scores:", topResult.searchScores);
      
      // Check if it came from profile
      if (topResult.memoryType === 'profile' && topResult.searchScores.semantic === 1.0) {
        console.log("\n✅ SUCCESS: Answer retrieved from user profile!");
        console.log("🎯 Goal 4/4: PASSED - Profile-first resolution working!");
      } else {
        console.log("\n⚠️  Result came from memory, not profile");
      }
    } else {
      console.log("❌ No results found");
    }

    // Step 4: Verify profile state
    console.log("\n🔍 Step 4: Verifying user profile...");
    const user = await client.query(api.users.getUserById, { userId: userId });
    
    if (user?.workInfo?.employment?.company) {
      console.log("✅ Profile contains work info:");
      console.log(`   Company: ${user.workInfo.employment.company}`);
      console.log(`   Position: ${user.workInfo.employment.position || 'Not specified'}`);
    } else {
      console.log("❌ Profile missing work info");
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack:", error.stack);
  }
}

// Run the test
testGoal4ProfileFirst().then(() => {
  console.log("\n✅ Test completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Test error:", error);
  process.exit(1);
});