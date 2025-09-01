
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      {/* You can add a loader here if you want */}
    </div>
  );
}
