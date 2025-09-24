
import { AuthForm } from "@/components/auth-form";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-background">
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center flex-col items-center gap-2">
            <Link href="/" className="flex flex-col items-center">
               <Image src="https://firebasestorage.googleapis.com/v0/b/thecanindian.firebasestorage.app/o/android-chrome-192x192.png?alt=media&token=4e79ad3d-2db0-4b6c-bc68-efa3d2633eb8" alt="TheCanIndian Logo" width={100} height={100} className="z-10 relative mb-[-30px]" />
               <Image src="https://firebasestorage.googleapis.com/v0/b/thecanindian.firebasestorage.app/o/Black%20background-final.png?alt=media&token=9086963b-efba-4599-8ff3-76ca37d7ba1c" alt="TheCanIndian Logo" width={180} height={72} />
            </Link>
             <p className="text-muted-foreground text-center pt-4">
              Welcome! Please sign in or create an account to continue.
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
