
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import type { User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { initAuthListener } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, type Timestamp } from "firebase/firestore";

type Subscription = {
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    plan: string;
    current_period_end: Timestamp;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  subscription: Subscription | null;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, subscription: null });

const protectedPaths = [
    "/dashboard",
    "/draw-tracker",
    "/program-tracker",
    "/chatbot",
    "/faq",
    "/profile",
];

const publicPaths = ["/", "/auth"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = initAuthListener((authUser) => {
      setUser(authUser);
      if (!authUser) {
        setSubscription(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !user || loading) return;
    const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
      const q = query(subscriptionsRef, where("status", "in", ["trialing", "active"]));
      
      const unsubscribeSub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const subData = snapshot.docs[0].data() as Subscription;
          setSubscription(subData);
        } else {
          setSubscription(null);
        }
      });
    return () => unsubscribeSub();
  }, [user, loading]);

  useEffect(() => {
    if (!user) {
        setLoading(false);
    }
  }, [user])

  useEffect(() => {
    if (loading) return;

    const pathIsProtected = protectedPaths.some(path => pathname.startsWith(path));
    
    if (!user && pathIsProtected) {
      router.replace('/auth');
    }
    
    const isCheckout = new URLSearchParams(window.location.search).has('redirect_to');
    if (user && pathname.startsWith('/auth') && !isCheckout) {
        router.replace('/dashboard');
    }

  }, [user, loading, router, pathname]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"></div>;
  }
  
  const pathIsProtected = protectedPaths.some(path => pathname.startsWith(path));
  if (!user && pathIsProtected) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"></div>;
  }

  return (
    <AuthContext.Provider value={{ user, loading, subscription }}>
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
