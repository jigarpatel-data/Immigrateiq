
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is the root page of the application.
// Its only job is to redirect the user to the dashboard.
// The dashboard route is protected by the AppLayout, which handles authentication.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null; // Render nothing while redirecting
}
