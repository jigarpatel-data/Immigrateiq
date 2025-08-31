
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication status is no longer loading
    if (!loading) {
      if (user) {
        // If user is logged in, redirect to the dashboard
        router.push('/dashboard');
      } else {
        // If user is not logged in, redirect to the login page
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Display a loading spinner while checking authentication status
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
