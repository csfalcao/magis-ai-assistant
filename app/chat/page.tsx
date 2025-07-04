"use client";

import { useEffect } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";

function UnauthenticatedRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/auth");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magis-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      
      <Authenticated>
        <div className="min-h-screen bg-gray-50">
          <ChatInterface />
        </div>
      </Authenticated>
    </>
  );
}