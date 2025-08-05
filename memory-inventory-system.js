/**
 * Comprehensive Memory Inventory System
 * Generate structured inventory of all existing memories by category
 * Provide foundation for validation-first testing methodology
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function generateMemoryInventory() {
  console.log("📋 GENERATING COMPREHENSIVE MEMORY INVENTORY");
  console.log("============================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    // Get all memories
    const allMemories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    console.log(`📊 Total memories in database: ${allMemories.length}\n`);
    
    // Sort by creation date (newest first)
    const sortedMemories = allMemories.sort((a, b) => b.createdAt - a.createdAt);
    
    // Categorization by content analysis
    const categories = {
      people: [],
      work: [],
      health: [], 
      travel: [],
      dining: [],
      appointments: [],
      preferences: [],
      locations: [],
      other: []
    };
    
    // Analyze each memory and categorize
    sortedMemories.forEach((memory, index) => {
      const content = memory.content.toLowerCase();
      const memoryData = {
        id: index + 1,
        content: memory.content,
        memoryType: memory.memoryType || 'unknown',
        context: memory.context || 'unknown',
        importance: memory.importance || 'unknown',
        entities: memory.entities || [],
        keywords: memory.keywords || [],
        created: new Date(memory.createdAt).toLocaleString(),
        _id: memory._id
      };
      
      // Categorize based on content
      if (content.includes('sarah') || content.includes('john') || content.includes('friend')) {
        categories.people.push(memoryData);
      } else if (content.includes('work') || content.includes('google') || content.includes('microsoft') || content.includes('job')) {
        categories.work.push(memoryData);
      } else if (content.includes('dentist') || content.includes('doctor') || content.includes('health') || content.includes('blood pressure')) {
        categories.health.push(memoryData);
      } else if (content.includes('passport') || content.includes('europe') || content.includes('trip') || content.includes('travel')) {
        categories.travel.push(memoryData);
      } else if (content.includes('dinner') || content.includes('restaurant') || content.includes('nobu') || content.includes('luigi') || content.includes('prefer') && content.includes('restaurant')) {
        categories.dining.push(memoryData);
      } else if (content.includes('appointment') || content.includes('meeting') || content.includes('schedule') || content.includes('friday') || content.includes('tuesday')) {
        categories.appointments.push(memoryData);
      } else if (content.includes('prefer') || content.includes('hate') || content.includes('like') || content.includes('love')) {
        categories.preferences.push(memoryData);
      } else if (content.includes('seattle') || content.includes('miami') || content.includes('downtown') || content.includes('moving')) {
        categories.locations.push(memoryData);
      } else {
        categories.other.push(memoryData);
      }
    });
    
    // Generate detailed inventory report
    console.log("📂 MEMORY CATEGORIES:");
    console.log("====================");
    
    Object.entries(categories).forEach(([category, memories]) => {
      console.log(`\n${category.toUpperCase()} (${memories.length} memories):`);
      if (memories.length > 0) {
        memories.forEach(memory => {
          console.log(`  ${memory.id}. "${memory.content}"`);
          console.log(`     Type: ${memory.memoryType} | Context: ${memory.context} | Importance: ${memory.importance}`);
          console.log(`     Entities: [${memory.entities.join(', ')}] | Keywords: [${memory.keywords.join(', ')}]`);
          console.log(`     Created: ${memory.created}`);
          console.log();
        });
      } else {
        console.log("     (No memories in this category)");
      }
    });
    
    return {
      total: allMemories.length,
      categories: categories,
      sortedMemories: sortedMemories
    };
    
  } catch (error) {
    console.error("❌ Memory inventory generation failed:", error.message);
    return null;
  }
}

async function analyzeTestScenarios() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TEST SCENARIO ANALYSIS");
  console.log("=========================");
  
  // Define all known test scenarios from 90-PERCENT-SUCCESS-GOALS.md
  const testScenarios = [
    {
      id: "1/4",
      name: "Sarah Meeting Disambiguation", 
      query: "When is my meeting with Sarah?",
      requiredMemories: [
        "Meeting with Sarah (should win)",
        "Dinner with Sarah (should lose)"
      ],
      currentStatus: "unknown"
    },
    {
      id: "2/4",
      name: "Passport Renewal Memory",
      query: "When do I need to renew my passport?",
      requiredMemories: [
        "Passport renewal memory (should win)",
        "Other appointment memories (should lose)"
      ],
      currentStatus: "unknown"
    },
    {
      id: "3/4", 
      name: "Restaurant Preference vs Experience",
      query: "What kind of restaurants do I prefer?",
      requiredMemories: [
        "Restaurant preference memory (should win)",
        "Restaurant dining experience (should lose)"
      ],
      currentStatus: "unknown"
    },
    {
      id: "4/4",
      name: "Current Job vs Previous Job",
      query: "Where do I currently work?", 
      requiredMemories: [
        "Microsoft job memory (should win)",
        "Google job memory (should lose)"
      ],
      currentStatus: "unknown"
    }
  ];
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  console.log("🔍 Analyzing test scenario data availability...\n");
  
  for (const scenario of testScenarios) {
    console.log(`--- SCENARIO ${scenario.id}: ${scenario.name} ---`);
    console.log(`Query: "${scenario.query}"`);
    console.log(`Required memories: ${scenario.requiredMemories.join(', ')}`);
    
    try {
      // Test the query to see what memories are found
      const results = await convex.action("memory:enhancedMemorySearchForDevelopment", {
        query: scenario.query,
        developmentUserId: developmentUserId,
        limit: 5,
        threshold: 0.1
      });
      
      if (results && results.length > 0) {
        console.log(`✅ Query returns ${results.length} results:`);
        results.forEach((result, index) => {
          console.log(`  ${index + 1}. "${result.content.substring(0, 60)}..."`);
          console.log(`      Score: ${result.finalScore?.toFixed(3)}`);
        });
        
        // Analyze if we have the required memories for proper testing
        if (scenario.id === "1/4") {
          const hasMeeting = results.some(r => r.content.toLowerCase().includes('meeting') && r.content.toLowerCase().includes('sarah'));
          const hasDinner = results.some(r => r.content.toLowerCase().includes('dinner') && r.content.toLowerCase().includes('sarah'));
          console.log(`    Meeting memory: ${hasMeeting ? '✅ EXISTS' : '❌ MISSING'}`);
          console.log(`    Dinner memory: ${hasDinner ? '✅ EXISTS' : '❌ MISSING'}`);
          scenario.currentStatus = hasMeeting && hasDinner ? "ready" : "incomplete";
        } else if (scenario.id === "2/4") {
          const hasPassport = results.some(r => r.content.toLowerCase().includes('passport'));
          console.log(`    Passport memory: ${hasPassport ? '✅ EXISTS' : '❌ MISSING'}`);
          scenario.currentStatus = hasPassport ? "ready" : "incomplete";
        } else if (scenario.id === "3/4") {
          const hasPreference = results.some(r => r.content.toLowerCase().includes('prefer') && r.content.toLowerCase().includes('restaurant'));
          const hasExperience = results.some(r => r.content.toLowerCase().includes('dinner') || r.content.toLowerCase().includes('nobu'));
          console.log(`    Preference memory: ${hasPreference ? '✅ EXISTS' : '❌ MISSING'}`);
          console.log(`    Experience memory: ${hasExperience ? '✅ EXISTS' : '❌ MISSING'}`);
          scenario.currentStatus = hasPreference && hasExperience ? "ready" : "incomplete";
        } else if (scenario.id === "4/4") {
          const hasMicrosoft = results.some(r => r.content.toLowerCase().includes('microsoft'));
          const hasGoogle = results.some(r => r.content.toLowerCase().includes('google'));
          console.log(`    Microsoft memory: ${hasMicrosoft ? '✅ EXISTS' : '❌ MISSING'}`);
          console.log(`    Google memory: ${hasGoogle ? '✅ EXISTS' : '❌ MISSING'}`);
          scenario.currentStatus = hasMicrosoft && hasGoogle ? "ready" : "incomplete";
        }
        
      } else {
        console.log(`❌ Query returns no results`);
        scenario.currentStatus = "no_data";
      }
      
    } catch (error) {
      console.error(`❌ Error testing scenario: ${error.message}`);
      scenario.currentStatus = "error";
    }
    
    console.log(`Status: ${scenario.currentStatus.toUpperCase()}\n`);
  }
  
  // Generate test readiness summary
  console.log("📊 TEST READINESS SUMMARY:");
  console.log("==========================");
  
  const readyScenarios = testScenarios.filter(s => s.currentStatus === "ready").length;
  const incompleteScenarios = testScenarios.filter(s => s.currentStatus === "incomplete").length;
  const noDataScenarios = testScenarios.filter(s => s.currentStatus === "no_data").length;
  
  console.log(`✅ Ready for testing: ${readyScenarios}/4 scenarios`);
  console.log(`⚠️ Incomplete data: ${incompleteScenarios}/4 scenarios`);
  console.log(`❌ No data: ${noDataScenarios}/4 scenarios`);
  
  if (readyScenarios === 4) {
    console.log("\n🎉 ALL TEST SCENARIOS READY - Can proceed with comprehensive testing");
  } else {
    console.log("\n⚠️ MISSING TEST DATA - Need to create missing memories before testing");
    console.log("\nMissing memories needed:");
    testScenarios.filter(s => s.currentStatus !== "ready").forEach(scenario => {
      console.log(`- Scenario ${scenario.id}: ${scenario.name} (${scenario.currentStatus})`);
    });
  }
  
  return testScenarios;
}

// Execute comprehensive inventory and analysis
console.log("🚀 Starting Comprehensive Memory Inventory System...\n");

generateMemoryInventory()
  .then(async (inventory) => {
    if (inventory) {
      console.log("✅ Memory inventory generated successfully");
      
      // Analyze test scenarios
      const testAnalysis = await analyzeTestScenarios();
      
      console.log("\n" + "=".repeat(70));
      console.log("🎯 INVENTORY & TESTING FOUNDATION COMPLETE");
      console.log("==========================================");
      
      console.log(`📊 Database contains ${inventory.total} memories across ${Object.keys(inventory.categories).length} categories`);
      console.log("📋 Full inventory generated with categorization and metadata");
      console.log("🧪 Test scenario analysis completed");
      console.log("✅ Foundation ready for validation-first testing methodology");
      
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Memory Inventory System Failed:", error);
    process.exit(1);
  });