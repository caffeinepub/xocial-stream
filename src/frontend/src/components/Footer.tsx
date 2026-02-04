import { Link } from '@tanstack/react-router';

export default function Footer() {
  return (
    <footer className="border-t border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 relative">
      {/* Gradient glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/12 via-purple-500/18 to-violet-500/12 pointer-events-none" />
      
      <div className="container relative mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Tuora Systems — All rights reserved. Built by Tuora Systems
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm sm:gap-4">
            <Link
              to="/pricing"
              className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Pricing
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/terms"
              className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Terms
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/privacy"
              className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Privacy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/support"
              className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
