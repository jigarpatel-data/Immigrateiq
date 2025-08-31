
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // We don't want to redirect until we are sure about the auth status.
    if (!loading) {
      if (user) {
        // If user is logged in, send them to the dashboard.
        router.replace('/dashboard');
      } else {
        // If user is not logged in, send them to the login page.
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // While the auth status is loading, we show a spinner.
  // This prevents the redirect loop.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
