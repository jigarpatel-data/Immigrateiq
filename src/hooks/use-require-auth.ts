
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './use-auth';

// This hook is now deprecated in favor of the gatekeeper page pattern.
// It is kept here in case it's needed for other purposes, but it's
// no longer used for routing protection in AppLayout.
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect runs when the auth state changes.
    // If the auth state is not loading and there is no user,
    // it means the user is not authenticated and should be redirected to the login page.
    if (!auth.loading && !auth.user) {
      router.push('/login');
    }
  }, [auth.loading, auth.user, router]);

  // The hook returns the auth state, which includes the user object and loading status.
  // The component using this hook can use this information to render different UIs
  // based on the authentication state. For example, showing a loading spinner while
  // auth.loading is true.
  return auth;
}
