/**
 * Test chat API with memory retrieval
 * Simpler test to validate the RAG system is working
 */

async function testChatWithMemory() {
  console.log("🧪 Testing Chat API with Memory Retrieval");
  console.log("=========================================");
  
  const testQueries = [
    "When is my birthday?",
    "Where do I work?", 
    "Who is my dentist?",
    "Tell me about the sushi dinner I had recently"
  ];
  
  for (const query of testQueries) {
    console.log(`\n📝 Testing: "${query}"`);
    
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: query }
          ],
          context: 'personal'
        }),
      });
      
      if (response.ok) {
        const reader = response.body?.getReader();
        let result = '';
        
        if (reader) {
          let decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            // Parse streaming response and extract text content
            const lines = chunk.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('0:')) {
                // Extract the text content from AI SDK streaming format
                const content = line.substring(2).replace(/"/g, '');
                result += content;
              }
            }
          }
        }
        
        console.log(`🤖 Response: "${result}"`);
        
        // Analyze if the response used memory
        const usedMemory = result.toLowerCase().includes('birthday') && query.includes('birthday') ||
                          result.toLowerCase().includes('google') && query.includes('work') ||
                          result.toLowerCase().includes('mary johnson') && query.includes('dentist') ||
                          result.toLowerCase().includes('nobu') && query.includes('sushi');
        
        console.log(`📊 Memory Used: ${usedMemory ? '✅ YES' : '❌ NO'}`);
        
      } else {
        console.log(`❌ Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    console.log("─".repeat(50));
  }
}

// Run the test
testChatWithMemory()
  .then(() => {
    console.log("\n✅ Chat memory test completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });