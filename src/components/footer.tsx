
import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-8 mt-auto border-t border-border/50 bg-background text-muted-foreground print:hidden">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row md:px-6">
        <p className="text-sm text-center sm:text-left">
          © {new Date().getFullYear()} Immigrateiq. All rights reserved.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
          <Link href="/#about" className="transition-colors hover:text-foreground">
            About
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
