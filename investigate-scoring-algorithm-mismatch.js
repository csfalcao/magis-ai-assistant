/**
 * Investigate Scoring Algorithm Mismatch
 * The scoring algorithm expects different fields than what we store
 */

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://glorious-alligator-892.convex.cloud");

async function investigateFieldMismatch() {
  console.log("🔍 INVESTIGATING ENTITY/TEMPORAL SCORING FIELD MISMATCH");
  console.log("======================================================");
  
  const developmentUserId = "jh78atbrf5hkhz5bq8pqvzjyf57k3f2a";
  
  try {
    // Get Sarah meeting memory to analyze fields
    const memories = await convex.query("memory:getMemoriesForDevelopment", {
      developmentUserId: developmentUserId
    });
    
    const sarahMeeting = memories.find(memory => 
      memory.content.toLowerCase().includes('sarah') &&
      memory.content.toLowerCase().includes('meeting')
    );
    
    if (!sarahMeeting) {
      console.log("❌ Sarah meeting memory not found");
      return;
    }
    
    console.log("📋 SARAH MEETING MEMORY FIELDS:");
    console.log("==============================");
    console.log(`Content: "${sarahMeeting.content}"`);
    console.log();
    
    console.log("🔍 ENTITY-RELATED FIELDS:");
    console.log(`entities: ${JSON.stringify(sarahMeeting.entities)}`);
    console.log(`extractedEntities: ${JSON.stringify(sarahMeeting.extractedEntities)}`);
    console.log();
    
    console.log("⏰ TEMPORAL-RELATED FIELDS:");
    console.log(`keywords: ${JSON.stringify(sarahMeeting.keywords)}`);
    console.log(`resolvedDates: ${JSON.stringify(sarahMeeting.resolvedDates)}`);
    console.log(`createdAt: ${sarahMeeting.createdAt} (${new Date(sarahMeeting.createdAt).toLocaleString()})`);
    console.log();
    
    console.log("📊 ALL AVAILABLE FIELDS:");
    Object.keys(sarahMeeting).forEach(key => {
      const value = sarahMeeting[key];
      if (typeof value === 'object' && value !== null) {
        console.log(`${key}: ${JSON.stringify(value).substring(0, 100)}${JSON.stringify(value).length > 100 ? '...' : ''}`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });
    
    console.log("\n🐛 ALGORITHM MISMATCH ANALYSIS:");
    console.log("===============================");
    
    // Entity field mismatch
    console.log("🔍 ENTITY SCORING BUG:");
    if (sarahMeeting.entities && sarahMeeting.entities.length > 0) {
      console.log(`✅ Memory HAS entities: ${JSON.stringify(sarahMeeting.entities)}`);
    } else {
      console.log(`❌ Memory has NO entities field`);
    }
    
    if (sarahMeeting.extractedEntities) {
      console.log(`✅ Memory HAS extractedEntities: ${JSON.stringify(sarahMeeting.extractedEntities)}`);
    } else {
      console.log(`❌ Memory has NO extractedEntities field`);
      console.log(`🐛 SCORING ALGORITHM LOOKS FOR: memory.extractedEntities`);
      console.log(`💾 MEMORY ACTUALLY STORES: memory.entities`);
      console.log(`🔧 FIX: Algorithm should check memory.entities instead`);
    }
    
    // Temporal field mismatch  
    console.log("\n⏰ TEMPORAL SCORING BUG:");
    if (sarahMeeting.keywords && sarahMeeting.keywords.includes('friday')) {
      console.log(`✅ Memory HAS temporal keywords: ${JSON.stringify(sarahMeeting.keywords.filter(k => ['friday', '2pm', 'next'].includes(k)))}`);
    } else {
      console.log(`❌ Memory has NO temporal keywords`);
    }
    
    if (sarahMeeting.resolvedDates && sarahMeeting.resolvedDates.length > 0) {
      console.log(`✅ Memory HAS resolvedDates: ${JSON.stringify(sarahMeeting.resolvedDates)}`);
    } else {
      console.log(`❌ Memory has NO resolvedDates field`);
      console.log(`🐛 SCORING ALGORITHM LOOKS FOR: memory.resolvedDates`);
      console.log(`💾 MEMORY ACTUALLY STORES: temporal info in keywords`);
      console.log(`🔧 FIX: Algorithm should check keywords for temporal context`);
    }
    
    console.log("\n💡 REQUIRED ALGORITHM FIXES:");
    console.log("============================");
    console.log("1. 🔍 Entity Scoring: Change from memory.extractedEntities to memory.entities");
    console.log("2. ⏰ Temporal Scoring: Change from memory.resolvedDates to memory.keywords");
    console.log("3. 🧪 Test: Verify fixes work with existing Sarah meeting memory");
    console.log("4. 🎯 Result: Should see non-zero entity and temporal scores");
    
    return {
      hasEntities: !!(sarahMeeting.entities && sarahMeeting.entities.length > 0),
      hasExtractedEntities: !!sarahMeeting.extractedEntities,
      hasTemporalKeywords: !!(sarahMeeting.keywords && sarahMeeting.keywords.some(k => ['friday', '2pm', 'next'].includes(k.toLowerCase()))),
      hasResolvedDates: !!(sarahMeeting.resolvedDates && sarahMeeting.resolvedDates.length > 0),
      needsEntityFix: !sarahMeeting.extractedEntities && sarahMeeting.entities,
      needsTemporalFix: !sarahMeeting.resolvedDates && sarahMeeting.keywords
    };
    
  } catch (error) {
    console.error("❌ Investigation failed:", error.message);
    return null;
  }
}

// Execute investigation
console.log("🚀 Starting Scoring Algorithm Field Mismatch Investigation...\n");

investigateFieldMismatch()
  .then((analysis) => {
    if (analysis) {
      console.log("\n📊 INVESTIGATION SUMMARY:");
      console.log("=========================");
      console.log(`Memory has entities: ${analysis.hasEntities}`);
      console.log(`Memory has extractedEntities: ${analysis.hasExtractedEntities}`);
      console.log(`Memory has temporal keywords: ${analysis.hasTemporalKeywords}`);
      console.log(`Memory has resolvedDates: ${analysis.hasResolvedDates}`);
      console.log();
      console.log(`Entity scoring fix needed: ${analysis.needsEntityFix}`);
      console.log(`Temporal scoring fix needed: ${analysis.needsTemporalFix}`);
      
      if (analysis.needsEntityFix || analysis.needsTemporalFix) {
        console.log("\n🔧 NEXT STEPS:");
        console.log("1. Fix field mismatches in convex/memory.ts");
        console.log("2. Test with Sarah meeting memory");
        console.log("3. Verify entity and temporal scores become non-zero");
      }
    }
    
    console.log("\n✅ Field Mismatch Investigation Complete");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Investigation Failed:", error);
    process.exit(1);
  });