// Test Profile Updates in isolation
// Tests database update operations for profile data

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient("https://glorious-alligator-892.convex.cloud");
const userId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";

async function testProfileUpdatesOnly() {
  console.log("🎯 PROFILE UPDATES ISOLATED TEST");
  console.log("=".repeat(50));
  
  // Test cases for profile updates
  const testCases = [
    {
      name: "Work Info Update",
      profileUpdate: {
        workInfo: {
          employment: {
            company: "TestCorp",
            position: "Senior Developer",
            status: "employed"
          }
        }
      },
      extractedFields: ["workInfo.employment.company", "workInfo.employment.position", "workInfo.employment.status"],
      verificationPath: "workInfo.employment.company",
      expectedValue: "TestCorp"
    },
    {
      name: "Personal Info Update",
      profileUpdate: {
        personalInfo: {
          location: {
            city: "San Francisco",
            state: "California"
          }
        }
      },
      extractedFields: ["personalInfo.location.city", "personalInfo.location.state"],
      verificationPath: "personalInfo.location.city",
      expectedValue: "San Francisco"
    },
    {
      name: "Family Info Update",
      profileUpdate: {
        familyInfo: {
          spouse: {
            name: "Alex"
          }
        }
      },
      extractedFields: ["familyInfo.spouse.name"],
      verificationPath: "familyInfo.spouse.name",
      expectedValue: "Alex"
    },
    {
      name: "Service Provider Update",
      profileUpdate: {
        serviceProviders: {
          healthcare: [{
            type: "dentist",
            name: "Dr. Johnson",
            practice: "Bay Area Dental"
          }]
        }
      },
      extractedFields: ["serviceProviders.healthcare"],
      verificationPath: "serviceProviders.healthcare",
      expectedValue: "Dr. Johnson" // Will check first provider name
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const failedCases = [];

  console.log("\n📊 Running Profile Update Tests...\n");

  for (const test of testCases) {
    totalTests++;
    
    try {
      console.log(`🔄 Testing: ${test.name}`);
      console.log(`   Update: ${JSON.stringify(test.profileUpdate, null, 2).replace(/\n/g, '\n          ')}`);
      
      // Apply the profile update
      const updateResult = await client.mutation(api.profileExtractor.applyProfileUpdate, {
        userId: userId,
        profileUpdate: test.profileUpdate,
        extractedFields: test.extractedFields,
      });
      
      if (updateResult.success) {
        console.log(`   ✅ Update applied successfully`);
        console.log(`   📝 Updated fields: ${updateResult.updatedFields.join(", ")}`);
        
        // Verify the update by reading the user profile
        const user = await client.query(api.users.getUserById, { userId: userId });
        
        if (user) {
          // Navigate to the verification path
          const pathParts = test.verificationPath.split('.');
          let value = user;
          for (const part of pathParts) {
            value = value?.[part];
          }
          
          let verified = false;
          if (test.expectedValue === "Dr. Johnson" && Array.isArray(value)) {
            // Special case for healthcare providers array
            verified = value.some(provider => provider.name === test.expectedValue);
          } else {
            verified = value === test.expectedValue;
          }
          
          if (verified) {
            passedTests++;
            console.log(`   ✅ Verification successful: Found "${test.expectedValue}"`);
          } else {
            console.log(`   ❌ Verification failed: Expected "${test.expectedValue}", got "${value}"`);
            failedCases.push({ ...test, actualValue: value });
          }
        } else {
          console.log(`   ❌ Could not retrieve user to verify update`);
          failedCases.push({ ...test, error: "User not found" });
        }
      } else {
        console.log(`   ❌ Update failed`);
        failedCases.push({ ...test, error: "Update operation failed" });
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failedCases.push({ ...test, error: error.message });
    }
    
    console.log(""); // Empty line for readability
  }

  // Also test profile task generation
  console.log("🎯 Testing Proactive Task Generation...\n");
  
  try {
    const jobUpdate = {
      workInfo: {
        employment: {
          company: "NewStartup",
          position: "Tech Lead"
        }
      }
    };
    
    const tasksResult = await client.mutation(api.profileExtractor.generateProfileTasks, {
      userId: userId,
      profileUpdate: jobUpdate,
      updateType: "work_info"
    });
    
    console.log(`✅ Task generation successful: ${tasksResult.tasksCreated} tasks created`);
    
    // Check if tasks were actually created
    const pendingTasks = await client.query(api.systemTaskExecutor.getPendingSystemTasks, {
      limit: 10
    });
    
    console.log(`📋 Found ${pendingTasks.length} pending system tasks`);
    
  } catch (error) {
    console.error(`❌ Task generation failed: ${error.message}`);
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 PROFILE UPDATE TEST SUMMARY");
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${totalTests - passedTests}`);

  if (failedCases.length > 0) {
    console.log("\n❌ Failed Cases:");
    failedCases.forEach((fc, i) => {
      console.log(`\n${i + 1}. ${fc.name}`);
      console.log(`   Verification path: ${fc.verificationPath}`);
      console.log(`   Expected: ${fc.expectedValue}`);
      if (fc.actualValue !== undefined) {
        console.log(`   Actual: ${fc.actualValue}`);
      }
      if (fc.error) console.log(`   Error: ${fc.error}`);
    });
  }

  return {
    totalTests,
    passedTests,
    successRate: (passedTests/totalTests)*100,
    failedCases
  };
}

// Run the test
testProfileUpdatesOnly().then((results) => {
  console.log("\n✅ Profile update test completed");
  if (results.successRate >= 90) {
    console.log("🎉 Profile updates working excellently!");
  } else if (results.successRate >= 70) {
    console.log("⚠️  Profile updates need improvements");
  } else {
    console.log("❌ Profile updates need significant improvements");
  }
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Test error:", error);
  process.exit(1);
});