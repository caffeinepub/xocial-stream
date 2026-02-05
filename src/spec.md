# Specification

## Summary
**Goal:** Prevent VideoPage zoom (pinch/pan and custom zoom controls) from activating by default, and require an explicit user action to enable zoom mode.

**Planned changes:**
- Gate VideoPage zoom functionality behind a dedicated “Enable zoom” / “Disable zoom” toggle on touch (coarse pointer) devices.
- Ensure that on initial VideoPage render and on a normal first tap (to show native video controls), zoom mode stays OFF and custom zoom controls remain hidden/inactive.
- When zoom mode is OFF, do not opt the video container into zoom behavior (no `data-allow-zoom="true"` and no `touch-action: none` for coarse-pointer devices); when ON, opt into the existing zoom mechanism and attach the existing pinch/pan handlers.
- Add or extend a Playwright UI test to verify zoom controls are not visible/usable by default and only become visible/usable after enabling zoom mode (using stable selectors such as `data-testid`).

**User-visible outcome:** Videos open and play normally without zoom interactions; on touch devices, users can explicitly enable zoom to access pinch-to-zoom/pan and zoom controls, and disable it to return to normal behavior.
