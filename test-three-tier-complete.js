// Comprehensive Three-Tier Intelligence System Test
// Tests the complete flow: Classification → Profile Update → Profile-First Query Resolution

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient("https://basic-fish-163.convex.cloud");
const userId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a"; // Test user

// Test scenarios
const testScenarios = [
  {
    name: "Goal 4/4: Job Update → Current Work Query",
    messages: [
      "Just started working at Microsoft last week as a Software Engineer",
      "I'm excited about my new role at Microsoft"
    ],
    query: "where do i currently work?",
    expectedAnswer: "Microsoft",
    expectedSource: "profile"
  },
  {
    name: "Birthday Profile Update",
    messages: [
      "My birthday is December 29th"
    ],
    query: "when is my birthday?",
    expectedAnswer: "December 29",
    expectedSource: "profile"
  },
  {
    name: "Location Profile Update",
    messages: [
      "I live in Miami, Florida"
    ],
    query: "where do i live?",
    expectedAnswer: "Miami",
    expectedSource: "profile"
  }
];

async function runThreeTierTest() {
  console.log("🎯 THREE-TIER INTELLIGENCE SYSTEM - COMPREHENSIVE TEST");
  console.log("=" .repeat(70));
  
  let totalTests = 0;
  let passedTests = 0;

  for (const scenario of testScenarios) {
    totalTests++;
    console.log(`\n📋 Test: ${scenario.name}`);
    console.log("-".repeat(50));
    
    try {
      // Step 1: Send messages that should update profile
      console.log("\n1️⃣ SENDING PROFILE UPDATE MESSAGES:");
      for (const message of scenario.messages) {
        console.log(`   📝 "${message}"`);
        
        // Classify the content
        const classification = await client.action(api.contentClassifier.classifyContent, {
          content: message,
          context: "personal"
        });
        
        console.log(`   🏷️ Classification: ${classification.classification} (${classification.confidence})`);
        
        // If it's PROFILE content, extract and update
        if (classification.classification === "PROFILE") {
          const extraction = await client.action(api.profileExtractor.extractProfileData, {
            content: message,
            classification: classification.classification,
            context: "personal",
            subType: classification.subType
          });
          
          if (extraction.success && extraction.profileUpdate) {
            console.log(`   ✅ Extracted fields: ${extraction.extractedFields.join(", ")}`);
            
            // Apply profile update
            await client.mutation(api.profileExtractor.applyProfileUpdate, {
              userId: userId,
              profileUpdate: extraction.profileUpdate,
              extractedFields: extraction.extractedFields
            });
            
            console.log(`   ✅ Profile updated!`);
            
            // Check if proactive tasks were generated
            const tasksResult = await client.mutation(api.profileExtractor.generateProfileTasks, {
              userId: userId,
              profileUpdate: extraction.profileUpdate,
              updateType: classification.subType || 'general'
            });
            
            if (tasksResult.tasksCreated > 0) {
              console.log(`   🎯 Generated ${tasksResult.tasksCreated} proactive tasks`);
            }
          }
        }
        
        // Also create a memory for conversation history
        await client.action(api.memoryExtraction.extractEntitiesFromContent, {
          content: message,
          context: "personal",
          messageId: `test-msg-${Date.now()}`,
          conversationId: "test-conversation",
          userId: userId,
          classification: classification.classification
        });
      }
      
      // Step 2: Test query resolution
      console.log(`\n2️⃣ TESTING QUERY: "${scenario.query}"`);
      
      const searchResults = await client.action(api.memory.enhancedMemorySearchForDevelopment, {
        developmentUserId: userId,
        query: scenario.query,
        context: "personal",
        limit: 5,
        threshold: 0.1
      });
      
      if (searchResults && searchResults.length > 0) {
        const topResult = searchResults[0];
        console.log(`\n   🔍 Top Result:`);
        console.log(`   Content: "${topResult.content}"`);
        console.log(`   Type: ${topResult.memoryType}`);
        console.log(`   Scores:`, JSON.stringify(topResult.searchScores, null, 2));
        
        // Check if answer came from profile
        const isFromProfile = topResult.memoryType === 'profile' && 
                            topResult.searchScores.semantic === 1.0;
        
        // Check if answer contains expected content
        const containsExpected = topResult.content.toLowerCase().includes(scenario.expectedAnswer.toLowerCase());
        
        if (isFromProfile && containsExpected) {
          console.log(`\n   ✅ PASS: Answer retrieved from ${scenario.expectedSource}!`);
          console.log(`   ✅ Contains expected answer: "${scenario.expectedAnswer}"`);
          passedTests++;
        } else {
          console.log(`\n   ❌ FAIL: Expected from ${scenario.expectedSource}, got from ${topResult.memoryType}`);
          if (!containsExpected) {
            console.log(`   ❌ Missing expected answer: "${scenario.expectedAnswer}"`);
          }
        }
      } else {
        console.log(`   ❌ FAIL: No results returned`);
      }
      
      // Step 3: Verify profile state
      console.log(`\n3️⃣ VERIFYING PROFILE STATE:`);
      const user = await client.query(api.users.getUserById, { userId: userId });
      
      if (scenario.name.includes("Job")) {
        if (user?.workInfo?.employment?.company) {
          console.log(`   ✅ Profile contains: Company = ${user.workInfo.employment.company}`);
          if (user.workInfo.employment.position) {
            console.log(`   ✅ Profile contains: Position = ${user.workInfo.employment.position}`);
          }
        } else {
          console.log(`   ❌ Profile missing work info`);
        }
      } else if (scenario.name.includes("Birthday")) {
        if (user?.personalInfo?.dateOfBirth) {
          const date = new Date(user.personalInfo.dateOfBirth);
          console.log(`   ✅ Profile contains: Birthday = ${date.toLocaleDateString()}`);
        } else {
          console.log(`   ❌ Profile missing birthday`);
        }
      } else if (scenario.name.includes("Location")) {
        if (user?.personalInfo?.location?.city) {
          console.log(`   ✅ Profile contains: City = ${user.personalInfo.location.city}`);
          if (user.personalInfo.location.state) {
            console.log(`   ✅ Profile contains: State = ${user.personalInfo.location.state}`);
          }
        } else {
          console.log(`   ❌ Profile missing location`);
        }
      }
      
    } catch (error) {
      console.error(`\n   ❌ ERROR: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST SUMMARY:");
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log("\n🎉 ALL TESTS PASSED! Three-Tier Intelligence System is working perfectly!");
  } else {
    console.log("\n⚠️  Some tests failed. Review the output above for details.");
  }
  
  // Test proactive task execution
  console.log("\n" + "=".repeat(70));
  console.log("🎯 BONUS: Testing Proactive Task System");
  console.log("-".repeat(50));
  
  try {
    const pendingTasks = await client.query(api.systemTaskExecutor.getPendingSystemTasks, {
      limit: 5
    });
    
    console.log(`\n📋 Found ${pendingTasks.length} pending system tasks`);
    
    if (pendingTasks.length > 0) {
      console.log("\nPending tasks:");
      pendingTasks.forEach((task, i) => {
        const triggerIn = task.triggerDate - Date.now();
        const triggerText = triggerIn > 0 
          ? `in ${Math.round(triggerIn / (1000 * 60))} minutes`
          : `${Math.round(-triggerIn / (1000 * 60))} minutes ago`;
        
        console.log(`   ${i + 1}. ${task.description}`);
        console.log(`      Type: ${task.taskType}`);
        console.log(`      Priority: ${task.priority}`);
        console.log(`      Trigger: ${triggerText}`);
      });
    }
  } catch (error) {
    console.log(`\n⚠️  Could not fetch pending tasks: ${error.message}`);
  }
}

// Run the test
runThreeTierTest().then(() => {
  console.log("\n✅ Test suite completed");
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Test suite error:", error);
  process.exit(1);
});