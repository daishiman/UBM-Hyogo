# outputs phase 05: ut-web-cov-01-admin-components-coverage

- status: completed
- purpose: 実装ランブック
- implementation plan:
  - add focused assertion-based tests under `apps/web/src/components/admin/__tests__/`
  - add `AdminSidebar` coverage under `apps/web/src/components/layout/__tests__/AdminSidebar.test.tsx`
  - keep production UI/API code unchanged
- execution order: helper/pure branches first, then render states, then mutation/authz branches
- verification command: `pnpm --filter @ubm-hyogo/web test:coverage`
- evidence: runtime evidence is captured in `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/vitest-run.log`, and `outputs/phase-11/coverage-target-files.txt`.
