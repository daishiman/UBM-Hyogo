# Issue #277 Next.js proxy migration

- State: `implemented_local / implementation / NON_VISUAL / runtime_evidence_pending`.
- Migrated the active web auth gate convention from `apps/web/middleware.ts` to `apps/web/proxy.ts` for Next.js 16.
- Added `apps/web/__tests__/proxy.spec.ts` with AC-1 through AC-7 admin/profile parity coverage.
- Added `apps/web/proxy.ts` to root/web coverage include paths via `vitest.config.ts` and `apps/web/package.json`.
- Synchronized quick-reference, resource-map, task-workflow-active, artifact inventory, auth integration, and admin UI references.
- Dev-server runtime smoke, commit, push, PR, and Issue #277 close remain user-gated.
