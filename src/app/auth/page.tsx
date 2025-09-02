
import { AuthForm } from "@/components/auth-form";
import { Landmark } from "lucide-react";
import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center flex-col items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Landmark className="w-8 h-8 text-accent" />
              <span className="text-2xl font-semibold">TheCanIndian</span>
            </Link>
             <p className="text-muted-foreground text-center">
              Welcome! Please sign in or create an account to continue.
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
      <div className="hidden lg:flex flex-1 relative bg-muted items-center justify-center p-8">
        <div className="max-w-md text-left">
          <div className="inline-block">
            <h1 className="text-4xl font-bold tracking-tight text-foreground animate-typing overflow-hidden whitespace-nowrap border-r-4 border-r-accent pr-4">
              Start Your Canadian Dream Today
            </h1>
          </div>
            <p className="mt-4 text-lg text-muted-foreground animate-fade-in-up animation-delay-3000">
                Track immigration programs and draws from coast to coast, check your eligibility score, and get personalized AI-powered guidance for every step of your journey.
            </p>
        </div>
      </div>
    </div>
  );
}
