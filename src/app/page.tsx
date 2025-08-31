
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is a simple redirect page. It sends the user to the main dashboard.
// The dashboard's layout is responsible for handling authentication.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Return null or a loader while the redirect happens
  return null;
}
