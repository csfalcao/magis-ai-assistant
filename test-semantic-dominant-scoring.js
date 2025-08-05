/**
 * Test Semantic-Dominant Scoring (60/20/15/5)
 * Validate the new weights across all 4 failing goals
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

const testGoals = [
  {
    id: "1/4",
    name: "Sarah Meeting Disambiguation",
    query: "When is my meeting with Sarah?",
    expectedContent: "Meeting with Sarah next Friday at 2pm downtown to discuss the wedding plans",
    wrongWinnerContent: "Had dinner with my friend Sarah at Luigi's restaurant downtown last night",
    description: "Should prioritize meeting over dinner"
  },
  {
    id: "2/4", 
    name: "Passport Renewal Memory",
    query: "When do I need to renew my passport?",
    expectedContent: "Need to renew my passport next month before the Europe trip",
    wrongWinnerContent: "dentist|birthday", // Could be various wrong results
    description: "Should find passport renewal memory"
  },
  {
    id: "3/4",
    name: "Restaurant Preference",
    query: "What kind of restaurants do I prefer?", 
    expectedContent: "I hate waiting at restaurants, prefer places with quick service or reservations",
    wrongWinnerContent: "Had an amazing sushi dinner at Nobu last night with incredible yellowtail",
    description: "Should prioritize preference over dining experience"
  },
  {
    id: "4/4",
    name: "Current Job Memory",
    query: "Where do I currently work?",
    expectedContent: "Started working at Microsoft last week in the Azure team", 
    wrongWinnerContent: "I work at Google as a software engineer in the Cloud division",
    description: "Should prioritize recent job over old job"
  }
];

async function testGoal(goal) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎯 TESTING GOAL ${goal.id}: ${goal.name.toUpperCase()}`);
  console.log(`${'='.repeat(70)}`);
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  console.log(`Query: "${goal.query}"`);
  console.log(`Expected: "${goal.expectedContent}"`);
  console.log(`Description: ${goal.description}\n`);
  
  try {
    // Test with new semantic-dominant scoring
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
        reason: "No search results",
        topResult: null
      };
    }
    
    console.log(`📊 Enhanced search returned ${results.length} results with NEW WEIGHTS (60/20/15/5):\n`);
    
    // Display all results with detailed scoring
    results.forEach((result, index) => {
      console.log(`--- RESULT ${index + 1} ---`);
      console.log(`Content: "${result.content}"`);
      console.log(`Semantic Score: ${result.searchScores?.semantic?.toFixed(3) || 'N/A'}`);
      console.log(`Entity Score: ${result.searchScores?.entity?.toFixed(3) || 'N/A'}`);
      console.log(`Temporal Score: ${result.searchScores?.temporal?.toFixed(3) || 'N/A'}`);
      console.log(`Keyword Score: ${result.searchScores?.keyword?.toFixed(3) || 'N/A'}`);
      console.log(`Final Score: ${result.finalScore?.toFixed(3) || 'N/A'}`);
      
      // Classify result type
      const isExpected = result.content.toLowerCase().includes(
        goal.expectedContent.toLowerCase().substring(0, 20)
      );
      const isWrongWinner = goal.wrongWinnerContent.split('|').some(wrongContent =>
        result.content.toLowerCase().includes(wrongContent.toLowerCase())
      );
      
      console.log(`Type: ${isExpected ? '✅ EXPECTED' : isWrongWinner ? '❌ WRONG WINNER' : '❓ OTHER'}`);
      console.log();
    });
    
    // Analyze top result
    const topResult = results[0];
    const isTopResultCorrect = topResult.content.toLowerCase().includes(
      goal.expectedContent.toLowerCase().substring(0, 20)
    );
    
    console.log("🔍 ANALYSIS:");
    console.log(`Goal ${goal.id} Success: ${isTopResultCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
    
    if (isTopResultCorrect) {
      console.log(`🎉 SUCCESS: Semantic-dominant scoring solved Goal ${goal.id}!`);
      console.log(`✅ Top result matches expected content`);
      console.log(`📈 Final score: ${topResult.finalScore?.toFixed(3)}`);
    } else {
      console.log(`❌ FAILURE: Wrong result still wins for Goal ${goal.id}`);
      console.log(`📊 Top result: "${topResult.content.substring(0, 80)}..."`);
      console.log(`📈 Top result score: ${topResult.finalScore?.toFixed(3)}`);
      
      // Find expected result in the list
      const expectedResult = results.find(result =>
        result.content.toLowerCase().includes(
          goal.expectedContent.toLowerCase().substring(0, 20)
        )
      );
      
      if (expectedResult) {
        const position = results.indexOf(expectedResult) + 1;
        console.log(`📍 Expected result found at position ${position}`);
        console.log(`📈 Expected result score: ${expectedResult.finalScore?.toFixed(3)}`);
        console.log(`📉 Score gap: ${(topResult.finalScore - expectedResult.finalScore).toFixed(3)}`);
        
        console.log(`\n🔍 SCORE COMPARISON:`);
        console.log(`Wrong winner - Semantic: ${topResult.searchScores?.semantic?.toFixed(3)}, Final: ${topResult.finalScore?.toFixed(3)}`);
        console.log(`Expected    - Semantic: ${expectedResult.searchScores?.semantic?.toFixed(3)}, Final: ${expectedResult.finalScore?.toFixed(3)}`);
      } else {
        console.log(`❌ Expected result not found in top 5 results`);
      }
    }
    
    return {
      goalId: goal.id,
      success: isTopResultCorrect,
      reason: isTopResultCorrect ? "Correct result is top result" : "Wrong result is top result",
      topResult: topResult,
      expectedFound: !!results.find(r => 
        r.content.toLowerCase().includes(goal.expectedContent.toLowerCase().substring(0, 20))
      )
    };
    
  } catch (error) {
    console.error(`❌ Goal ${goal.id} test failed:`, error.message);
    return {
      goalId: goal.id,
      success: false,
      reason: `Test failed: ${error.message}`,
      topResult: null
    };
  }
}

async function generateFinalAnalysis(results) {
  console.log(`\n${'='.repeat(80)}`);
  console.log("📊 SEMANTIC-DOMINANT SCORING FINAL ANALYSIS");
  console.log("===========================================");
  
  const successfulGoals = results.filter(r => r.success).length;
  const totalGoals = results.length;
  const successRate = (successfulGoals / totalGoals * 100).toFixed(1);
  
  console.log(`\n🎯 OVERALL RESULTS:`);
  console.log(`✅ Successful Goals: ${successfulGoals}/${totalGoals}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log();
  
  results.forEach(result => {
    console.log(`Goal ${result.goalId}: ${result.success ? '✅ SOLVED' : '❌ FAILED'} - ${result.reason}`);
  });
  
  console.log(`\n💡 ANALYSIS:`);
  
  if (parseFloat(successRate) >= 90) {
    console.log(`🎉 EXCELLENT: ${successRate}% success rate meets beta requirements (90%+)`);
    console.log(`✅ Semantic-dominant scoring (60/20/15/5) is ready for production`);
    console.log(`✅ The semantic intelligence optimization is working!`);
  } else if (parseFloat(successRate) >= 75) {
    console.log(`📈 GOOD PROGRESS: ${successRate}% success rate is better than before`);
    console.log(`🔍 May need additional fine-tuning for remaining failures`);
    
    const failedGoals = results.filter(r => !r.success);
    console.log(`\n🔍 FAILED GOALS ANALYSIS:`);
    failedGoals.forEach(failed => {
      console.log(`- Goal ${failed.goalId}: ${failed.reason}`);
    });
  } else {
    console.log(`⚠️ NEEDS IMPROVEMENT: ${successRate}% success rate is below expectations`);
    console.log(`🔍 Further scoring optimization may be needed`);
  }
  
  console.log(`\n📋 COMPARISON TO PREVIOUS WEIGHTS:`);
  console.log(`- Previous (40/30/20/10): 80% success rate`);
  console.log(`- Current (60/20/15/5): ${successRate}% success rate`);
  console.log(`- Change: ${parseFloat(successRate) >= 80 ? '+' : ''}${(parseFloat(successRate) - 80).toFixed(1)}%`);
  
  return {
    successRate: parseFloat(successRate),
    successful: successfulGoals,
    total: totalGoals,
    meetsRequirements: parseFloat(successRate) >= 90
  };
}

// Execute comprehensive test across all 4 goals
console.log("🚀 Starting Semantic-Dominant Scoring Test (60/20/15/5)...\n");

Promise.all(testGoals.map(goal => testGoal(goal)))
  .then(async (results) => {
    const analysis = await generateFinalAnalysis(results);
    
    console.log(`\n✅ Semantic-Dominant Scoring Test Complete`);
    console.log(`📊 Final Result: ${analysis.successRate}% success rate`);
    
    if (analysis.meetsRequirements) {
      console.log(`\n🎉 READY FOR BETA: Requirements met!`);
    } else {
      console.log(`\n⚠️ ADDITIONAL WORK NEEDED: Below 90% requirement`);
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Semantic-Dominant Scoring Test Failed:", error);
    process.exit(1);
  });