
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait until the authentication state is fully loaded
    if (!loading) {
      if (user) {
        // If user is logged in, redirect to the dashboard
        router.replace('/dashboard');
      } else {
        // If user is not logged in, redirect to the login page
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // While loading, show a spinner to prevent any premature rendering or redirects
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
