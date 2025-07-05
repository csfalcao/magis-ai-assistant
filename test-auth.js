// Test Convex Auth functionality
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://glorious-alligator-892.convex.cloud");

async function testAuth() {
  try {
    console.log("Testing Convex Auth setup...");
    
    // Try to call the auth endpoint
    const result = await client.action("auth:signIn", {
      provider: "password",
      params: {
        flow: "signUp",
        email: "test@example.com",
        password: "testpassword123",
        name: "Test User"
      }
    });
    
    console.log("Sign-up successful:", result);
  } catch (error) {
    console.error("Auth test error:", error.message);
    console.error("Full error:", error);
  }
}

testAuth();