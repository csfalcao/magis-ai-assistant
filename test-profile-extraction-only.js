// Test Profile Extraction in isolation
// Tests extraction of structured data from PROFILE-classified content

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient("https://glorious-alligator-892.convex.cloud");

async function testProfileExtractionOnly() {
  console.log("🎯 PROFILE EXTRACTION ISOLATED TEST");
  console.log("=".repeat(50));
  
  // Test cases for profile extraction
  const testCases = [
    {
      content: "I work at Microsoft as a Software Engineer",
      expectedFields: ["workInfo.employment.company", "workInfo.employment.position"],
      expectedData: {
        workInfo: {
          employment: {
            company: "Microsoft",
            position: "Software Engineer"
          }
        }
      },
      category: "Work Info"
    },
    {
      content: "Just started working at Google last week",
      expectedFields: ["workInfo.employment.company"],
      expectedData: {
        workInfo: {
          employment: {
            company: "Google"
          }
        }
      },
      category: "Recent Job"
    },
    {
      content: "My birthday is December 29th",
      expectedFields: ["personalInfo.dateOfBirth"],
      expectedData: {
        personalInfo: {
          dateOfBirth: "December 29" // Will have timestamp
        }
      },
      category: "Personal Info"
    },
    {
      content: "I live in Miami, Florida",
      expectedFields: ["personalInfo.location.city", "personalInfo.location.state"],
      expectedData: {
        personalInfo: {
          location: {
            city: "Miami",
            state: "Florida"
          }
        }
      },
      category: "Location"
    },
    {
      content: "Dr. Smith is my dentist",
      expectedFields: ["serviceProviders.healthcare"],
      expectedData: {
        serviceProviders: {
          healthcare: [{
            type: "dentist",
            name: "Dr. Smith"
          }]
        }
      },
      category: "Service Provider"
    },
    {
      content: "My wife's name is Sarah",
      expectedFields: ["familyInfo.spouse.name"],
      expectedData: {
        familyInfo: {
          spouse: {
            name: "Sarah"
          }
        }
      },
      category: "Family Info"
    },
    {
      content: "I'm the CTO at TechStartup Inc",
      expectedFields: ["workInfo.employment.position", "workInfo.employment.company"],
      expectedData: {
        workInfo: {
          employment: {
            position: "CTO",
            company: "TechStartup Inc"
          }
        }
      },
      category: "Executive Position"
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const failedCases = [];

  console.log("\n📊 Running Profile Extraction Tests...\n");

  for (const test of testCases) {
    totalTests++;
    
    try {
      const result = await client.action(api.profileExtractor.extractProfileData, {
        content: test.content,
        classification: "PROFILE",
        context: "personal",
        subType: test.category.toLowerCase().replace(" ", "_")
      });
      
      if (!result.success) {
        console.log(`❌ [${test.category}] "${test.content}"`);
        console.log(`   Extraction failed - no profile data extracted`);
        failedCases.push({ ...test, error: "Extraction failed" });
        continue;
      }
      
      // Check if expected fields were extracted
      const extractedAllFields = test.expectedFields.every(field => 
        result.extractedFields.includes(field)
      );
      
      if (extractedAllFields && result.profileUpdate) {
        passedTests++;
        console.log(`✅ [${test.category}] "${test.content}"`);
        console.log(`   Extracted fields: ${result.extractedFields.join(", ")}`);
        console.log(`   Confidence: ${result.confidence}`);
        
        // Show extracted data
        console.log(`   Data:`, JSON.stringify(result.profileUpdate, null, 2).split('\n').map(line => `        ${line}`).join('\n'));
      } else {
        console.log(`❌ [${test.category}] "${test.content}"`);
        console.log(`   Expected fields: ${test.expectedFields.join(", ")}`);
        console.log(`   Extracted fields: ${result.extractedFields.join(", ")}`);
        if (result.profileUpdate) {
          console.log(`   Data:`, JSON.stringify(result.profileUpdate, null, 2).split('\n').map(line => `        ${line}`).join('\n'));
        }
        failedCases.push({ ...test, extractedFields: result.extractedFields });
      }
      
    } catch (error) {
      console.error(`❌ [${test.category}] Extraction error: ${error.message}`);
      failedCases.push({ ...test, error: error.message });
    }
    
    console.log(""); // Empty line for readability
  }

  // Summary
  console.log("=".repeat(50));
  console.log("📊 PROFILE EXTRACTION TEST SUMMARY");
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${totalTests - passedTests}`);

  if (failedCases.length > 0) {
    console.log("\n❌ Failed Cases:");
    failedCases.forEach((fc, i) => {
      console.log(`\n${i + 1}. "${fc.content}"`);
      console.log(`   Category: ${fc.category}`);
      console.log(`   Expected fields: ${fc.expectedFields.join(", ")}`);
      if (fc.extractedFields) {
        console.log(`   Extracted fields: ${fc.extractedFields.join(", ")}`);
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
testProfileExtractionOnly().then((results) => {
  console.log("\n✅ Profile extraction test completed");
  if (results.successRate >= 90) {
    console.log("🎉 Profile extraction accuracy is excellent!");
  } else if (results.successRate >= 70) {
    console.log("⚠️  Profile extraction needs improvements");
  } else {
    console.log("❌ Profile extraction needs significant improvements");
  }
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Test error:", error);
  process.exit(1);
});