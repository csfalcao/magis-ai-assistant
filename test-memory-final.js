/**
 * Final Memory Retrieval Test
 * Test if MAGIS can answer questions using stored memories
 */

async function testStoredMemoryRetrieval() {
  console.log("🎯 FINAL MEMORY RETRIEVAL TEST");
  console.log("==============================");
  console.log("Testing if MAGIS can answer questions from stored memories\n");
  
  // Test cases based on our stored memories
  const tests = [
    {
      question: "When is my birthday?",
      expectedMemory: "My birthday is December 29th",
      shouldContain: ["december", "29"]
    },
    {
      question: "Where do I work?", 
      expectedMemory: "I work at Google",
      shouldContain: ["google", "work"]
    },
    {
      question: "Who is my dentist?",
      expectedMemory: "Dr. Mary Johnson is my dentist", 
      shouldContain: ["mary", "johnson", "dentist"]
    },
    {
      question: "Tell me about the sushi I had",
      expectedMemory: "Had amazing sushi dinner at Nobu",
      shouldContain: ["nobu", "sushi", "amazing"]
    }
  ];
  
  let passedTests = 0;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`📝 TEST ${i + 1}/4: ${test.question}`);
    console.log(`🎯 Expected memory: ${test.expectedMemory}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: test.question }],
          context: 'personal'
        })
      });
      
      if (response.ok) {
        // Parse streaming response
        const reader = response.body.getReader();
        let fullResponse = '';
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('0:')) {
              const content = line.substring(2).replace(/"/g, '');
              fullResponse += content;
            }
          }
        }
        
        console.log(`🤖 MAGIS Response: "${fullResponse}"`);
        
        // Check if response contains expected information
        const responseLower = fullResponse.toLowerCase();
        const containsExpectedInfo = test.shouldContain.some(keyword => 
          responseLower.includes(keyword.toLowerCase())
        );
        
        const usedMemory = containsExpectedInfo && 
                          !responseLower.includes("don't have") &&
                          !responseLower.includes("don't know") &&
                          !responseLower.includes("share it with me");
        
        console.log(`📊 Memory Used: ${usedMemory ? '✅ YES' : '❌ NO'}`);
        console.log(`📊 Contains Expected: ${containsExpectedInfo ? '✅ YES' : '❌ NO'}\n`);
        
        if (usedMemory) {
          passedTests++;
        }
        
      } else {
        console.log(`❌ HTTP Error: ${response.status}\n`);
      }
      
    } catch (error) {
      console.log(`❌ Request Failed: ${error.message}\n`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("🎯 FINAL RESULTS");
  console.log("================");
  console.log(`Tests Passed: ${passedTests}/${tests.length}`);
  console.log(`Success Rate: ${Math.round((passedTests / tests.length) * 100)}%`);
  
  if (passedTests === tests.length) {
    console.log("\n🎉 COMPLETE SUCCESS!");
    console.log("✅ MAGIS can retrieve and use stored memories");
    console.log("✅ Store → Retrieve → Answer pipeline WORKING");
    console.log("✅ Ready for production use!");
  } else if (passedTests > 0) {
    console.log("\n⚠️  PARTIAL SUCCESS");
    console.log(`✅ ${passedTests} out of ${tests.length} tests passed`);
    console.log("✅ Memory retrieval is functional but needs optimization");
  } else {
    console.log("\n❌ MEMORY RETRIEVAL FAILED");
    console.log("❌ MAGIS cannot access stored memories");
    console.log("❌ RAG system needs fixing");
  }
  
  return passedTests;
}

// Run the test
testStoredMemoryRetrieval()
  .then(passedTests => {
    console.log(`\n✅ Test completed: ${passedTests} tests passed`);
    process.exit(passedTests > 0 ? 0 : 1);
  })
  .catch(error => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });