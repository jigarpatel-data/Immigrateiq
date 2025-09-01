
import { AuthForm } from "@/components/auth-form";
import { Landmark } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

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
      <div className="hidden lg:flex flex-1 relative">
        <Image
          src="https://picsum.photos/1200/800"
          alt="Immigration journey"
          fill
          className="object-cover"
          data-ai-hint="canada city skyline"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
         <div className="absolute bottom-8 left-8 right-8 text-background p-4 rounded-lg bg-black/50">
          <h2 className="text-2xl font-bold text-white">Your Canadian Dream Starts Here</h2>
          <p className="text-white/80 mt-2">Track programs, check your score, and get AI-powered guidance for your immigration journey.</p>
        </div>
      </div>
    </div>
  );
}
