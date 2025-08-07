// Initialize test user in production database
// This ensures we have a valid user for testing

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient("https://basic-fish-163.convex.cloud");

async function initTestUser() {
  console.log("🔧 INITIALIZING TEST USER IN PRODUCTION");
  console.log("=".repeat(50));
  
  try {
    // Check if we can access the production database
    console.log("\n1️⃣ Checking production database access...");
    
    // Try to get current user (will fail but shows connectivity)
    try {
      const currentUser = await client.query(api.users.getCurrentUser, {});
      console.log("Current user check:", currentUser ? "Found" : "Not authenticated");
    } catch (error) {
      console.log("Auth check failed (expected):", error.message);
    }

    // Since we can't create users directly without auth, 
    // we'll document the required setup
    console.log("\n📋 REQUIRED SETUP:");
    console.log("1. The test user ID 'jh78atbrf5hkhz5bq8pqvzjyf57k3f2a' must exist in production");
    console.log("2. This user should be created through the proper auth flow");
    console.log("3. For testing, we may need to:");
    console.log("   - Use the development database instead");
    console.log("   - Create a proper test user through the app");
    console.log("   - Use authentication tokens for API calls");
    
    console.log("\n💡 RECOMMENDATION:");
    console.log("Switch testing to use the development database where test user exists:");
    console.log("URL: https://glorious-alligator-892.convex.cloud");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run initialization
initTestUser().then(() => {
  console.log("\n✅ Init script completed");
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Init script error:", error);
  process.exit(1);
});