import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-background/50 text-muted-foreground print:hidden">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row md:px-6">
        <p className="text-sm">
          © {new Date().getFullYear()} TheCanIndian. All rights reserved.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
          <Link href="#" className="transition-colors hover:text-foreground">
            About
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground">
            Contact
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
