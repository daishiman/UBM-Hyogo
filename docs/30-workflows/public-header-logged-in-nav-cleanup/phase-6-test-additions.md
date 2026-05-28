# Phase 6 — Test Additions

## Added Test Contract

- `src/lib/auth-view/__tests__/resolveAuthView.spec.ts`: 4 required cases plus fail-closed-adjacent malformed session cases if implementation needs them.
- `src/components/public/__tests__/PublicHeader.spec.tsx`: async render pattern with injected `authView`.
- `app/__tests__/page.spec.tsx`: root page guest/member smoke with heavy data-fetch mocks.
- `app/privacy/__tests__/page.spec.tsx` and `app/terms/__tests__/page.spec.tsx`: legal content plus public shell.
- `src/lib/url/__tests__/safeNext.spec.ts`: 10 open-redirect guard cases.
- `app/login/__tests__/page.spec.tsx`: guest regression and logged-in redirects.
- `src/components/layout/__tests__/MemberHeader.spec.tsx`: admin CTA conditional rendering.
- `src/components/layout/__tests__/AdminSidebar.spec.tsx` or `AdminSidebar.component.spec.tsx`: public-return and existing admin nav regression.
- `playwright/tests/auth-slot-coverage.spec.ts`: 21 route/state checks plus admin public-return smoke.

## Current Boundary

Tests are specified but not executed in this spec-improvement wave because apps/web implementation has not been applied yet. Running them before code exists would produce expected red, not useful evidence.
