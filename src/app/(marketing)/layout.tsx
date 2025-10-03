
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
                <Image src="https://firebasestorage.googleapis.com/v0/b/thecanindian.firebasestorage.app/o/android-chrome-192x192.png?alt=media&token=4e79ad3d-2db0-4b6c-bc68-efa3d2633eb8" alt="TheCanIndian Logo" width={32} height={32} />
                <span className="font-bold">TheCanIndian</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center">
              <Link href="/auth">
                <Button>Get Started Free</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
