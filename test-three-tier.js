/**
 * Test Script for Three-Tier Intelligence System
 * Test the WHO I AM / WHAT I DID / WHAT I'LL DO classification
 */

const testCases = [
  // PROFILE (WHO I AM) test cases
  {
    content: "My birthday is December 29th and I work at Google as a software engineer",
    expectedClassification: "PROFILE",
    description: "Biographical information should be classified as PROFILE"
  },
  
  // MEMORY (WHAT I DID) test cases  
  {
    content: "I had a great dinner at Luigi's restaurant last night with my friend Sarah",
    expectedClassification: "MEMORY",
    description: "Past experience should be classified as MEMORY"
  },
  
  // EXPERIENCE (WHAT I'LL DO) test cases
  {
    content: "I need to go to the dentist next Friday at 2 PM downtown",
    expectedClassification: "EXPERIENCE", 
    description: "Future appointment should be classified as EXPERIENCE with date resolution"
  },
  
  {
    content: "Meeting with the client next week to discuss the project",
    expectedClassification: "EXPERIENCE",
    description: "Future meeting should be classified as EXPERIENCE with date range"
  }
];

// This would be run against the actual implementation
console.log("Three-Tier Intelligence Test Cases:");
console.log("===================================");

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.description}`);
  console.log(`   Input: "${testCase.content}"`);
  console.log(`   Expected: ${testCase.expectedClassification}`);
  console.log(`   Date Resolution Required: ${testCase.expectedClassification === 'EXPERIENCE' ? 'YES' : 'NO'}`);
});

console.log("\n✅ Test cases prepared for three-tier system validation");
console.log("🎯 Next: Run these through the actual extractEntitiesFromContent function");