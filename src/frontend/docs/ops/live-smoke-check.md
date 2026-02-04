# Live Smoke Check Procedure

## Purpose
This checklist verifies that critical user flows work correctly after a rebuild or deployment.

## Prerequisites
- Application is deployed and accessible via live URL
- Browser with DevTools available
- Test user account (Internet Identity) ready
- Admin account available for admin-only checks

## Critical Routes Smoke Check

### 1. Home Page (`/`)
**Expected Behavior:**
- Page loads without blank screen
- Header with Xocial.Stream branding visible
- Hero banner displays
- Featured videos section renders (may be empty)
- Search bar and category filters visible
- Footer with links visible

**Failure Indicators:**
- Blank white screen
- "Something went wrong" error UI
- Console errors in DevTools
- Infinite loading spinner

**How to Check:**
1. Navigate to `/` (home route)
2. Wait 3 seconds for content to load
3. Verify header, hero, and footer are visible
4. Check browser console for errors (should be none)

---

### 2. Video Page (`/video/:id`)
**Expected Behavior:**
- Video player renders
- Video metadata (title, description) displays
- Comments section visible
- Like button functional
- No React error boundary triggered
- VideoRouteErrorBoundary NOT visible during normal use

**Failure Indicators:**
- VideoRouteErrorBoundary fallback UI appears
- Blank screen or infinite loading
- Console error: "React Error #185" or similar
- Video player fails to initialize

**How to Check:**
1. From home page, click any video thumbnail
2. Wait for video page to load
3. Verify video player and metadata render
4. Check that VideoRouteErrorBoundary is NOT visible
5. Verify browser console has no React errors
6. Test video playback (play/pause)

**Known Issue:**
- If VideoRouteErrorBoundary appears during normal navigation, this indicates a regression in the progress-save implementation (see [react-185-video-page-crash.md](../dev-notes/react-185-video-page-crash.md))

---

### 3. Pricing Page (`/pricing`)
**Expected Behavior:**
- Page loads without blank screen
- Three pricing tiers visible (Free, Pro, Creator Plus)
- Buttons show one of:
  - "Get Started" (active, clickable) if Stripe configured
  - "Coming Soon" (disabled) if Stripe not configured
- Clear messaging if payment unavailable
- No infinite loading state

**Failure Indicators:**
- Blank screen
- Infinite loading spinner
- "Loading..." text never resolves
- Console error from `useGetPublicStripeConfig`

**How to Check:**
1. Navigate to `/pricing`
2. Wait 3 seconds for content to load
3. Verify pricing cards render
4. Check button states (active or disabled)
5. If Stripe disconnected, verify "Payment configuration not available" message
6. Confirm page reaches terminal state (not stuck loading)

**Stripe Configuration Note:**
- After rebuild, Stripe may appear disconnected in UI
- This is a known issue (frontend-backend state desync)
- Admin must re-save Stripe settings to reconnect
- See main conversation for reconnection procedure

---

## Optional: Admin-Only Checks

### 4. Admin Dropdown Menu
**Expected Behavior:**
- Admin dropdown visible in header (if logged in as admin)
- "Content Moderation" link present
- "Payment Settings" link present

**How to Check:**
1. Log in as admin (Internet Identity)
2. Click admin dropdown in header
3. Verify links are present and clickable

---

### 5. Stripe Settings Page (`/stripe-settings`)
**Expected Behavior:**
- Form fields for Stripe keys and URLs
- "Reload from Backend" button functional
- Saved values load from backend on mount

**How to Check:**
1. Navigate to `/stripe-settings` as admin
2. Verify form renders
3. Click "Reload from Backend"
4. Check that saved values populate fields

---

## Automated Smoke Test (Future)
See `frontend/tests/smoke/smoke.spec.ts` for automated browser test skeleton.

**Note:** Automated tests are not yet implemented. Manual checks above are required.

---

## Success Criteria
- [ ] Home page loads and renders content
- [ ] Video page navigation works without error boundary
- [ ] Pricing page reaches terminal state (not stuck loading)
- [ ] No blank screens on any critical route
- [ ] No React errors in browser console
- [ ] VideoRouteErrorBoundary not triggered during normal use

## Failure Response
If any check fails:
1. Note the exact failure (screenshot + console errors)
2. Check [rebuild-republish-runbook.md](./rebuild-republish-runbook.md) troubleshooting section
3. Attempt recovery actions (hard refresh, clear cache, redeploy)
4. If issue persists, investigate root cause in code
