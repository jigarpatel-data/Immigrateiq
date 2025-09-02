
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import type { User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { initAuthListener } from "@/lib/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

const protectedPaths = [
    "/draw-tracker",
    "/program-tracker",
    "/chatbot",
    "/faq",
    "/profile",
];

const publicPaths = ["/auth", "/dashboard"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = initAuthListener((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const pathIsProtected = protectedPaths.some(path => pathname.startsWith(path));
    
    if (!user && pathIsProtected) {
      router.replace('/auth');
    }
    
    if (user && pathname.startsWith('/auth')) {
        router.replace('/dashboard');
    }

  }, [user, loading, router, pathname]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"></div>;
  }
  
  const pathIsProtected = protectedPaths.some(path => pathname.startsWith(path));
  if (!user && pathIsProtected) {
    // While redirecting, show a loader
    return <div className="flex h-screen w-full items-center justify-center bg-background"></div>;
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
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
    const { loading } = useAuth();
    
    if (loading) {
       return  <div className="flex h-screen w-full items-center justify-center bg-background"></div>;
    }

    return <Component {...props} />;
  };
}
