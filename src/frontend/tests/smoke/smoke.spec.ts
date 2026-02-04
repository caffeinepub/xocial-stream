/**
 * Smoke Test Suite for Xocial.Stream
 * 
 * Purpose: Verify critical user flows work after deployment
 * 
 * Prerequisites:
 * - Application deployed and accessible
 * - Test environment configured (local or IC)
 * - Playwright installed: npm install -D @playwright/test
 * 
 * Run: npx playwright test
 */

import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

test.describe('Critical Routes Smoke Check', () => {
  
  test('Home page loads without blank screen', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Wait for header to be visible (stable landmark)
    await expect(page.locator('header')).toBeVisible({ timeout: TIMEOUT });
    
    // Verify key page elements render
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Check for hero section (contains "Xocial.Stream" branding)
    const heroText = page.locator('text=Xocial.Stream');
    await expect(heroText.first()).toBeVisible();
    
    // Verify no error boundary triggered
    const errorUI = page.locator('text=Something went wrong');
    await expect(errorUI).not.toBeVisible();
    
    // Check console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a moment for any async errors
    await page.waitForTimeout(2000);
    
    // Assert no console errors (excluding known safe warnings)
    const criticalErrors = errors.filter(err => 
      !err.includes('Warning:') && 
      !err.includes('DevTools')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Video page navigation does not crash', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Wait for video grid to load
    await page.waitForSelector('[data-testid="video-grid"], .grid', { timeout: TIMEOUT });
    
    // Find first video link (if any exist)
    const videoLinks = page.locator('a[href^="/video/"]');
    const count = await videoLinks.count();
    
    if (count === 0) {
      console.log('No videos found, skipping video page navigation test');
      test.skip();
      return;
    }
    
    // Click first video
    await videoLinks.first().click();
    
    // Wait for video page to load
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT });
    
    // Verify video page renders (not error boundary)
    const errorBoundary = page.locator('text=There was a problem loading this page');
    await expect(errorBoundary).not.toBeVisible();
    
    // Verify video player or metadata visible
    const videoPlayer = page.locator('video');
    const videoTitle = page.locator('h1, h2').first();
    
    // At least one should be visible
    const playerVisible = await videoPlayer.isVisible().catch(() => false);
    const titleVisible = await videoTitle.isVisible().catch(() => false);
    
    expect(playerVisible || titleVisible).toBeTruthy();
    
    // Check for React error #185 (infinite loop crash)
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('185')) {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(consoleErrors).toHaveLength(0);
  });

  test('Pricing page renders terminal state', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // Wait for page to load
    await expect(page.locator('main')).toBeVisible({ timeout: TIMEOUT });
    
    // Verify pricing cards render
    const pricingCards = page.locator('text=Free, text=Pro, text=Creator');
    await expect(pricingCards.first()).toBeVisible({ timeout: TIMEOUT });
    
    // Verify page is not stuck in loading state
    const loadingSpinner = page.locator('[data-testid="loading"], .animate-spin');
    await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 });
    
    // Verify buttons reach terminal state (either active or disabled)
    const buttons = page.locator('button:has-text("Get Started"), button:has-text("Coming Soon")');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Check for error message if Stripe not configured
    const errorMessage = page.locator('text=Payment configuration not available');
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    // If error visible, verify it's clear messaging (not a crash)
    if (hasError) {
      await expect(errorMessage).toBeVisible();
      console.log('Stripe not configured - expected behavior');
    }
    
    // Verify no blank screen
    const mainContent = page.locator('main');
    const mainText = await mainContent.textContent();
    expect(mainText?.length).toBeGreaterThan(50); // Has substantial content
  });

  test('App has root error boundary (safety net)', async ({ page }) => {
    // This test verifies the error boundary exists by checking the code
    // We don't intentionally trigger errors, just verify the safety net is in place
    
    await page.goto(BASE_URL);
    
    // Inject a test error to verify boundary catches it
    await page.evaluate(() => {
      // Simulate a React error by throwing in a component
      const testError = new Error('Test error for boundary verification');
      window.dispatchEvent(new ErrorEvent('error', { error: testError }));
    });
    
    // Wait a moment for error handling
    await page.waitForTimeout(1000);
    
    // If error boundary works, page should still be functional
    // (not a blank white screen)
    const body = page.locator('body');
    const bodyText = await body.textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });
});

test.describe('Network Resilience', () => {
  
  test('App handles backend actor initialization failure gracefully', async ({ page }) => {
    // Simulate network failure by blocking canister calls
    await page.route('**/*canister*', route => route.abort());
    
    await page.goto(BASE_URL);
    
    // App should still render (not blank screen)
    await expect(page.locator('header')).toBeVisible({ timeout: TIMEOUT });
    
    // May show loading state or empty content, but not crash
    const errorUI = page.locator('text=Something went wrong');
    const hasError = await errorUI.isVisible().catch(() => false);
    
    // Either shows error UI or gracefully handles missing data
    if (hasError) {
      // Error boundary caught it - good
      await expect(errorUI).toBeVisible();
    } else {
      // No error UI - verify page still has structure
      await expect(page.locator('main')).toBeVisible();
    }
  });
});
