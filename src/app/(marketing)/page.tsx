
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now a redirect. The new landing page is at /home
export default function MarketingRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      {/* You can add a loader here if you want */}
    </div>
  );
}
