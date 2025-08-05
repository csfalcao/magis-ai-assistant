/**
 * Test Fixed Entity/Temporal Scoring Across All 4 Goals
 * Verify that entity and temporal scoring now work properly
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

const testGoals = [
  {
    id: "1/4",
    name: "Sarah Meeting Disambiguation",
    query: "When is my meeting with Sarah?",
    expectedKeywords: ["meeting", "sarah", "friday"],
    expectedEntities: ["Sarah"],
    description: "Should prioritize meeting over dinner with proper entity/temporal scoring"
  },
  {
    id: "2/4", 
    name: "Passport Renewal Memory",
    query: "When do I need to renew my passport?",
    expectedKeywords: ["passport", "renew", "next month"],
    expectedEntities: ["Europe"],
    description: "Should find passport renewal with enhanced temporal scoring"
  },
  {
    id: "3/4",
    name: "Restaurant Preference vs Experience",
    query: "What kind of restaurants do I prefer?", 
    expectedKeywords: ["restaurants", "prefer", "hate", "waiting"],
    expectedEntities: [],
    description: "Should prioritize preference over experience (no entity contamination)"
  },
  {
    id: "4/4",
    name: "Current vs Previous Job",
    query: "Where do I currently work?",
    expectedKeywords: ["microsoft", "started", "last week"],
    expectedEntities: ["Microsoft"],
    description: "Should prioritize recent Microsoft job over old Google job"
  }
];

async function testGoalWithFixedScoring(goal) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎯 TESTING GOAL ${goal.id}: ${goal.name.toUpperCase()}`);
  console.log(`${'='.repeat(70)}`);
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  console.log(`Query: "${goal.query}"`);
  console.log(`Expected entities: [${goal.expectedEntities.join(', ')}]`);
  console.log(`Expected keywords: [${goal.expectedKeywords.join(', ')}]`);
  console.log(`Description: ${goal.description}\n`);
  
  try {
    // Test with enhanced search
    const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: goal.query,
      developmentUserId: developmentUserId,
      limit: 5,
      threshold: 0.1
    });
    
    if (!results || results.length === 0) {
      console.log("❌ No results returned from enhanced search");
      return {
        goalId: goal.id,
        success: false,
        reason: "No search results"
      };
    }
    
    console.log(`📊 Enhanced search returned ${results.length} results with FIXED SCORING:\n`);
    
    // Analyze all results with detailed scoring
    results.forEach((result, index) => {
      console.log(`--- RESULT ${index + 1} ---`);
      console.log(`Content: "${result.content}"`);
      console.log(`🧠 Semantic Score: ${result.searchScores?.semantic?.toFixed(3) || 'N/A'}`);
      console.log(`🏷️ Entity Score: ${result.searchScores?.entity?.toFixed(3) || 'N/A'} ${result.searchScores?.entity > 0 ? '✅ WORKING!' : '❌ Still 0'}`);
      console.log(`⏰ Temporal Score: ${result.searchScores?.temporal?.toFixed(3) || 'N/A'} ${result.searchScores?.temporal > 0 ? '✅ WORKING!' : '❌ Still 0'}`);
      console.log(`🔤 Keyword Score: ${result.searchScores?.keyword?.toFixed(3) || 'N/A'}`);
      console.log(`🎯 Final Score: ${result.finalScore?.toFixed(3) || 'N/A'}`);
      
      // Check if this matches expected result
      const matchesExpected = goal.expectedKeywords.some(keyword =>
        result.content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      console.log(`Expected Match: ${matchesExpected ? '✅ YES' : '❌ NO'}`);
      console.log();
    });
    
    // Analyze top result success
    const topResult = results[0];
    const isTopResultCorrect = goal.expectedKeywords.some(keyword =>
      topResult.content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    console.log("🔍 ANALYSIS:");
    console.log(`Goal ${goal.id} Success: ${isTopResultCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
    
    // Check scoring improvements
    const entityWorking = topResult.searchScores?.entity > 0;
    const temporalWorking = topResult.searchScores?.temporal > 0;
    
    console.log("🛠️ SCORING FIX STATUS:");
    console.log(`Entity scoring fixed: ${entityWorking ? '✅ YES (non-zero score)' : '❌ NO (still 0.000)'}`);
    console.log(`Temporal scoring fixed: ${temporalWorking ? '✅ YES (non-zero score)' : '❌ NO (still 0.000)'}`);
    
    if (isTopResultCorrect) {
      console.log(`🎉 SUCCESS: Goal ${goal.id} now working with enhanced scoring!`);
      if (entityWorking || temporalWorking) {
        console.log(`🔧 SCORING IMPROVEMENT: Multi-dimensional scoring now functional`);
      }
    } else {
      console.log(`❌ STILL FAILING: Goal ${goal.id} needs additional improvements`);
      console.log(`📊 Top result: "${topResult.content.substring(0, 80)}..."`);
      
      // Find expected result position
      const expectedResult = results.find(result =>
        goal.expectedKeywords.some(keyword =>
          result.content.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (expectedResult) {
        const position = results.indexOf(expectedResult) + 1;
        console.log(`📍 Expected result found at position ${position}`);
        console.log(`📈 Expected result final score: ${expectedResult.finalScore?.toFixed(3)}`);
        console.log(`📉 Score gap: ${(topResult.finalScore - expectedResult.finalScore).toFixed(3)}`);
      }
    }
    
    return {
      goalId: goal.id,
      success: isTopResultCorrect,
      entityWorking: entityWorking,
      temporalWorking: temporalWorking,
      topResult: topResult,
      scoringImproved: entityWorking || temporalWorking
    };
    
  } catch (error) {
    console.error(`❌ Goal ${goal.id} test failed:`, error.message);
    return {
      goalId: goal.id,
      success: false,
      reason: `Test failed: ${error.message}`
    };
  }
}

async function generateFixedScoringAnalysis(results) {
  console.log(`\n${'='.repeat(80)}`);
  console.log("📊 FIXED ENTITY/TEMPORAL SCORING ANALYSIS");
  console.log("=========================================");
  
  const successfulGoals = results.filter(r => r.success).length;
  const totalGoals = results.length;
  const successRate = (successfulGoals / totalGoals * 100).toFixed(1);
  
  const entityFixed = results.filter(r => r.entityWorking).length;
  const temporalFixed = results.filter(r => r.temporalWorking).length;
  const scoringImproved = results.filter(r => r.scoringImproved).length;
  
  console.log(`\n🎯 RESULTS WITH FIXED SCORING:`);
  console.log(`✅ Successful Goals: ${successfulGoals}/${totalGoals} (${successRate}%)`);
  console.log(`🏷️ Entity Scoring Working: ${entityFixed}/${totalGoals} goals`);
  console.log(`⏰ Temporal Scoring Working: ${temporalFixed}/${totalGoals} goals`);
  console.log(`🛠️ Overall Scoring Improved: ${scoringImproved}/${totalGoals} goals`);
  console.log();
  
  results.forEach(result => {
    const status = result.success ? '✅ SOLVED' : '❌ FAILED';
    const improvements = [];
    if (result.entityWorking) improvements.push('Entity✅');
    if (result.temporalWorking) improvements.push('Temporal✅');
    const improvementText = improvements.length > 0 ? ` (${improvements.join(', ')})` : ' (No scoring improvement)';
    
    console.log(`Goal ${result.goalId}: ${status}${improvementText}`);
  });
  
  console.log(`\n💡 ANALYSIS:`);
  
  if (parseFloat(successRate) === 100) {
    console.log(`🎉 PERFECT: 100% success rate achieved with fixed scoring!`);
    console.log(`✅ All 4 goals now working properly`);
    console.log(`🏆 Ready for complete 20 Q&A retest`);
  } else if (parseFloat(successRate) > 50) {
    console.log(`📈 IMPROVEMENT: ${successRate}% success rate`);
    console.log(`🔧 Entity/temporal fixes helping but may need additional enhancements`);
    
    const stillFailing = results.filter(r => !r.success);
    console.log(`\n🔍 REMAINING ISSUES:`);
    stillFailing.forEach(failed => {
      console.log(`- Goal ${failed.goalId}: ${failed.reason || 'Wrong result still winning'}`);
    });
  } else {
    console.log(`⚠️ LIMITED IMPROVEMENT: ${successRate}% success rate`);
    console.log(`🔧 May need query intent weighting or recency conflict resolution`);
  }
  
  console.log(`\n🛠️ SCORING SYSTEM STATUS:`);
  if (entityFixed > 0 || temporalFixed > 0) {
    console.log(`✅ Multi-dimensional scoring partially restored`);
    console.log(`🎯 Entity scoring now working in ${entityFixed} goals`);
    console.log(`⏰ Temporal scoring now working in ${temporalFixed} goals`);
  } else {
    console.log(`❌ Entity/temporal scoring still not working - additional debugging needed`);
  }
  
  return {
    successRate: parseFloat(successRate),
    successful: successfulGoals,
    total: totalGoals,
    entityFixed: entityFixed,
    temporalFixed: temporalFixed,
    readyFor100Test: parseFloat(successRate) >= 75
  };
}

// Execute comprehensive test across all 4 goals
console.log("🚀 Starting Fixed Entity/Temporal Scoring Test (All 4 Goals)...\n");

Promise.all(testGoals.map(goal => testGoalWithFixedScoring(goal)))
  .then(async (results) => {
    const analysis = await generateFixedScoringAnalysis(results);
    
    console.log(`\n✅ Fixed Scoring Test Complete`);
    console.log(`📊 Final Result: ${analysis.successRate}% success rate`);
    console.log(`🛠️ Entity/Temporal Scoring: ${analysis.entityFixed + analysis.temporalFixed} improvements`);
    
    if (analysis.readyFor100Test) {
      console.log(`\n🎯 READY: Proceed to query intent weighting and recency enhancements`);
    } else {
      console.log(`\n🔧 ADDITIONAL WORK NEEDED: Debug remaining scoring issues first`);
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Fixed Scoring Test Failed:", error);
    process.exit(1);
  });