import { Link } from '@tanstack/react-router';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-4 bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-6xl font-bold text-transparent md:text-7xl">
          404
        </h1>
        <h2 className="mb-6 text-2xl font-semibold text-foreground md:text-3xl">
          Page Not Found
        </h2>
        <p className="mb-8 text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link to="/">
            <Home className="h-5 w-5" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
