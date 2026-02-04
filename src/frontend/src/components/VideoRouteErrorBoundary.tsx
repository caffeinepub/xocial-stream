import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home } from 'lucide-react';

interface VideoRouteErrorBoundaryProps {
  error: Error;
  reset?: () => void;
}

export default function VideoRouteErrorBoundary({ error }: VideoRouteErrorBoundaryProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate({ to: '/' });
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="mx-auto max-w-md border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We encountered an error while loading this video page. Please try returning to the home page.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="rounded-lg bg-muted p-3 text-xs">
              <summary className="cursor-pointer font-medium">Error details</summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
                {error.message}
              </pre>
            </details>
          )}
          <Button onClick={handleGoHome} className="w-full gap-2">
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
