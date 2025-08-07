// Test Profile-First Query Resolution in isolation
// Tests the query resolution system using pre-existing profile data

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient("https://glorious-alligator-892.convex.cloud");
const userId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";

async function testQueryResolutionOnly() {
  console.log("🎯 PROFILE-FIRST QUERY RESOLUTION TEST");
  console.log("=".repeat(50));
  
  console.log("\n1️⃣ Checking user profile data...");
  
  try {
    // First check what profile data exists
    const user = await client.query(api.users.getUserById, { userId: userId });
    
    if (!user) {
      console.log("❌ Test user not found");
      return { totalTests: 0, passedTests: 0, successRate: 0, failedCases: [] };
    }
    
    console.log("✅ User found:", user.email || "No email");
    console.log("📊 Profile data available:");
    console.log(`   Personal Info: ${user.personalInfo ? '✅' : '❌'}`);
    if (user.personalInfo?.location) {
      console.log(`     Location: ${user.personalInfo.location.city}, ${user.personalInfo.location.state}`);
    }
    console.log(`   Work Info: ${user.workInfo ? '✅' : '❌'}`);
    if (user.workInfo?.employment) {
      console.log(`     Company: ${user.workInfo.employment.company}`);
      console.log(`     Position: ${user.workInfo.employment.position || 'Not set'}`);
    }
    console.log(`   Family Info: ${user.familyInfo ? '✅' : '❌'}`);
    if (user.familyInfo?.spouse) {
      console.log(`     Spouse: ${user.familyInfo.spouse.name}`);
    }
    console.log(`   Service Providers: ${user.serviceProviders ? '✅' : '❌'}`);
    if (user.serviceProviders?.healthcare) {
      console.log(`     Healthcare providers: ${user.serviceProviders.healthcare.length}`);
    }
    
  } catch (error) {
    console.error("❌ Error checking user profile:", error.message);
    return { totalTests: 0, passedTests: 0, successRate: 0, failedCases: [] };
  }

  console.log("\n2️⃣ Running Profile-First Query Tests...\n");

  // Test cases for query resolution
  const testCases = [
    {
      query: "where do i currently work?",
      expectedSource: "profile",
      category: "Work Query",
      shouldFindAnswer: true
    },
    {
      query: "where do i work?",
      expectedSource: "profile", 
      category: "Work Query Alt",
      shouldFindAnswer: true
    },
    {
      query: "what company do i work for?",
      expectedSource: "profile",
      category: "Company Query",
      shouldFindAnswer: true
    },
    {
      query: "where do i live?",
      expectedSource: "profile",
      category: "Location Query",
      shouldFindAnswer: true
    },
    {
      query: "what's my location?",
      expectedSource: "profile",
      category: "Location Alt",
      shouldFindAnswer: true
    },
    {
      query: "who is my spouse?",
      expectedSource: "profile",
      category: "Family Query",
      shouldFindAnswer: true
    },
    {
      query: "who is my dentist?",
      expectedSource: "profile",
      category: "Healthcare Query",
      shouldFindAnswer: true
    },
    {
      query: "what did I have for lunch?",
      expectedSource: "memory",
      category: "Memory Query",
      shouldFindAnswer: false // Should not find in profile
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const failedCases = [];

  for (const test of testCases) {
    totalTests++;
    
    try {
      console.log(`🔍 Testing: "${test.query}"`);
      
      const searchResults = await client.action(api.memory.enhancedMemorySearchForDevelopment, {
        developmentUserId: userId,
        query: test.query,
        context: "personal",
        limit: 5,
        threshold: 0.1
      });
      
      if (searchResults && searchResults.length > 0) {
        const topResult = searchResults[0];
        const isFromProfile = topResult.memoryType === 'profile';
        const hasHighConfidence = topResult.searchScores?.semantic === 1.0;
        
        console.log(`   📊 Top result:`);
        console.log(`      Content: "${topResult.content.substring(0, 100)}..."`);
        console.log(`      Source: ${topResult.memoryType}`);
        console.log(`      Confidence: ${topResult.searchScores?.semantic || 'N/A'}`);
        
        if (test.shouldFindAnswer) {
          // Should find answer from profile
          if (isFromProfile && hasHighConfidence) {
            passedTests++;
            console.log(`   ✅ PASS: Found answer from profile with high confidence`);
          } else if (isFromProfile) {
            passedTests++;
            console.log(`   ✅ PASS: Found answer from profile (lower confidence)`);
          } else {
            console.log(`   ❌ FAIL: Expected profile answer, got from ${topResult.memoryType}`);
            failedCases.push({ 
              ...test, 
              actualSource: topResult.memoryType,
              content: topResult.content 
            });
          }
        } else {
          // Should NOT find answer from profile
          if (!isFromProfile) {
            passedTests++;
            console.log(`   ✅ PASS: Correctly did not find profile answer`);
          } else {
            console.log(`   ❌ FAIL: Unexpected profile answer found`);
            failedCases.push({ 
              ...test, 
              actualSource: topResult.memoryType,
              content: topResult.content 
            });
          }
        }
      } else {
        console.log(`   📊 No results found`);
        if (test.shouldFindAnswer) {
          console.log(`   ❌ FAIL: Expected to find answer but got no results`);
          failedCases.push({ ...test, error: "No results found" });
        } else {
          passedTests++;
          console.log(`   ✅ PASS: Correctly found no results`);
        }
      }
      
    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}`);
      failedCases.push({ ...test, error: error.message });
    }
    
    console.log(""); // Empty line for readability
  }

  // Summary
  console.log("=".repeat(50));
  console.log("📊 QUERY RESOLUTION TEST SUMMARY");
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${totalTests - passedTests}`);

  if (failedCases.length > 0) {
    console.log("\n❌ Failed Cases:");
    failedCases.forEach((fc, i) => {
      console.log(`\n${i + 1}. "${fc.query}"`);
      console.log(`   Category: ${fc.category}`);
      console.log(`   Expected source: ${fc.expectedSource}`);
      if (fc.actualSource) {
        console.log(`   Actual source: ${fc.actualSource}`);
      }
      if (fc.content) {
        console.log(`   Content: "${fc.content.substring(0, 100)}..."`);
      }
      if (fc.error) console.log(`   Error: ${fc.error}`);
    });
  }

  // Profile vs Memory breakdown
  console.log("\n📈 Source Analysis:");
  const profileTests = testCases.filter(tc => tc.expectedSource === 'profile');
  const memoryTests = testCases.filter(tc => tc.expectedSource === 'memory');
  
  console.log(`   Profile queries: ${profileTests.length} total`);
  console.log(`   Memory queries: ${memoryTests.length} total`);

  return {
    totalTests,
    passedTests,
    successRate: (passedTests/totalTests)*100,
    failedCases
  };
}

// Run the test
testQueryResolutionOnly().then((results) => {
  console.log("\n✅ Query resolution test completed");
  if (results.successRate >= 90) {
    console.log("🎉 Profile-first query resolution working excellently!");
  } else if (results.successRate >= 70) {
    console.log("⚠️  Query resolution needs improvements");
  } else {
    console.log("❌ Query resolution needs significant improvements");
  }
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Test error:", error);
  process.exit(1);
});