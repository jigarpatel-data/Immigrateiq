
import { AuthForm } from "@/components/auth-form";
import { CheckCircle, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-sidebar-background text-sidebar-foreground">
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center flex-col items-center gap-4">
            <Link href="/" className="flex flex-col items-center gap-2 text-center">
               <GraduationCap className="h-16 w-16" />
               <h1 className="text-2xl font-bold">Immigrateiq</h1>
            </Link>
             <p className="text-muted-foreground text-center">
              Welcome! Please sign in or create an account to continue.
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
