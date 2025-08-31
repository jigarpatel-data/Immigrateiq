
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is the root page of the application.
// Its only job is to redirect the user to the dashboard.
// The actual authentication check is handled by the AppLayout.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Return null or a loading indicator while the redirect happens
  return null;
}
