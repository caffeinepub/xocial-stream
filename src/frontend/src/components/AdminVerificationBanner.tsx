import { useEffect, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useVerifyAdminAccess } from '../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminSession } from '../lib/adminSession';

export default function AdminVerificationBanner() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading, isFetched } = useVerifyAdminAccess();
  const [dismissed, setDismissed] = useState(false);

  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString();

  useEffect(() => {
    // Reset dismissed state when user logs out or identity changes
    if (!isAuthenticated) {
      setDismissed(false);
    }
  }, [isAuthenticated]);

  // Store admin principal in local storage when verified
  useEffect(() => {
    if (isAuthenticated && isFetched && isAdmin && currentPrincipal) {
      adminSession.setAdminPrincipal(currentPrincipal);
      console.log('Admin principal stored in local storage from banner');
    }
  }, [isAuthenticated, isFetched, isAdmin, currentPrincipal]);

  // Check local storage on mount for persistent admin session
  const [hasStoredAdmin, setHasStoredAdmin] = useState(false);
  useEffect(() => {
    if (currentPrincipal) {
      const isStored = adminSession.isStoredAdmin(currentPrincipal);
      setHasStoredAdmin(isStored);
      if (isStored) {
        console.log('Admin session detected in local storage (banner)');
      }
    }
  }, [currentPrincipal]);

  // Show banner if admin is verified (either from backend or local storage)
  const showBanner = isAuthenticated && !isInitializing && (
    (isFetched && isAdmin) || hasStoredAdmin
  ) && !dismissed;

  if (!showBanner) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="relative w-full border-b bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
      <div className="container mx-auto px-4 py-3">
        <Alert className="border-primary/30 bg-primary/5 relative">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              ✓ Admin access verified – You have full administrative privileges (session persists permanently)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-primary/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
