import { Check, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetPublicStripeConfig, useIsCallerAdmin } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    subtitle: 'Unlimited Possibility Starts Here',
    price: '$0',
    period: 'month',
    description: 'Unlimited possibility begins with your first upload.',
    features: [
      '10 uploads per month',
      '720p streaming',
      'Basic player',
      'Community access (comments and likes)',
    ],
    isFree: true,
  },
  {
    name: 'Pro',
    subtitle: 'Unlimited Video. One Simple Price.',
    price: '$12.99',
    period: 'month',
    description: 'Finally, a video platform without storage anxiety. Unlimited video. One simple price.',
    features: [
      'Unlimited uploads',
      'Unlimited storage',
      'Full‑quality streaming (1080p/4K)',
      'No ads',
      'No weekly limits',
      'No compression loss',
      'Direct video links',
      'Embeds for websites',
    ],
    popular: true,
    urlKey: 'proPlanUrl' as const,
  },
  {
    name: 'Creator Plus',
    subtitle: 'Unlimited Power for Serious Creators',
    price: '$24.99',
    period: 'month',
    description: 'Unlimited tools. Unlimited control.',
    features: [
      'Everything in Pro',
      'Custom branding',
      'Private collections',
    ],
    urlKey: 'creatorPlanUrl' as const,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { data: stripeConfig, isLoading: isLoadingStripe, error } = useGetPublicStripeConfig();
  const { data: isAdmin } = useIsCallerAdmin();

  const handlePlanClick = (
    planName: string,
    isFree?: boolean,
    urlKey?: 'proPlanUrl' | 'creatorPlanUrl'
  ) => {
    // Free plan is always available - no Stripe configuration needed
    if (isFree) {
      return;
    }

    // For paid plans, check Stripe configuration
    if (isLoadingStripe) {
      return;
    }

    if (!stripeConfig || !urlKey) {
      return;
    }

    // Get the checkout URL for this paid plan and trim whitespace
    const checkoutUrl = stripeConfig[urlKey]?.trim();

    // Check if URL is empty or missing
    if (!checkoutUrl || checkoutUrl.length === 0) {
      return;
    }

    console.log(`✅ Redirecting to ${planName} checkout:`, checkoutUrl);
    window.location.href = checkoutUrl;
  };

  // Check if Stripe is fully configured for paid plans (trim and check length)
  const proPlanUrlTrimmed = stripeConfig?.proPlanUrl?.trim();
  const creatorPlanUrlTrimmed = stripeConfig?.creatorPlanUrl?.trim();
  const isStripeConfigured = 
    proPlanUrlTrimmed && proPlanUrlTrimmed.length > 0 && 
    creatorPlanUrlTrimmed && creatorPlanUrlTrimmed.length > 0;
  const hasConfigError = !!error || (!isLoadingStripe && !isStripeConfigured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl">
            Start Free, Grow Limitless. Plans and Pricing Made Simple.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Choose the perfect plan for your creative journey on Xocial.Stream
          </p>
        </div>

        {/* Live Configuration Status */}
        {!isLoadingStripe && isStripeConfigured && (
          <Alert className="mx-auto mb-8 max-w-3xl border-primary/30 bg-primary/5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              <strong>Live Stripe Configuration Active</strong> – All payment plans are connected to live checkout. Pro and Creator Plus plans are ready for immediate subscription.
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Error Alert */}
        {hasConfigError && (
          <Alert className="mx-auto mb-8 max-w-3xl border-destructive/30 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>Payment Configuration Unavailable</strong> – Paid plan checkout is currently not available. 
              {error && ' Unable to load payment configuration.'}
              {!error && !isStripeConfigured && ' Payment URLs are not configured.'}
              {isAdmin && (
                <Button
                  variant="link"
                  className="ml-2 h-auto p-0 text-destructive underline"
                  onClick={() => navigate({ to: '/stripe-settings' })}
                >
                  <Settings className="mr-1 h-3 w-3" />
                  Configure Stripe Settings
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isPaidPlan = !plan.isFree;
            const isDisabled = isPaidPlan && (isLoadingStripe || hasConfigError);
            const checkoutUrl = plan.urlKey && stripeConfig ? stripeConfig[plan.urlKey]?.trim() : null;
            const hasValidUrl = checkoutUrl && checkoutUrl.length > 0;

            return (
              <Card
                key={plan.name}
                className={`relative flex flex-col transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20'
                    : 'border-primary/20 hover:border-primary/40'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary px-4 py-1 text-sm font-semibold text-primary-foreground shadow-md">
                    Most Popular
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  {plan.subtitle && (
                    <p className="text-sm font-medium text-primary">{plan.subtitle}</p>
                  )}
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-4xl font-bold text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">/ {plan.period}</span>
                  </div>
                  <CardDescription className="mt-3 text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-primary via-primary/90 to-primary text-base font-semibold shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                    size="lg"
                    onClick={() => handlePlanClick(plan.name, plan.isFree, plan.urlKey)}
                    disabled={isDisabled || (isPaidPlan && !hasValidUrl)}
                  >
                    {isLoadingStripe && isPaidPlan
                      ? 'Loading...'
                      : isDisabled || (isPaidPlan && !hasValidUrl)
                        ? 'Unavailable'
                        : plan.isFree
                          ? 'Get Started Free'
                          : `Choose ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <p className="text-sm text-muted-foreground">
            All plans include access to our vibrant community and commitment to ethical content sharing.
            By subscribing, you agree to our{' '}
            <a href="/policy" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
              Community & Ethics Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
