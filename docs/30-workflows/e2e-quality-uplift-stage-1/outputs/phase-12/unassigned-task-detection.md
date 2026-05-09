# Unassigned Task Detection

Result: 0 new unassigned tasks.

Rationale:

- U-1 public-flow email leak assertion is implemented in `apps/web/playwright/tests/public-flow.spec.ts`.
- U-2 visibility pending sticky assertion is implemented in `apps/web/playwright/tests/profile-visibility-request.spec.ts`.
- U-3 delete pending sticky assertion is implemented in `apps/web/playwright/tests/profile-delete-request.spec.ts`.
- U-4 Playwright fixture `signSession()` hardening is implemented in `apps/web/playwright/fixtures/auth.ts` via shared JWT signing. Production Auth.js hardening remains outside Stage 1 and is not a newly discovered task.
