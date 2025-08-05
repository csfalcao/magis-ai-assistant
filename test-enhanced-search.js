/**
 * Quick Enhanced Memory Search Validation
 * Tests the new multi-dimensional search system
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

// Test queries
const testQueries = [
  {
    query: "When is my birthday?",
    expected: "December 29th",
    category: "BASIC_RETRIEVAL"
  },
  {
    query: "Who is my dentist?", 
    expected: "Dr. Mary Johnson",
    category: "BASIC_RETRIEVAL"
  },
  {
    query: "Do I have a healthcare provider?",
    expected: "Dr. Mary Johnson",
    category: "SEMANTIC_SEARCH"
  },
  {
    query: "When was my last dental visit?",
    expected: "over a year ago",
    category: "CROSS_CONTEXT"
  },
  {
    query: "Where do I currently work?",
    expected: "Microsoft",
    category: "COMPLEX_REASONING"  
  }
];

async function testEnhancedSearch() {
  console.log("🚀 Enhanced Memory Search Validation");
  console.log("====================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  let results = [];
  
  for (const test of testQueries) {
    console.log(`\n🔹 Testing: "${test.query}"`);
    console.log(`📝 Category: ${test.category}`);
    console.log(`🎯 Expected: ${test.expected}`);
    
    try {
      const searchResults = await convex.action("memory:enhancedMemorySearchForDevelopment", {
        query: test.query,
        developmentUserId: developmentUserId,
        limit: 3,
        threshold: 0.1
      });
      
      console.log(`✅ Found ${searchResults.length} results`);
      
      if (searchResults.length > 0) {
        const topResult = searchResults[0];
        console.log(`📊 Top Result Score Breakdown:`);
        console.log(`   Semantic: ${topResult.searchScores?.semantic?.toFixed(3) || 'N/A'}`);
        console.log(`   Entity: ${topResult.searchScores?.entity?.toFixed(3) || 'N/A'}`);
        console.log(`   Temporal: ${topResult.searchScores?.temporal?.toFixed(3) || 'N/A'}`);
        console.log(`   Keyword: ${topResult.searchScores?.keyword?.toFixed(3) || 'N/A'}`);
        console.log(`   Final Score: ${topResult.finalScore?.toFixed(3) || 'N/A'}`);
        console.log(`💬 Content: "${topResult.content.substring(0, 60)}..."`);
        
        // Check if result contains expected information
        const contains = topResult.content.toLowerCase().includes(test.expected.toLowerCase());
        console.log(`🎯 Contains Expected: ${contains ? '✅' : '❌'}`);
        
        results.push({
          query: test.query,
          category: test.category,
          found: searchResults.length > 0,
          relevant: contains,
          scores: topResult.searchScores,
          finalScore: topResult.finalScore
        });
      } else {
        console.log("❌ No results found");
        results.push({
          query: test.query,
          category: test.category,
          found: false,
          relevant: false,
          scores: null,
          finalScore: 0
        });
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({
        query: test.query,
        category: test.category,
        error: error.message,
        found: false,
        relevant: false
      });
    }
  }
  
  // Summary
  console.log("\n🎯 ENHANCED SEARCH VALIDATION SUMMARY");
  console.log("=====================================");
  
  const foundResults = results.filter(r => r.found).length;
  const relevantResults = results.filter(r => r.relevant).length;
  const avgScore = results.filter(r => r.finalScore > 0).reduce((sum, r) => sum + r.finalScore, 0) / results.filter(r => r.finalScore > 0).length;
  
  console.log(`📊 Results Found: ${foundResults}/${testQueries.length} (${Math.round(foundResults/testQueries.length*100)}%)`);
  console.log(`🎯 Relevant Results: ${relevantResults}/${testQueries.length} (${Math.round(relevantResults/testQueries.length*100)}%)`);
  console.log(`📈 Average Score: ${avgScore?.toFixed(3) || 'N/A'}`);
  
  // Category breakdown
  console.log("\n📋 Category Breakdown:");
  const categories = [...new Set(results.map(r => r.category))];
  categories.forEach(cat => {
    const categoryResults = results.filter(r => r.category === cat);
    const categoryRelevant = categoryResults.filter(r => r.relevant).length;
    console.log(`   ${cat}: ${categoryRelevant}/${categoryResults.length} (${Math.round(categoryRelevant/categoryResults.length*100)}%)`);
  });
  
  // Multi-dimensional analysis
  console.log("\n🧠 Multi-Dimensional Score Analysis:");
  const validScores = results.filter(r => r.scores);
  if (validScores.length > 0) {
    const avgSemantic = validScores.reduce((sum, r) => sum + (r.scores.semantic || 0), 0) / validScores.length;
    const avgEntity = validScores.reduce((sum, r) => sum + (r.scores.entity || 0), 0) / validScores.length;
    const avgTemporal = validScores.reduce((sum, r) => sum + (r.scores.temporal || 0), 0) / validScores.length;
    const avgKeyword = validScores.reduce((sum, r) => sum + (r.scores.keyword || 0), 0) / validScores.length;
    
    console.log(`   Semantic Average: ${avgSemantic.toFixed(3)}`);
    console.log(`   Entity Average: ${avgEntity.toFixed(3)}`);
    console.log(`   Temporal Average: ${avgTemporal.toFixed(3)}`);
    console.log(`   Keyword Average: ${avgKeyword.toFixed(3)}`);
  }
  
  // Final assessment
  if (relevantResults >= testQueries.length * 0.6) { // 60% threshold
    console.log("\n🎉 ENHANCED SEARCH: VALIDATION SUCCESSFUL!");
    console.log("✅ Multi-dimensional retrieval system operational");
    console.log("✅ Semantic + Entity + Temporal + Keyword fusion working");
    console.log("✅ Ready for full 20-question validation");
  } else {
    console.log("\n⚠️ Enhanced search needs optimization");
    console.log(`Current success rate: ${Math.round(relevantResults/testQueries.length*100)}%`);
    console.log("Target: 60%+ for validation");
  }
}

// Execute test
testEnhancedSearch()
  .then(() => {
    console.log("\n✅ Enhanced Search Validation Complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Enhanced Search Validation Failed:", error);
    process.exit(1);
  });