/**
 * Voyage API Connection Test
 * Tests Voyage embedding API connectivity and functionality
 */

require('dotenv').config({ path: '.env.local' });
const { VoyageAIClient } = require('voyageai');

async function testVoyageConnection() {
  console.log("🔍 TESTING VOYAGE AI CONNECTION");
  console.log("================================");
  
  // Check environment variables
  const apiKey = process.env.VOYAGE_API_KEY;
  console.log(`🔑 API Key configured: ${apiKey ? '✅ YES' : '❌ NO'}`);
  console.log(`🔑 API Key length: ${apiKey ? apiKey.length : 0}`);
  console.log(`🔑 API Key prefix: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);
  
  if (!apiKey) {
    console.error("❌ VOYAGE_API_KEY not found in environment");
    return false;
  }
  
  // Initialize Voyage client
  console.log("\n🚀 Initializing Voyage client...");
  const voyage = new VoyageAIClient({
    apiKey: apiKey,
  });
  
  // Test simple embedding
  console.log("📝 Testing simple embedding generation...");
  try {
    const response = await voyage.embed({
      input: ["Hello world, this is a test"],
      model: 'voyage-3.5-lite',
      inputType: 'document',
    });
    
    console.log("✅ Voyage API Response Success!");
    console.log(`📊 Embedding length: ${response.data?.[0]?.embedding?.length || 0}`);
    console.log(`📊 Total tokens: ${response.usage?.totalTokens || 0}`);
    console.log(`📊 Model: voyage-3.5-lite`);
    console.log(`📊 Input type: document`);
    
    return true;
    
  } catch (error) {
    console.error("❌ Voyage API Error:", error.message);
    console.error("❌ Error details:", error);
    return false;
  }
}

async function testVoyageBatch() {
  console.log("\n🔄 Testing batch embedding generation...");
  
  const apiKey = process.env.VOYAGE_API_KEY;
  const voyage = new VoyageAIClient({ apiKey });
  
  try {
    const testTexts = [
      "My birthday is December 29th",
      "I work at Google as a software engineer", 
      "Had dinner at Nobu last night"
    ];
    
    const response = await voyage.embed({
      input: testTexts,
      model: 'voyage-3.5-lite',
      inputType: 'document',
    });
    
    console.log("✅ Batch embedding success!");
    console.log(`📊 Embeddings generated: ${response.data?.length || 0}`);
    console.log(`📊 Total tokens: ${response.usage?.totalTokens || 0}`);
    
    // Validate embeddings
    response.data?.forEach((item, index) => {
      console.log(`   Text ${index + 1}: ${item.embedding?.length || 0} dimensions`);
    });
    
    return true;
    
  } catch (error) {
    console.error("❌ Batch embedding failed:", error.message);
    return false;
  }
}

async function testVoyageQuery() {
  console.log("\n🔍 Testing query embedding generation...");
  
  const apiKey = process.env.VOYAGE_API_KEY;
  const voyage = new VoyageAIClient({ apiKey });
  
  try {
    const response = await voyage.embed({
      input: ["search for memories about work"],
      model: 'voyage-3.5-lite',
      inputType: 'query', // Different input type for search queries
    });
    
    console.log("✅ Query embedding success!");
    console.log(`📊 Embedding length: ${response.data?.[0]?.embedding?.length || 0}`);
    console.log(`📊 Total tokens: ${response.usage?.totalTokens || 0}`);
    
    return true;
    
  } catch (error) {
    console.error("❌ Query embedding failed:", error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Voyage AI Connection Tests...\n");
  
  let allPassed = true;
  
  // Test 1: Basic connection
  const test1 = await testVoyageConnection();
  allPassed = allPassed && test1;
  
  // Test 2: Batch processing (if test 1 passed)
  if (test1) {
    const test2 = await testVoyageBatch();
    allPassed = allPassed && test2;
    
    // Test 3: Query embeddings (if test 2 passed)
    if (test2) {
      const test3 = await testVoyageQuery();
      allPassed = allPassed && test3;
    }
  }
  
  // Summary
  console.log("\n🎯 VOYAGE API TEST SUMMARY");
  console.log("==========================");
  
  if (allPassed) {
    console.log("✅ ALL TESTS PASSED!");
    console.log("✅ Voyage API is working correctly");
    console.log("✅ Ready to run 20-question memory test");
  } else {
    console.log("❌ Some tests failed");
    console.log("❌ Check API key and network connectivity");
    console.log("❌ Memory test will fail until this is resolved");
  }
  
  return allPassed;
}

// Execute tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("💥 Test execution failed:", error);
    process.exit(1);
  });