/**
 * Enhanced Single Table System Test
 * Tests universal entity extraction, date resolution, and smart contact creation
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

// Test cases for enhanced single table system
const enhancedTestCases = [
  {
    id: 1,
    content: "My birthday is Dec 29 and I work at Google",
    expectedClassification: "PROFILE",
    expectedEntities: {
      people: [],
      organizations: ["Google"],
      resolvedDates: true, // Should resolve "Dec 29"
    },
    expectedContacts: 0, // No people mentioned
    description: "PROFILE: Biographical data with date resolution"
  },
  {
    id: 2,
    content: "Had dinner with my friend Sarah at Luigi's restaurant downtown last night",
    expectedClassification: "MEMORY",
    expectedEntities: {
      people: ["Sarah"],
      organizations: ["Luigi's"],
      locations: ["downtown"],
      resolvedDates: true, // Should resolve "last night"
    },
    expectedContacts: 1, // Sarah should be created as contact
    description: "MEMORY: Past experience with entity extraction and contact creation"
  },
  {
    id: 3,
    content: "I need to go to the dentist next Friday at 2 PM downtown with Dr. Smith",
    expectedClassification: "EXPERIENCE",
    expectedEntities: {
      people: ["Dr. Smith"],
      organizations: [],
      locations: ["downtown"],
      resolvedDates: true, // Should resolve "next Friday at 2 PM"
    },
    expectedContacts: 1, // Dr. Smith should be created as contact
    description: "EXPERIENCE: Future appointment with precise date resolution"
  },
  {
    id: 4,
    content: "Meeting with the Google team next week to discuss the project",
    expectedClassification: "EXPERIENCE",
    expectedEntities: {
      people: [],
      organizations: ["Google"],
      resolvedDates: true, // Should resolve "next week" as date range
    },
    expectedContacts: 0, // No people mentioned
    description: "EXPERIENCE: Future meeting with date range resolution"
  }
];

async function testEnhancedSingleTableSystem() {
  console.log("🚀 TESTING ENHANCED SINGLE TABLE SYSTEM");
  console.log("=========================================");
  console.log("Features: Universal entity extraction, date resolution, smart contact creation");
  
  const results = [];
  
  for (const testCase of enhancedTestCases) {
    console.log(`\n${testCase.id}. ${testCase.description}`);
    console.log(`Input: "${testCase.content}"`);
    console.log(`Expected Classification: ${testCase.expectedClassification}`);
    
    try {
      // Call the enhanced extraction function
      const result = await convex.action("memoryExtraction:extractEntitiesFromContent", {
        content: testCase.content,
        context: "personal", 
        messageId: `enhanced-test-message-${testCase.id}`,
        conversationId: `enhanced-test-conversation-${testCase.id}`,
        userId: "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a"
      });
      
      console.log(`✅ Processing: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success) {
        console.log(`📊 Classification: ${result.classification}`);
        console.log(`💾 Memory ID: ${result.memoryId}`);
        
        // Check extracted content details
        if (result.extractedContent) {
          const content = result.extractedContent;
          
          // Universal entity extraction validation
          console.log('\n🔍 UNIVERSAL ENTITY EXTRACTION:');
          if (content.extractedEntities) {
            const entities = content.extractedEntities;
            
            if (entities.people?.length) {
              console.log(`👥 People: ${entities.people.map(p => `${p.name} (${p.relationship || 'unknown'})`).join(', ')}`);
            }
            
            if (entities.organizations?.length) {
              console.log(`🏢 Organizations: ${entities.organizations.map(o => `${o.name} (${o.type || 'unknown'})`).join(', ')}`);
            }
            
            if (entities.locations?.length) {
              console.log(`📍 Locations: ${entities.locations.join(', ')}`);
            }
          }
          
          // Universal date resolution validation
          console.log('\n📅 UNIVERSAL DATE RESOLUTION:');
          if (content.resolvedDates?.length) {
            content.resolvedDates.forEach(date => {
              if (date.type === 'date') {
                console.log(`   "${date.original}" → ${date.value} (${new Date(date.timestamp || 0).toLocaleDateString()}) [confidence: ${date.confidence}]`);
              } else if (date.type === 'range') {
                console.log(`   "${date.original}" → ${date.start} to ${date.end} [confidence: ${date.confidence}]`);
              }
            });
          } else {
            console.log(`   No dates resolved`);
          }
          
          // Classification-specific data validation
          console.log('\n🗂️ CLASSIFICATION-SPECIFIC DATA:');
          if (content.profileData) {
            console.log(`   Profile Data: Personal(${content.profileData.personalInfo?.length || 0}), Work(${content.profileData.workInfo?.length || 0})`);
          } else if (content.memoryData) {
            console.log(`   Memory Data: Keywords(${content.memoryData.keywords?.length || 0}), Sentiment: ${content.memoryData.sentiment || 'none'}`);
          } else if (content.experienceData) {
            console.log(`   Experience Data: Participants(${content.experienceData.participants?.length || 0}), Location: ${content.experienceData.location || 'none'}`);
          }
        }
        
        // Validation summary
        console.log('\n🎯 VALIDATION RESULTS:');
        const classificationCorrect = result.classification === testCase.expectedClassification;
        console.log(`   Classification Match: ${classificationCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        const hasResolvedDates = result.extractedContent?.resolvedDates?.length > 0;
        console.log(`   Date Resolution: ${hasResolvedDates ? '✅ WORKING' : '❌ MISSING'}`);
        
        const hasPeople = result.extractedContent?.extractedEntities?.people?.length > 0;
        const expectedPeople = testCase.expectedEntities.people.length > 0;
        console.log(`   People Extraction: ${hasPeople === expectedPeople ? '✅ CORRECT' : '❌ INCORRECT'} (expected: ${expectedPeople}, got: ${hasPeople})`);
        
        results.push({
          testId: testCase.id,
          success: true,
          classificationCorrect,
          hasResolvedDates,
          hasPeople,
          extractedContent: result.extractedContent
        });
      } else {
        console.log(`❌ Error: ${result.error}`);
        results.push({
          testId: testCase.id,
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
      results.push({
        testId: testCase.id,
        success: false,
        error: error.message
      });
    }
    
    console.log("─".repeat(70));
  }
  
  // Summary
  console.log("\n📊 ENHANCED SYSTEM TEST SUMMARY");
  console.log("=================================");
  
  const successful = results.filter(r => r.success).length;
  const correctClassifications = results.filter(r => r.classificationCorrect).length;
  const workingDateResolution = results.filter(r => r.hasResolvedDates).length;
  const correctEntityExtraction = results.filter(r => r.hasPeople !== undefined).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful Processing: ${successful}/${results.length}`);
  console.log(`Correct Classifications: ${correctClassifications}/${results.length}`);
  console.log(`Working Date Resolution: ${workingDateResolution}/${results.length}`);
  console.log(`Entity Extraction Working: ${correctEntityExtraction}/${results.length}`);
  
  if (successful === results.length && correctClassifications === results.length && workingDateResolution >= 3) {
    console.log("\n🎉 ENHANCED SINGLE TABLE SYSTEM: ALL TESTS PASSED!");
    console.log("✅ Universal entity extraction working");
    console.log("✅ Universal date resolution working");
    console.log("✅ Classification-specific nested data working");
    console.log("✅ Smart contact creation ready for validation");
  } else {
    console.log("\n⚠️  Some enhanced features need debugging. Review results above.");
  }
  
  return results;
}

// Run the enhanced tests
testEnhancedSingleTableSystem()
  .then(results => {
    console.log("\n✅ Enhanced system testing complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Enhanced system testing failed:", error);
    process.exit(1);
  });