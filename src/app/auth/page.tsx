
import { AuthForm } from "@/components/auth-form";
import { Landmark, CheckCircle } from "lucide-react";
import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center flex-col items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Landmark className="w-8 h-8 text-accent" />
              <span className="text-xl md:text-2xl font-semibold">TheCanIndian</span>
            </Link>
             <p className="text-muted-foreground text-center">
              Welcome! Please sign in or create an account to continue.
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
      <div className="hidden lg:flex flex-1 relative bg-muted items-center justify-center p-8">
        <div className="max-w-xl text-left text-foreground">
          <div className="inline-block">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground overflow-hidden whitespace-nowrap border-r-4 border-r-accent pr-4 animate-[typing_3s_steps(40,end),blink-caret_.75s_step-end_8]">
              Start Your Canadian Dream Today
            </h1>
          </div>
            <ul className="mt-6 space-y-4 text-base md:text-lg">
              <li className="flex items-start gap-3 opacity-0 animate-fade-in-up animation-delay-3000">
                <CheckCircle className="h-6 w-6 mt-1 text-accent shrink-0" />
                <span>Track immigration programs and draws from coast to coast</span>
              </li>
              <li className="flex items-start gap-3 opacity-0 animate-fade-in-up animation-delay-3500">
                <CheckCircle className="h-6 w-6 mt-1 text-accent shrink-0" />
                <span>Check & Calculate your eligibility score</span>
              </li>
              <li className="flex items-start gap-3 opacity-0 animate-fade-in-up animation-delay-4000">
                <CheckCircle className="h-6 w-6 mt-1 text-accent shrink-0" />
                <span>Get personalized AI-powered guidance for every step of your journey</span>
              </li>
            </ul>
        </div>
      </div>
    </div>
  );
}
