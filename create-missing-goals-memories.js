/**
 * Create Missing Memories for Goals 2/4 and 3/4
 * Complete the test data set to enable proper disambiguation testing
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function createPassportRenewalMemory() {
  console.log("🎯 CREATING PASSPORT RENEWAL MEMORY (GOAL 2/4)");
  console.log("==============================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const passportContent = "Need to renew my passport next month before the Europe trip";
  
  console.log(`📝 Creating: "${passportContent}"`);
  console.log(`👤 User: ${developmentUserId}`);
  console.log(`📅 Context: personal (travel planning)\n`);
  
  try {
    // Generate embedding
    console.log("📊 Generating embedding...");
    const embeddingResult = await convex.action("embeddings:generateEmbedding", {
      text: passportContent,
    });
    
    console.log(`✅ Embedding generated: ${embeddingResult.embedding.length} dimensions`);
    
    // Create memory using development-only insertion
    console.log("💾 Inserting passport memory...");
    const memoryId = await convex.mutation("memory:storeMemoryForDevelopment", {
      developmentUserId: developmentUserId,
      content: passportContent,
      sourceType: 'test-data',
      sourceId: 'passport-renewal-goal2-' + Date.now(),
      context: 'personal',
      embedding: embeddingResult.embedding,
      summary: passportContent,
      memoryType: 'experience',
      importance: 8,
      entities: ['Europe'],
      keywords: ['passport', 'renew', 'europe', 'trip', 'next month'],
      sentiment: 0,
    });
    
    console.log(`✅ Passport memory created successfully!`);
    console.log(`📄 Memory ID: ${memoryId}`);
    
    return {
      success: true,
      memoryId: memoryId,
      content: passportContent
    };
    
  } catch (error) {
    console.error("❌ Passport memory creation failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function createRestaurantPreferenceMemory() {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 CREATING RESTAURANT PREFERENCE MEMORY (GOAL 3/4)");
  console.log("==================================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const preferenceContent = "I hate waiting at restaurants, prefer places with quick service or reservations";
  
  console.log(`📝 Creating: "${preferenceContent}"`);
  console.log(`👤 User: ${developmentUserId}`);
  console.log(`📅 Context: personal (dining preferences)\n`);
  
  try {
    // Generate embedding
    console.log("📊 Generating embedding...");
    const embeddingResult = await convex.action("embeddings:generateEmbedding", {
      text: preferenceContent,
    });
    
    console.log(`✅ Embedding generated: ${embeddingResult.embedding.length} dimensions`);
    
    // Create memory using development-only insertion
    console.log("💾 Inserting restaurant preference memory...");
    const memoryId = await convex.mutation("memory:storeMemoryForDevelopment", {
      developmentUserId: developmentUserId,
      content: preferenceContent,
      sourceType: 'test-data',
      sourceId: 'restaurant-preference-goal3-' + Date.now(),
      context: 'personal',
      embedding: embeddingResult.embedding,
      summary: preferenceContent,
      memoryType: 'preference',
      importance: 7,
      entities: [],
      keywords: ['restaurants', 'hate', 'waiting', 'prefer', 'quick service', 'reservations'],
      sentiment: -0.3,
    });
    
    console.log(`✅ Restaurant preference memory created successfully!`);
    console.log(`📄 Memory ID: ${memoryId}`);
    
    return {
      success: true,
      memoryId: memoryId,
      content: preferenceContent
    };
    
  } catch (error) {
    console.error("❌ Restaurant preference memory creation failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function verifyCreatedMemories(passportResult, preferenceResult) {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 VERIFICATION: Checking created memories");
  console.log("=========================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    // Check for passport memory
    const passportMemory = memories.find(memory => 
      memory.content.toLowerCase().includes('passport') &&
      memory.content.toLowerCase().includes('europe')
    );
    
    // Check for restaurant preference memory
    const preferenceMemory = memories.find(memory =>
      memory.content.toLowerCase().includes('hate waiting at restaurants') ||
      memory.content.toLowerCase().includes('quick service')
    );
    
    console.log("🎯 VERIFICATION RESULTS:");
    console.log(`Passport renewal memory: ${passportMemory ? '✅ EXISTS' : '❌ MISSING'}`);
    if (passportMemory) {
      console.log(`   Content: "${passportMemory.content}"`);
      console.log(`   Created: ${new Date(passportMemory.createdAt).toLocaleString()}`);
    }
    
    console.log(`Restaurant preference memory: ${preferenceMemory ? '✅ EXISTS' : '❌ MISSING'}`);
    if (preferenceMemory) {
      console.log(`   Content: "${preferenceMemory.content}"`);
      console.log(`   Created: ${new Date(preferenceMemory.createdAt).toLocaleString()}`);
    }
    
    const bothCreated = passportMemory && preferenceMemory;
    
    if (bothCreated) {
      console.log("\n🎉 SUCCESS: Both missing memories now exist!");
      console.log("✅ Goals 2/4 and 3/4 now have complete test data");
      console.log("✅ Ready to test semantic intelligence across all 4 goals");
    } else {
      console.log("\n⚠️ Some memories are still missing");
    }
    
    return {
      passportExists: !!passportMemory,
      preferenceExists: !!preferenceMemory,
      bothCreated: bothCreated,
      totalMemories: memories.length
    };
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    return null;
  }
}

async function testQuickSemanticScores() {
  console.log("\n" + "=".repeat(70));
  console.log("🧠 QUICK SEMANTIC SCORE TEST");
  console.log("============================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  const testQueries = [
    {
      goal: "2/4",
      query: "When do I need to renew my passport?",
      expected: "passport renewal",
      wrongWinner: "dentist"
    },
    {
      goal: "3/4", 
      query: "What kind of restaurants do I prefer?",
      expected: "restaurant preference",
      wrongWinner: "dining experience"
    }
  ];
  
  console.log("🔍 Testing semantic scores for newly created memories...\n");
  
  for (const test of testQueries) {
    console.log(`--- GOAL ${test.goal}: ${test.query} ---`);
    
    try {
      const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
        query: test.query,
        developmentUserId: developmentUserId,
        limit: 3,
        threshold: 0.1
      });
      
      if (results && results.length > 0) {
        const topResult = results[0];
        console.log(`Top result: "${topResult.content.substring(0, 60)}..."`);
        console.log(`Semantic score: ${topResult.searchScores?.semantic?.toFixed(3)}`);
        console.log(`Final score: ${topResult.finalScore?.toFixed(3)}`);
        
        const isCorrect = test.goal === "2/4" ? 
          topResult.content.toLowerCase().includes('passport') :
          topResult.content.toLowerCase().includes('hate waiting');
          
        console.log(`Result type: ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
      } else {
        console.log("❌ No results returned");
      }
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
    
    console.log();
  }
}

// Execute the complete memory creation sequence
console.log("🚀 Starting Missing Memory Creation Process...\n");

Promise.all([
  createPassportRenewalMemory(),
  createRestaurantPreferenceMemory()
]).then(async ([passportResult, preferenceResult]) => {
  
  console.log("\n" + "=".repeat(70));
  console.log("📊 CREATION SUMMARY");
  console.log("==================");
  
  const passportSuccess = passportResult.success;
  const preferenceSuccess = preferenceResult.success;
  
  console.log(`Passport memory: ${passportSuccess ? '✅ CREATED' : '❌ FAILED'}`);
  console.log(`Restaurant preference memory: ${preferenceSuccess ? '✅ CREATED' : '❌ FAILED'}`);
  
  if (passportSuccess && preferenceSuccess) {
    console.log("\n🎉 Both memories created successfully!");
    
    // Verify they exist in database
    await verifyCreatedMemories(passportResult, preferenceResult);
    
    // Quick semantic score test
    await testQuickSemanticScores();
    
    console.log("\n💡 NEXT STEPS:");
    console.log("1. Run complete 4-goal analysis with all test data");
    console.log("2. Test pure semantic scoring effectiveness");
    console.log("3. Compare semantic vs multi-dimensional results");
    
  } else {
    console.log("\n❌ Some memory creation failed:");
    if (!passportSuccess) {
      console.log(`   Passport error: ${passportResult.error}`);
    }
    if (!preferenceSuccess) {
      console.log(`   Preference error: ${preferenceResult.error}`);
    }
  }
  
  console.log("\n✅ Memory Creation Process Complete");
  process.exit(0);
  
}).catch(error => {
  console.error("❌ Memory Creation Process Failed:", error);
  process.exit(1);
});