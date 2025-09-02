
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
        <div className="max-w-md text-center animate-fade-in-up">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Your Canadian Dream Starts Here</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Track programs, track all draws from east coast to west, check your score, and get AI-powered guidance for your immigration journey.
            </p>
        </div>
      </div>
    </div>
  );
}
