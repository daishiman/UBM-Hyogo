# Documentation Changelog

## 2026-05-15

- Reclassified the workflow from `spec_created` to `implemented_local_runtime_pending` because the same cycle includes `apps/web` implementation changes.
- Added Phase 12 strict 7 physical files for the implemented-local workflow package.
- Clarified suffix policy: component/unit specs use `.spec.tsx`; Playwright specs use `.spec.ts`.
- Moved Phase 11 PNG physical-existence gate out of Phase 10 and into Phase 11/12.
- Replaced stale primary CTA examples with current utilities (`bg-accent text-panel`).
- Formalized `admin/loading` as out-of-scope for this task.
- Added local Playwright visual harness and screenshot evidence paths for Phase 11.
- Registered the workflow in aiworkflow-requirements ledgers as `implemented_local_runtime_pending / implementation / VISUAL`.

## Commands

```bash
git status --short
git diff --stat
pnpm verify:phase12-compliance docs/30-workflows/task-parallel-07-auth-and-shared
pnpm --filter @ubm-hyogo/web test -- apps/web/app/login/__tests__/login-error.component.spec.tsx apps/web/app/__tests__/error.component.spec.tsx apps/web/app/profile/__tests__/profile-loading.component.spec.tsx
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/task-parallel-07-auth-and-shared/outputs/phase-11 pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/auth-and-shared.spec.ts --project=desktop-chromium
```
