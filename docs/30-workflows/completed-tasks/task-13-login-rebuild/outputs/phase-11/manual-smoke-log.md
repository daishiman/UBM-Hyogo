# Phase 11 Manual Smoke Log

Status: `runtime_pending`.

Local browser smoke is executed by `apps/web/playwright/tests/login-smoke.spec.ts` and saves screenshots under this directory. Staging smoke remains user-gated:

Local result: desktop Chromium 7/7 passed.

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

Then capture the 7 URLs listed in `phase-11.md`.
