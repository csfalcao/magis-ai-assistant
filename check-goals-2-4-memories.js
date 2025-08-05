/**
 * Check Goals 2-4 Memory Existence and Semantic Scores
 * Verify if correct memories exist and analyze their semantic scores vs wrong winners
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function checkGoal2PassportMemory() {
  console.log("🎯 GOAL 2/4: PASSPORT RENEWAL MEMORY CHECK");
  console.log("==========================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const query = "When do I need to renew my passport?";
  
  console.log(`Query: "${query}"`);
  console.log("Expected: 'Need to renew my passport next month before the Europe trip'");
  console.log("Current wrong winner: Dentist memory (semantic: 0.398)\n");
  
  try {
    // Get all memories and search for passport-related ones
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const passportMemories = memories.filter(memory =>
      memory.content.toLowerCase().includes('passport') ||
      memory.content.toLowerCase().includes('renew') ||
      memory.content.toLowerCase().includes('europe')
    );
    
    console.log(`📊 Found ${passportMemories.length} passport-related memories:`);
    passportMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
    });
    
    // Test the query with enhanced search
    console.log("\n🔍 Testing enhanced search for passport query...");
    const searchResults = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: query,
      developmentUserId: developmentUserId,
      limit: 5,
      threshold: 0.1
    });
    
    if (searchResults && searchResults.length > 0) {
      console.log(`\n📊 Enhanced search returned ${searchResults.length} results:`);
      
      searchResults.forEach((result, index) => {
        console.log(`\n--- RESULT ${index + 1} ---`);
        console.log(`Content: "${result.content}"`);
        console.log(`Semantic Score: ${result.searchScores?.semantic?.toFixed(3) || 'N/A'}`);
        console.log(`Final Score: ${result.finalScore?.toFixed(3) || 'N/A'}`);
        
        const isPassportRelated = result.content.toLowerCase().includes('passport') ||
                                 result.content.toLowerCase().includes('europe');
        const isDentistRelated = result.content.toLowerCase().includes('dentist');
        
        console.log(`Type: ${isPassportRelated ? '🛂 PASSPORT' : isDentistRelated ? '🦷 DENTIST' : '❓ OTHER'}`);
      });
      
      // Find passport memory in results
      const passportResult = searchResults.find(result =>
        result.content.toLowerCase().includes('passport') ||
        result.content.toLowerCase().includes('europe')
      );
      
      const dentistResult = searchResults.find(result =>
        result.content.toLowerCase().includes('dentist')
      );
      
      console.log("\n🔍 SEMANTIC SCORE ANALYSIS:");
      if (passportResult && dentistResult) {
        console.log(`Passport memory semantic: ${passportResult.searchScores?.semantic?.toFixed(3)}`);
        console.log(`Dentist memory semantic: ${dentistResult.searchScores?.semantic?.toFixed(3)}`);
        
        if (passportResult.searchScores?.semantic > dentistResult.searchScores?.semantic) {
          console.log("✅ SEMANTIC INTELLIGENCE: Passport memory has higher semantic score");
          console.log("❌ MULTI-DIMENSIONAL PROBLEM: Other scores are overriding semantic intelligence");
        } else {
          console.log("❌ SEMANTIC PROBLEM: Dentist memory has higher semantic score");
        }
      } else if (!passportResult) {
        console.log("❌ DATA PROBLEM: No passport memory found in database");
      }
    }
    
    return {
      passportMemoriesFound: passportMemories.length,
      searchResults: searchResults,
      hasPassportMemory: passportMemories.length > 0
    };
    
  } catch (error) {
    console.error("❌ Goal 2/4 check failed:", error.message);
    return null;
  }
}

async function checkGoal3RestaurantMemory() {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 GOAL 3/4: RESTAURANT PREFERENCE MEMORY CHECK");
  console.log("===============================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const query = "What kind of restaurants do I prefer?";
  
  console.log(`Query: "${query}"`);
  console.log("Expected: 'I hate waiting at restaurants, prefer places with quick service or reservations'");
  console.log("Current wrong winner: Nobu experience (semantic: 0.531)\n");
  
  try {
    // Get all memories and search for restaurant preference ones
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const restaurantMemories = memories.filter(memory =>
      memory.content.toLowerCase().includes('restaurant') ||
      memory.content.toLowerCase().includes('prefer') ||
      memory.content.toLowerCase().includes('quick service') ||
      memory.content.toLowerCase().includes('reservation')
    );
    
    console.log(`📊 Found ${restaurantMemories.length} restaurant-related memories:`);
    restaurantMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
      
      const isPreference = memory.content.toLowerCase().includes('prefer') ||
                          memory.content.toLowerCase().includes('hate') ||
                          memory.content.toLowerCase().includes('quick service');
      const isExperience = memory.content.toLowerCase().includes('had') ||
                          memory.content.toLowerCase().includes('went') ||
                          memory.content.toLowerCase().includes('dinner');
      
      console.log(`   Type: ${isPreference ? '⚙️ PREFERENCE' : isExperience ? '📝 EXPERIENCE' : '❓ OTHER'}`);
    });
    
    // Test the query with enhanced search
    console.log("\n🔍 Testing enhanced search for restaurant preference query...");
    const searchResults = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: query,
      developmentUserId: developmentUserId,
      limit: 5,
      threshold: 0.1
    });
    
    if (searchResults && searchResults.length > 0) {
      console.log(`\n📊 Enhanced search returned ${searchResults.length} results:`);
      
      searchResults.forEach((result, index) => {
        console.log(`\n--- RESULT ${index + 1} ---`);
        console.log(`Content: "${result.content}"`);
        console.log(`Semantic Score: ${result.searchScores?.semantic?.toFixed(3) || 'N/A'}`);
        console.log(`Final Score: ${result.finalScore?.toFixed(3) || 'N/A'}`);
        
        const isPreference = result.content.toLowerCase().includes('prefer') ||
                            result.content.toLowerCase().includes('hate') ||
                            result.content.toLowerCase().includes('quick service');
        const isExperience = result.content.toLowerCase().includes('nobu') ||
                            result.content.toLowerCase().includes('dinner');
        
        console.log(`Type: ${isPreference ? '⚙️ PREFERENCE' : isExperience ? '📝 EXPERIENCE' : '❓ OTHER'}`);
      });
      
      // Analyze preference vs experience semantic scores
      const preferenceResult = searchResults.find(result =>
        result.content.toLowerCase().includes('prefer') ||
        result.content.toLowerCase().includes('quick service')
      );
      
      const experienceResult = searchResults.find(result =>
        result.content.toLowerCase().includes('nobu') ||
        result.content.toLowerCase().includes('amazing')
      );
      
      console.log("\n🔍 SEMANTIC SCORE ANALYSIS:");
      if (preferenceResult && experienceResult) {
        console.log(`Preference memory semantic: ${preferenceResult.searchScores?.semantic?.toFixed(3)}`);
        console.log(`Experience memory semantic: ${experienceResult.searchScores?.semantic?.toFixed(3)}`);
        
        if (preferenceResult.searchScores?.semantic > experienceResult.searchScores?.semantic) {
          console.log("✅ SEMANTIC INTELLIGENCE: Preference memory has higher semantic score");
          console.log("❌ MULTI-DIMENSIONAL PROBLEM: Other scores are overriding semantic intelligence");
        } else {
          console.log("❌ SEMANTIC PROBLEM: Experience memory has higher semantic score for preference query");
        }
      } else if (!preferenceResult) {
        console.log("❌ DATA PROBLEM: No restaurant preference memory found in database");
      }
    }
    
    return {
      restaurantMemoriesFound: restaurantMemories.length,
      searchResults: searchResults,
      hasPreferenceMemory: restaurantMemories.some(m => 
        m.content.toLowerCase().includes('prefer') || 
        m.content.toLowerCase().includes('quick service')
      )
    };
    
  } catch (error) {
    console.error("❌ Goal 3/4 check failed:", error.message);
    return null;
  }
}

async function checkGoal4JobMemory() {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 GOAL 4/4: MICROSOFT JOB MEMORY CHECK");
  console.log("======================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  const query = "Where do I currently work?";
  
  console.log(`Query: "${query}"`);
  console.log("Expected: 'Started working at Microsoft last week in the Azure team'");
  console.log("Current wrong winner: Google memory (semantic: 0.579)\n");
  
  try {
    // Get all memories and search for job-related ones
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const jobMemories = memories.filter(memory =>
      memory.content.toLowerCase().includes('work') ||
      memory.content.toLowerCase().includes('job') ||
      memory.content.toLowerCase().includes('microsoft') ||
      memory.content.toLowerCase().includes('google') ||
      memory.content.toLowerCase().includes('azure')
    );
    
    console.log(`📊 Found ${jobMemories.length} job-related memories:`);
    jobMemories.forEach((memory, index) => {
      console.log(`${index + 1}. "${memory.content}"`);
      console.log(`   Created: ${new Date(memory.createdAt).toLocaleString()}`);
      
      const isMicrosoft = memory.content.toLowerCase().includes('microsoft');
      const isGoogle = memory.content.toLowerCase().includes('google');
      const isRecent = memory.content.toLowerCase().includes('started') ||
                      memory.content.toLowerCase().includes('last week');
      
      console.log(`   Company: ${isMicrosoft ? '🟦 MICROSOFT' : isGoogle ? '🔍 GOOGLE' : '❓ OTHER'}`);
      console.log(`   Recent: ${isRecent ? '✅ YES' : '❌ NO'}`);
    });
    
    // Test the query with enhanced search
    console.log("\n🔍 Testing enhanced search for current job query...");
    const searchResults = await convex.action("memory:enhancedMemorySearchForDevelopment", {
      query: query,
      developmentUserId: developmentUserId,
      limit: 5,
      threshold: 0.1
    });
    
    if (searchResults && searchResults.length > 0) {
      console.log(`\n📊 Enhanced search returned ${searchResults.length} results:`);
      
      searchResults.forEach((result, index) => {
        console.log(`\n--- RESULT ${index + 1} ---`);
        console.log(`Content: "${result.content}"`);
        console.log(`Semantic Score: ${result.searchScores?.semantic?.toFixed(3) || 'N/A'}`);
        console.log(`Final Score: ${result.finalScore?.toFixed(3) || 'N/A'}`);
        
        const isMicrosoft = result.content.toLowerCase().includes('microsoft');
        const isGoogle = result.content.toLowerCase().includes('google');
        const isRecent = result.content.toLowerCase().includes('started') ||
                        result.content.toLowerCase().includes('last week');
        
        console.log(`Company: ${isMicrosoft ? '🟦 MICROSOFT' : isGoogle ? '🔍 GOOGLE' : '❓ OTHER'}`);
        console.log(`Recent: ${isRecent ? '✅ YES' : '❌ NO'}`);
      });
      
      // Analyze Microsoft vs Google semantic scores
      const microsoftResult = searchResults.find(result =>
        result.content.toLowerCase().includes('microsoft')
      );
      
      const googleResult = searchResults.find(result =>
        result.content.toLowerCase().includes('google')
      );
      
      console.log("\n🔍 SEMANTIC SCORE ANALYSIS:");
      if (microsoftResult && googleResult) {
        console.log(`Microsoft memory semantic: ${microsoftResult.searchScores?.semantic?.toFixed(3)}`);
        console.log(`Google memory semantic: ${googleResult.searchScores?.semantic?.toFixed(3)}`);
        
        if (microsoftResult.searchScores?.semantic > googleResult.searchScores?.semantic) {
          console.log("✅ SEMANTIC INTELLIGENCE: Microsoft memory has higher semantic score");
          console.log("❌ MULTI-DIMENSIONAL PROBLEM: Other scores are overriding semantic intelligence");
        } else {
          console.log("❌ SEMANTIC PROBLEM: Google memory has higher semantic score for current job query");
        }
      } else if (!microsoftResult) {
        console.log("❌ DATA PROBLEM: No Microsoft job memory found in database");
      }
    }
    
    return {
      jobMemoriesFound: jobMemories.length,
      searchResults: searchResults,
      hasMicrosoftMemory: jobMemories.some(m => 
        m.content.toLowerCase().includes('microsoft')
      ),
      hasGoogleMemory: jobMemories.some(m => 
        m.content.toLowerCase().includes('google')
      )
    };
    
  } catch (error) {
    console.error("❌ Goal 4/4 check failed:", error.message);
    return null;
  }
}

async function generateOverallAnalysis(goal2Result, goal3Result, goal4Result) {
  console.log("\n" + "=".repeat(70));
  console.log("📊 OVERALL SEMANTIC INTELLIGENCE ANALYSIS");
  console.log("=========================================");
  
  console.log("\n🎯 SUMMARY OF FINDINGS:");
  
  // Goal 1 (we already know)
  console.log("Goal 1/4 (Sarah meeting):");
  console.log("  ✅ Correct memory exists with HIGHER semantic score (65.6% vs 45.4%)");
  console.log("  🎯 Pure semantic scoring would solve this problem");
  
  // Goal 2
  if (goal2Result) {
    console.log("\nGoal 2/4 (Passport renewal):");
    if (goal2Result.hasPassportMemory) {
      console.log("  ✅ Passport memory exists in database");
      console.log("  🔍 Need to analyze semantic scores to determine if semantic-only would work");
    } else {
      console.log("  ❌ Passport memory missing from database (data problem)");
    }
  }
  
  // Goal 3
  if (goal3Result) {
    console.log("\nGoal 3/4 (Restaurant preference):");
    if (goal3Result.hasPreferenceMemory) {
      console.log("  ✅ Restaurant preference memory exists in database");
      console.log("  🔍 Need to analyze semantic scores to determine if semantic-only would work");
    } else {
      console.log("  ❌ Restaurant preference memory missing from database (data problem)");
    }
  }
  
  // Goal 4
  if (goal4Result) {
    console.log("\nGoal 4/4 (Current job):");
    if (goal4Result.hasMicrosoftMemory) {
      console.log("  ✅ Microsoft job memory exists in database");
      console.log("  🔍 Need to analyze semantic scores vs Google memory");
    } else {
      console.log("  ❌ Microsoft job memory missing from database (data problem)");
    }
  }
  
  console.log("\n💡 NEXT STEPS:");
  console.log("1. For goals with existing correct memories: Test pure semantic scoring");
  console.log("2. For goals with missing memories: Create missing test data");
  console.log("3. Determine if semantic intelligence alone can solve all disambiguation problems");
}

// Execute all checks
console.log("🚀 Starting Goals 2-4 Memory Analysis...\n");

Promise.all([
  checkGoal2PassportMemory(),
  checkGoal3RestaurantMemory(), 
  checkGoal4JobMemory()
]).then(([goal2Result, goal3Result, goal4Result]) => {
  generateOverallAnalysis(goal2Result, goal3Result, goal4Result);
  
  console.log("\n✅ Goals 2-4 Analysis Complete");
  process.exit(0);
}).catch(error => {
  console.error("❌ Analysis Failed:", error);
  process.exit(1);
});