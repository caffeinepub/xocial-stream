import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, ErrorComponent } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Component, ErrorInfo, ReactNode } from 'react';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import VideoPage from './pages/VideoPage';
import ProfilePage from './pages/ProfilePage';
import PolicyPage from './pages/PolicyPage';
import PricingPage from './pages/PricingPage';
import TempStripeSettingsPage from './pages/TempStripeSettingsPage';
import BannedWordsAdminPage from './pages/BannedWordsAdminPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import SupportPage from './pages/SupportPage';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import AdminVerificationBanner from './components/AdminVerificationBanner';
import VideoRouteErrorBoundary from './components/VideoRouteErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';

// Root-level error boundary to prevent blank screens
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App-level error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="mb-6 text-muted-foreground">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AdminVerificationBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ProfileSetupModal />
      <Toaster />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Navigation Error</h1>
        <p className="mb-6 text-muted-foreground">
          There was a problem loading this page.
        </p>
        <Button onClick={() => window.location.href = '/'}>
          Go to Home
        </Button>
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Error details
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
            {error?.toString()}
          </pre>
        </details>
      </div>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/upload',
  component: UploadPage,
});

const videoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/video/$videoId',
  component: VideoPage,
  errorComponent: ({ error }) => <VideoRouteErrorBoundary error={error} />,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const policyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/policy',
  component: PolicyPage,
});

const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pricing',
  component: PricingPage,
});

const tempStripeSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stripe-settings',
  component: TempStripeSettingsPage,
});

const moderationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/moderation',
  component: BannedWordsAdminPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/terms',
  component: TermsPage,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy',
  component: PrivacyPage,
});

const supportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/support',
  component: SupportPage,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  uploadRoute,
  videoRoute,
  profileRoute,
  policyRoute,
  pricingRoute,
  tempStripeSettingsRoute,
  moderationRoute,
  termsRoute,
  privacyRoute,
  supportRoute,
  notFoundRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
