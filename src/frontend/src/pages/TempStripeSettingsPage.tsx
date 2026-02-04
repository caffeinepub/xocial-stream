import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetFullStripeConfig, useUpdateStripeConfig, useVerifyAdminAccess } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X, Lock, ShieldCheck, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminSession } from '../lib/adminSession';

export default function TempStripeSettingsPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading } = useVerifyAdminAccess();
  const { data: savedConfig, isLoading: isLoadingConfig } = useGetFullStripeConfig();
  const saveConfig = useUpdateStripeConfig();

  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [basicPlanUrl, setBasicPlanUrl] = useState('');
  const [creatorPlanUrl, setCreatorPlanUrl] = useState('');
  const [proPlanUrl, setProPlanUrl] = useState('');

  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString();

  // Check local storage for persistent admin session
  const [hasStoredAdmin, setHasStoredAdmin] = useState(false);
  useEffect(() => {
    if (currentPrincipal) {
      setHasStoredAdmin(adminSession.isStoredAdmin(currentPrincipal));
    }
  }, [currentPrincipal]);

  // Load saved configuration when available
  useEffect(() => {
    if (savedConfig) {
      console.log('✅ Loading saved Stripe configuration into form fields');
      setPublishableKey(savedConfig.publishableKey || '');
      setSecretKey(savedConfig.secretKey || '');
      setBasicPlanUrl(savedConfig.basicPlanUrl || '');
      setCreatorPlanUrl(savedConfig.creatorPlanUrl || '');
      setProPlanUrl(savedConfig.proPlanUrl || '');
    }
  }, [savedConfig]);

  const handleSave = async () => {
    try {
      // Build partial update payload - only include non-empty fields
      const configToSave: any = {
        subscriptionsEnabled: true,
        defaultPricing: undefined,
      };

      // Only include fields that have values (partial update)
      if (publishableKey.trim()) configToSave.publishableKey = publishableKey.trim();
      if (secretKey.trim()) configToSave.secretKey = secretKey.trim();
      if (basicPlanUrl.trim()) configToSave.basicPlanUrl = basicPlanUrl.trim();
      if (creatorPlanUrl.trim()) configToSave.creatorPlanUrl = creatorPlanUrl.trim();
      if (proPlanUrl.trim()) configToSave.proPlanUrl = proPlanUrl.trim();

      console.log('Saving Stripe configuration (partial update):', configToSave);
      await saveConfig.mutateAsync(configToSave);
      toast.success('✅ Stripe configuration saved successfully');
    } catch (error) {
      console.error('Error saving Stripe configuration:', error);
      toast.error('Failed to save Stripe configuration');
    }
  };

  const handleClearField = (field: 'publishableKey' | 'secretKey' | 'basicPlanUrl' | 'creatorPlanUrl' | 'proPlanUrl') => {
    const fieldNames = {
      publishableKey: 'Publishable Key',
      secretKey: 'Secret Key',
      basicPlanUrl: 'Basic Plan URL',
      creatorPlanUrl: 'Creator Plan URL',
      proPlanUrl: 'Pro Plan URL',
    };

    if (confirm(`Are you sure you want to clear the ${fieldNames[field]}? This will remove it from backend storage.`)) {
      // Set to empty string to clear in UI
      switch (field) {
        case 'publishableKey':
          setPublishableKey('');
          break;
        case 'secretKey':
          setSecretKey('');
          break;
        case 'basicPlanUrl':
          setBasicPlanUrl('');
          break;
        case 'creatorPlanUrl':
          setCreatorPlanUrl('');
          break;
        case 'proPlanUrl':
          setProPlanUrl('');
          break;
      }

      // Save immediately with empty string to clear backend value
      const clearPayload: any = {
        subscriptionsEnabled: true,
        defaultPricing: undefined,
        [field]: '', // Empty string signals explicit clear
      };

      saveConfig.mutateAsync(clearPayload).then(() => {
        toast.success(`${fieldNames[field]} cleared successfully`);
      }).catch((error) => {
        console.error(`Error clearing ${field}:`, error);
        toast.error(`Failed to clear ${fieldNames[field]}`);
      });
    }
  };

  const handleCancel = () => {
    navigate({ to: '/' });
  };

  // Determine if user has admin access (from backend or local storage)
  const hasAdminAccess = isAdmin === true || hasStoredAdmin;

  // Check if configuration is fully restored
  const isFullyConfigured = savedConfig?.publishableKey && savedConfig?.secretKey && 
                            savedConfig?.basicPlanUrl && savedConfig?.creatorPlanUrl && 
                            savedConfig?.proPlanUrl;

  // Show loading state while checking authentication and admin status
  if (!isAuthenticated || isAdminLoading || isLoadingConfig) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!hasAdminAccess) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              Only administrators can access Stripe settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: '/' })} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="mb-2 bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-4xl font-bold text-transparent">
            Stripe Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your Stripe API keys and checkout URLs for payment processing.
          </p>
        </div>

        {hasStoredAdmin && (
          <Alert className="mb-6 border-primary/30 bg-primary/5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              <strong>Persistent Admin Session Active</strong> – Your admin privileges are stored locally and remain active across page refreshes and rebuilds.
            </AlertDescription>
          </Alert>
        )}

        {isFullyConfigured && (
          <Alert className="mb-6 border-green-500/30 bg-green-500/5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              <strong>✅ Live Stripe Configuration Restored</strong> – All API keys and checkout URLs are loaded from backend storage and ready for use. The Pricing page is now connected to live Stripe checkout.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Enter your Stripe publishable and secret keys. These are required for payment processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="publishableKey">Publishable Key</Label>
                {publishableKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearField('publishableKey')}
                    className="h-auto p-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Input
                id="publishableKey"
                type="text"
                placeholder="pk_live_..."
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                disabled={isLoadingConfig}
                className={publishableKey ? 'border-green-500/50' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Your Stripe publishable key (starts with pk_)
                {publishableKey && <span className="ml-2 text-green-600">✓ Loaded</span>}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="secretKey">Secret Key</Label>
                {secretKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearField('secretKey')}
                    className="h-auto p-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Input
                id="secretKey"
                type="password"
                placeholder="sk_live_..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={isLoadingConfig}
                className={secretKey ? 'border-green-500/50' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Your Stripe secret key (starts with sk_)
                {secretKey && <span className="ml-2 text-green-600">✓ Loaded</span>}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Checkout URLs</CardTitle>
            <CardDescription>
              Enter the Stripe Checkout URLs for each subscription plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="basicPlanUrl">Basic Plan URL</Label>
                {basicPlanUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearField('basicPlanUrl')}
                    className="h-auto p-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Input
                id="basicPlanUrl"
                type="text"
                placeholder="https://buy.stripe.com/..."
                value={basicPlanUrl}
                onChange={(e) => setBasicPlanUrl(e.target.value)}
                disabled={isLoadingConfig}
                className={basicPlanUrl ? 'border-green-500/50' : ''}
              />
              {basicPlanUrl && <p className="text-xs text-green-600">✓ Loaded from backend</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="creatorPlanUrl">Creator Plan URL</Label>
                {creatorPlanUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearField('creatorPlanUrl')}
                    className="h-auto p-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Input
                id="creatorPlanUrl"
                type="text"
                placeholder="https://buy.stripe.com/..."
                value={creatorPlanUrl}
                onChange={(e) => setCreatorPlanUrl(e.target.value)}
                disabled={isLoadingConfig}
                className={creatorPlanUrl ? 'border-green-500/50' : ''}
              />
              {creatorPlanUrl && <p className="text-xs text-green-600">✓ Loaded from backend</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="proPlanUrl">Pro Plan URL</Label>
                {proPlanUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearField('proPlanUrl')}
                    className="h-auto p-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Input
                id="proPlanUrl"
                type="text"
                placeholder="https://buy.stripe.com/..."
                value={proPlanUrl}
                onChange={(e) => setProPlanUrl(e.target.value)}
                disabled={isLoadingConfig}
                className={proPlanUrl ? 'border-green-500/50' : ''}
              />
              {proPlanUrl && <p className="text-xs text-green-600">✓ Loaded from backend</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saveConfig.isPending || isLoadingConfig}
            className="flex-1"
          >
            {saveConfig.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>

          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={saveConfig.isPending}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
