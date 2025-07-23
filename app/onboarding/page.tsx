'use client';

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import nextDynamic from 'next/dynamic';

const OnboardingFlow = nextDynamic(() => import('@/components/OnboardingFlow'), {
  ssr: false,
});

function UnauthenticatedRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/auth");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      
      <Authenticated>
        <OnboardingFlow />
      </Authenticated>
    </>
  );
}