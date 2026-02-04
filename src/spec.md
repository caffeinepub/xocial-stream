# Specification

## Summary
**Goal:** Remove the FAQ page entirely and eliminate all UI navigation links that point to it.

**Planned changes:**
- Delete the `/faq` route from the frontend route tree and remove the `FAQPage` import/usage so the app no longer registers or serves an FAQ page.
- Remove all UI links to `/faq`, including the Footer FAQ link and any Support page link pointing to `/faq`.
- Ensure that directly visiting `/faq` no longer shows FAQ content and instead results in a not-found experience or a redirect to the home page.

**User-visible outcome:** The app no longer has an FAQ page; users won’t see any FAQ navigation links, and visiting `/faq` will not display FAQ content (it will redirect home or show a not-found page with a way back to Home).
