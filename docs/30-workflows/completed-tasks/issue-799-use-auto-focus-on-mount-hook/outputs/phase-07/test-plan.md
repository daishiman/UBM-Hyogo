# Phase 07 Test Plan

The focused test plan covers:

- hook unit behavior: mount focus, null ref noop, rerender no refocus
- root route error component regression
- login/profile/admin error boundary focus transfer and reset buttons
- package-level web test run as local regression evidence

Expected command:

```bash
pnpm --filter @ubm-hyogo/web test -- --reporter=verbose \
  apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx \
  apps/web/app/__tests__/error.component.spec.tsx \
  apps/web/app/login/__tests__/error.component.spec.tsx \
  apps/web/app/profile/__tests__/error.component.spec.tsx \
  "apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx"
```
