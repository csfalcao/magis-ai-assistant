/**
 * Test Data Verification Protocol
 * MANDATORY validation before any test/optimization
 * Prevents testing on hallucinated data
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

// Define all test scenarios with exact memory requirements
const TEST_SCENARIOS = [
  {
    id: "1/4",
    name: "Sarah Meeting Disambiguation",
    query: "When is my meeting with Sarah?",
    requiredMemories: [
      {
        type: "correct_answer", 
        content_contains: ["meeting", "sarah", "friday"],
        description: "Meeting with Sarah memory"
      },
      {
        type: "wrong_winner",
        content_contains: ["dinner", "sarah", "luigi"],
        description: "Dinner with Sarah memory"
      }
    ]
  },
  {
    id: "2/4", 
    name: "Passport Renewal Memory",
    query: "When do I need to renew my passport?",
    requiredMemories: [
      {
        type: "correct_answer",
        content_contains: ["passport", "renew", "europe"],
        description: "Passport renewal memory"
      }
    ]
  },
  {
    id: "3/4",
    name: "Restaurant Preference vs Experience", 
    query: "What kind of restaurants do I prefer?",
    requiredMemories: [
      {
        type: "correct_answer",
        content_contains: ["hate", "waiting", "restaurants", "prefer"],
        description: "Restaurant preference memory"
      },
      {
        type: "wrong_winner", 
        content_contains: ["dinner", "nobu", "amazing"],
        description: "Restaurant dining experience memory"
      }
    ]
  },
  {
    id: "4/4",
    name: "Current Job vs Previous Job",
    query: "Where do I currently work?",
    requiredMemories: [
      {
        type: "correct_answer",
        content_contains: ["microsoft", "started", "last week"],
        description: "Recent Microsoft job memory"
      },
      {
        type: "wrong_winner",
        content_contains: ["google", "software engineer", "cloud"],
        description: "Previous Google job memory"
      }
    ]
  }
];

async function verifyTestScenario(scenario) {
  console.log(`🔍 VERIFYING SCENARIO ${scenario.id}: ${scenario.name}`);
  console.log("=".repeat(60));
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    // Get all memories to check against requirements
    const allMemories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    console.log(`Query: "${scenario.query}"`);
    console.log(`Required memories: ${scenario.requiredMemories.length}\n`);
    
    let allRequiredMemoriesFound = true;
    const foundMemories = [];
    
    // Check each required memory
    for (const requiredMemory of scenario.requiredMemories) {
      console.log(`--- Checking: ${requiredMemory.description} ---`);
      
      const matchingMemories = allMemories.filter(memory => {
        const content = memory.content.toLowerCase();
        return requiredMemory.content_contains.every(term => 
          content.includes(term.toLowerCase())
        );
      });
      
      if (matchingMemories.length > 0) {
        console.log(`✅ FOUND: ${matchingMemories.length} matching memories`);
        matchingMemories.forEach((memory, index) => {
          console.log(`   ${index + 1}. "${memory.content}"`);
          console.log(`      Created: ${new Date(memory.createdAt).toLocaleString()}`);
          console.log(`      Entities: [${memory.entities?.join(', ') || 'none'}]`);
          console.log(`      Keywords: [${memory.keywords?.join(', ') || 'none'}]`);
        });
        foundMemories.push({
          requirement: requiredMemory,
          memories: matchingMemories,
          status: "found"
        });
      } else {
        console.log(`❌ MISSING: No memories found matching requirements`);
        console.log(`   Required content contains: [${requiredMemory.content_contains.join(', ')}]`);
        allRequiredMemoriesFound = false;
        foundMemories.push({
          requirement: requiredMemory,
          memories: [],
          status: "missing"
        });
      }
      console.log();
    }
    
    // Test the actual query to see search behavior
    console.log("🔍 TESTING SEARCH BEHAVIOR:");
    console.log("-".repeat(30));
    
    const searchResults = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: scenario.query,
      developmentUserId: developmentUserId,
      limit: 5,
      threshold: 0.1
    });
    
    if (searchResults && searchResults.length > 0) {
      console.log(`Search returned ${searchResults.length} results:`);
      searchResults.forEach((result, index) => {
        console.log(`  ${index + 1}. "${result.content}"`);
        console.log(`      Final Score: ${result.finalScore?.toFixed(3)}`);
        console.log(`      Semantic: ${result.searchScores?.semantic?.toFixed(3)}`);
        console.log(`      Entity: ${result.searchScores?.entity?.toFixed(3)}`);
        console.log(`      Temporal: ${result.searchScores?.temporal?.toFixed(3)}`);
        console.log(`      Keyword: ${result.searchScores?.keyword?.toFixed(3)}`);
        console.log();
      });
      
      // Check if correct answer is winning
      const topResult = searchResults[0];
      const correctAnswer = foundMemories.find(fm => fm.requirement.type === "correct_answer");
      
      if (correctAnswer && correctAnswer.memories.length > 0) {
        const isTopResultCorrect = correctAnswer.memories.some(memory =>
          topResult.content === memory.content
        );
        
        console.log(`🎯 Top result correctness: ${isTopResultCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
        if (!isTopResultCorrect) {
          console.log(`   Expected: Content matching [${correctAnswer.requirement.content_contains.join(', ')}]`);
          console.log(`   Actual: "${topResult.content.substring(0, 60)}..."`);
        }
      }
    } else {
      console.log("❌ Search returned no results");
    }
    
    // Generate verification result
    const verificationResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      query: scenario.query,
      dataComplete: allRequiredMemoriesFound,
      foundMemories: foundMemories,
      searchResults: searchResults,
      status: allRequiredMemoriesFound ? "ready_for_testing" : "missing_data",
      missingRequirements: foundMemories.filter(fm => fm.status === "missing").map(fm => fm.requirement.description)
    };
    
    console.log(`📊 VERIFICATION RESULT: ${verificationResult.status.toUpperCase()}`);
    
    return verificationResult;
    
  } catch (error) {
    console.error(`❌ Verification failed for scenario ${scenario.id}:`, error.message);
    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      status: "verification_error",
      error: error.message
    };
  }
}

async function runCompleteVerification() {
  console.log("🚀 RUNNING COMPLETE TEST DATA VERIFICATION");
  console.log("==========================================");
  console.log("🎯 This MANDATORY step prevents testing on hallucinated data\n");
  
  const verificationResults = [];
  
  // Verify each test scenario
  for (const scenario of TEST_SCENARIOS) {
    const result = await verifyTestScenario(scenario);
    verificationResults.push(result);
    console.log("\n" + "=".repeat(80) + "\n");
  }
  
  // Generate overall verification report
  console.log("📊 OVERALL VERIFICATION REPORT");
  console.log("==============================");
  
  const readyScenarios = verificationResults.filter(r => r.status === "ready_for_testing");
  const missingDataScenarios = verificationResults.filter(r => r.status === "missing_data");
  const errorScenarios = verificationResults.filter(r => r.status === "verification_error");
  
  console.log(`✅ Ready for testing: ${readyScenarios.length}/${TEST_SCENARIOS.length} scenarios`);
  console.log(`❌ Missing data: ${missingDataScenarios.length}/${TEST_SCENARIOS.length} scenarios`);
  console.log(`⚠️ Verification errors: ${errorScenarios.length}/${TEST_SCENARIOS.length} scenarios`);
  
  if (readyScenarios.length === TEST_SCENARIOS.length) {
    console.log("\n🎉 ALL SCENARIOS VERIFIED - TESTING CAN PROCEED");
    console.log("✅ All required memories exist in database");
    console.log("✅ No hallucinated data - testing will be accurate");
    console.log("✅ Proceed with confidence to optimization testing");
  } else {
    console.log("\n🚨 VERIFICATION FAILED - TESTING CANNOT PROCEED");
    console.log("❌ Missing required memories - results would be unreliable");
    console.log("\n📋 MISSING REQUIREMENTS:");
    
    missingDataScenarios.forEach(scenario => {
      console.log(`\nScenario ${scenario.scenarioId}: ${scenario.scenarioName}`);
      scenario.missingRequirements?.forEach(req => {
        console.log(`  - ${req}`);
      });
    });
    
    console.log("\n💡 NEXT STEPS:");
    console.log("1. Create missing memories using memory creation scripts");
    console.log("2. Re-run this verification to ensure data completeness");
    console.log("3. Only proceed with testing after 100% verification success");
  }
  
  return {
    totalScenarios: TEST_SCENARIOS.length,
    readyScenarios: readyScenarios.length,
    missingDataScenarios: missingDataScenarios.length,
    errorScenarios: errorScenarios.length,
    canProceedWithTesting: readyScenarios.length === TEST_SCENARIOS.length,
    verificationResults: verificationResults
  };
}

// Export verification functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TEST_SCENARIOS,
    verifyTestScenario,
    runCompleteVerification
  };
}

// Run verification if called directly
if (require.main === module) {
  console.log("🚀 Starting Test Data Verification Protocol...\n");
  
  runCompleteVerification()
    .then((report) => {
      console.log("\n✅ Test Data Verification Protocol Complete");
      console.log(`📊 Final Result: ${report.readyScenarios}/${report.totalScenarios} scenarios ready`);
      
      if (report.canProceedWithTesting) {
        console.log("🎉 VALIDATION-FIRST TESTING APPROVED");
      } else {
        console.log("🚨 TESTING BLOCKED - Missing required data");
        process.exit(1);
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ Test Data Verification Protocol Failed:", error);
      process.exit(1);
    });
}