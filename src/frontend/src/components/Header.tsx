import { Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Home, Upload, User, LogIn, LogOut, Shield, Settings, AlertTriangle } from 'lucide-react';
import { useVerifyAdminAccess } from '../hooks/useQueries';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { adminSession } from '../lib/adminSession';
import { useEffect, useState } from 'react';

export default function Header() {
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading } = useVerifyAdminAccess();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const currentPrincipal = identity?.getPrincipal().toString();

  // Check local storage for persistent admin session
  const [hasStoredAdmin, setHasStoredAdmin] = useState(false);
  useEffect(() => {
    if (currentPrincipal) {
      const isStored = adminSession.isStoredAdmin(currentPrincipal);
      setHasStoredAdmin(isStored);
      if (isStored) {
        console.log('Admin session detected in local storage (header)');
      }
    }
  }, [currentPrincipal]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Clear admin session from local storage on logout
      console.log('Clearing admin session on logout');
      adminSession.clearAdminPrincipal();
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  // Get principal ID and create shortened version
  const principalId = identity?.getPrincipal().toString() || '';
  const shortenedPrincipal = principalId
    ? `${principalId.slice(0, 5)}...${principalId.slice(-4)}`
    : '';

  // Show admin dropdown if admin is verified (either from backend or local storage)
  const showAdminDropdown = isAuthenticated && !isInitializing && (
    (!isAdminLoading && isAdmin === true) || hasStoredAdmin
  );

  useEffect(() => {
    if (showAdminDropdown) {
      console.log('Admin dropdown is now visible');
    }
  }, [showAdminDropdown]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-primary via-primary/95 to-primary/90 backdrop-blur supports-[backdrop-filter]:bg-primary/80">
      {/* Gradient glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/15 via-purple-500/15 to-violet-500/15 pointer-events-none" />
      
      <div className="container relative mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105">
          <img
            src="/assets/generated/xocial-stream-logo-transparent.dim_200x200.png"
            alt="Xocial.Stream"
            className="h-10 w-10 drop-shadow-lg"
          />
          <span className="text-xl font-bold text-primary-foreground">Xocial.Stream</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </Button>

          {isAuthenticated && (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              >
                <Link to="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              >
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
            </>
          )}

          {showAdminDropdown && (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              >
                <Link to="/stripe-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Stripe Settings</span>
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground mr-2 md:mr-3"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">Admin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[100]">
                  <DropdownMenuLabel className="font-semibold">Admin Panel</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/moderation" className="flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      <span>Content Moderation</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Principal ID</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {shortenedPrincipal}
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Button
            onClick={handleAuth}
            disabled={isLoggingIn}
            size="sm"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            {isLoggingIn ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="hidden sm:inline">Logging in...</span>
              </>
            ) : isAuthenticated ? (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </>
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
