"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";

function AuthenticatedRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/chat");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-magis-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magis-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to chat...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
      
      <Unauthenticated>
        <main className="min-h-screen bg-gradient-to-br from-magis-50 to-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              {/* Hero Section */}
              <div className="mb-16">
                <h1 className="text-6xl font-bold text-gray-900 mb-6">
                  <span className="text-magis-600">MAGIS</span>
                  <br />
                  <span className="text-4xl font-light">Your Personal AI Assistant</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Revolutionary AI assistant with comprehensive memory, proactive intelligence, 
                  and natural voice interaction across all your life contexts.
                </p>
                
                {/* CTA Button */}
                <Link
                  href="/auth"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-magis-600 hover:bg-magis-700 transition-colors"
                >
                  Get Started with MAGIS
                </Link>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-magis-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    🧠
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">RAG Memory</h3>
                  <p className="text-sm text-gray-600">
                    Remembers every conversation and learns from your preferences
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-magis-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    🗣️
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Voice First</h3>
                  <p className="text-sm text-gray-600">
                    Natural speech-to-text and text-to-speech integration
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-magis-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    💬
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Proactive Care</h3>
                  <p className="text-sm text-gray-600">
                    Naturally follows up on experiences and builds relationships
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-magis-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    🎯
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Context Aware</h3>
                  <p className="text-sm text-gray-600">
                    Adapts between work, personal, and family contexts seamlessly
                  </p>
                </div>
              </div>

              {/* Development Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-green-800 mb-2">🎉 Development Complete!</h3>
                <p className="text-green-700">
                  MAGIS basic functionality is now ready. Click "Get Started" to begin your journey!
                </p>
              </div>
            </div>
          </div>
        </main>
      </Unauthenticated>
    </>
  );
}