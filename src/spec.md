# Specification

## Summary
**Goal:** Publish the owner-provided “Xocial.Stream — FAQ” copy verbatim on the in-app FAQ page.

**Planned changes:**
- Replace the existing FAQ page heading and all existing FAQ questions/answers in `frontend/src/pages/FAQPage.tsx` with the owner-provided “Xocial.Stream — FAQ” content, displayed exactly word-for-word (including punctuation, capitalization, and paragraph breaks) and in the specified question order.
- Implement a lightweight safeguard by defining the full FAQ content once as a single immutable in-file constant (single source of truth) and rendering from that constant without any transformation that could alter characters.

**User-visible outcome:** The in-app FAQ page shows the exact “Xocial.Stream — FAQ” heading and the complete FAQ accordion content exactly as provided by the owner, with no leftover prior FAQ text.
