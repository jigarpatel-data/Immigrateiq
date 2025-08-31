
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // We don't want to redirect until we have a definitive auth status.
    // So we wait until loading is false.
    if (!loading) {
      if (user) {
        // If user is logged in, send them to the dashboard.
        router.replace('/dashboard');
      } else {
        // If no user, send them to the login page.
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // While the authentication is loading, we show a full-screen spinner.
  // This is the "gatekeeper" that prevents the redirect loop.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
