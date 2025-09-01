
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

const publicPaths = ["/auth", "/dashboard"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && !publicPaths.includes(pathname)) {
      router.push('/auth');
    }
  }, [user, loading, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading && !publicPaths.includes(pathname) ? <div className="flex h-screen w-full items-center justify-center bg-background"></div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function WithAuth(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (!loading && !user && !publicPaths.includes(pathname)) {
        router.replace('/auth');
      }
    }, [user, loading, router, pathname]);

    if (loading || (!user && !publicPaths.includes(pathname))) {
      return  <div className="flex h-screen w-full items-center justify-center bg-background"></div>;
    }

    return <Component {...props} />;
  };
}
