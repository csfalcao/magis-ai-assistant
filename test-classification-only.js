// Test Content Classification in isolation
// Uses development database where test user exists

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

// Use development database
const client = new ConvexHttpClient("https://glorious-alligator-892.convex.cloud");

async function testClassificationOnly() {
  console.log("🎯 CONTENT CLASSIFICATION ISOLATED TEST");
  console.log("=".repeat(50));
  
  // Test cases focusing on job-related classification
  const testCases = [
    // Job updates - should be PROFILE
    { content: "I work at Microsoft", expected: "PROFILE", category: "Job - Present" },
    { content: "Just started working at Google last week", expected: "PROFILE", category: "Job - Recent Start" },
    { content: "Started working at Amazon recently", expected: "PROFILE", category: "Job - Recent Start" },
    { content: "I joined Facebook yesterday", expected: "PROFILE", category: "Job - Very Recent" },
    { content: "My new job at Tesla is amazing", expected: "PROFILE", category: "Job - New Job" },
    { content: "Got hired at Apple", expected: "PROFILE", category: "Job - Hired" },
    { content: "I'm now working at Netflix", expected: "PROFILE", category: "Job - Current" },
    { content: "Started a new position at IBM", expected: "PROFILE", category: "Job - New Position" },
    
    // Other PROFILE examples
    { content: "My birthday is December 29th", expected: "PROFILE", category: "Personal Info" },
    { content: "I live in Miami", expected: "PROFILE", category: "Location" },
    { content: "Dr. Smith is my dentist", expected: "PROFILE", category: "Service Provider" },
    
    // MEMORY examples
    { content: "Had dinner at Luigi's last night", expected: "MEMORY", category: "Past Event" },
    { content: "The meeting went well yesterday", expected: "MEMORY", category: "Past Meeting" },
    { content: "Interviewed at Google last week", expected: "MEMORY", category: "Past Interview" },
    { content: "Quit my job last month", expected: "MEMORY", category: "Past Job Event" },
    
    // EXPERIENCE examples
    { content: "Meeting tomorrow at 2pm", expected: "EXPERIENCE", category: "Future Meeting" },
    { content: "Starting my new job next Monday", expected: "EXPERIENCE", category: "Future Job Start" },
    { content: "Will interview at Amazon tomorrow", expected: "EXPERIENCE", category: "Future Interview" }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const failedCases = [];

  console.log("\n📊 Running Classification Tests...\n");

  for (const test of testCases) {
    totalTests++;
    
    try {
      const result = await client.action(api.contentClassifier.classifyContent, {
        content: test.content,
        context: "personal"
      });
      
      const passed = result.classification === test.expected;
      if (passed) passedTests++;
      else failedCases.push({ ...test, got: result.classification, confidence: result.confidence });
      
      const status = passed ? "✅" : "❌";
      console.log(`${status} [${test.category}] "${test.content}"`);
      console.log(`   Expected: ${test.expected}, Got: ${result.classification} (${result.confidence})`);
      
      if (!passed) {
        console.log(`   Reasoning: ${result.reasoning}`);
        if (result.subType) console.log(`   SubType: ${result.subType}`);
      }
    } catch (error) {
      console.error(`❌ [${test.category}] Classification failed: ${error.message}`);
      failedCases.push({ ...test, error: error.message });
    }
    
    console.log(""); // Empty line for readability
  }

  // Summary
  console.log("=".repeat(50));
  console.log("📊 CLASSIFICATION TEST SUMMARY");
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${totalTests - passedTests}`);

  if (failedCases.length > 0) {
    console.log("\n❌ Failed Cases:");
    failedCases.forEach((fc, i) => {
      console.log(`\n${i + 1}. "${fc.content}"`);
      console.log(`   Category: ${fc.category}`);
      console.log(`   Expected: ${fc.expected}, Got: ${fc.got || 'ERROR'}`);
      if (fc.error) console.log(`   Error: ${fc.error}`);
    });
  }

  // Category Analysis
  console.log("\n📈 Category Performance:");
  const categories = {};
  testCases.forEach(tc => {
    if (!categories[tc.category]) categories[tc.category] = { total: 0, passed: 0 };
    categories[tc.category].total++;
  });
  
  testCases.forEach((tc, i) => {
    if (i < passedTests) categories[tc.category].passed++;
  });

  Object.entries(categories).forEach(([cat, stats]) => {
    const percent = ((stats.passed / stats.total) * 100).toFixed(0);
    console.log(`   ${cat}: ${stats.passed}/${stats.total} (${percent}%)`);
  });

  return {
    totalTests,
    passedTests,
    successRate: (passedTests/totalTests)*100,
    failedCases
  };
}

// Run the test
testClassificationOnly().then((results) => {
  console.log("\n✅ Classification test completed");
  if (results.successRate >= 90) {
    console.log("🎉 Classification accuracy is excellent!");
  } else if (results.successRate >= 80) {
    console.log("⚠️  Classification needs minor improvements");
  } else {
    console.log("❌ Classification needs significant improvements");
  }
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Test error:", error);
  process.exit(1);
});