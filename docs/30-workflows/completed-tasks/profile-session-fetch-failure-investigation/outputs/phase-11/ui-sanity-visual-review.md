# Phase 11 UI Sanity Visual Review

## Scope

The UI change is limited to existing `SectionError` content and `data-cause` diagnostics. No new visual primitive, token, color, or layout surface was added.

## Local Review

Focused jsdom tests verify the visible messages for 410, 5xx, transport failure, 404 re-login, and 401 redirect.
Static screenshots were visually inspected:

- `profile-session-disambiguation-static-contract.png` (960 x 663): 410 / 5xx / transport failure banners render with readable labels and no overlap.
- `profile-session-disambiguation-static-page.png` (390 x 940): mobile-width layout wraps the Japanese title and body text cleanly inside each error panel.

## Pending Runtime Review

Authenticated staging screenshot capture is pending user credentials and remains user-gated.
