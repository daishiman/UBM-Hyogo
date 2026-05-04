# Coverage Diff: ut-web-cov-04-admin-lib-ui-primitives-coverage

Status: PASS. Measured with `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` on 2026-05-03. The command completed 44 test files / 322 tests and generated `apps/web/coverage/coverage-summary.json`.

| File | Stmts | Branches | Funcs | Lines | AC |
| --- | --- | --- | --- | --- | --- |
| `apps/web/src/lib/admin/server-fetch.ts` | 12.5 -> 100 | n/a -> 92.85 | 0 -> 100 | 12.5 -> 100 | PASS |
| `apps/web/src/lib/admin/api.ts` | 17.24 -> 100 | n/a -> 96.77 | 0 -> 100 | 17.24 -> 100 | PASS |
| `apps/web/src/lib/admin/types.ts` | 0 -> 100 | 0 -> 100 | 0 -> 100 | 0 -> 100 | PASS |
| `apps/web/src/components/ui/Toast.tsx` | 61.53 -> 100 | n/a -> 100 | 50 -> 100 | 61.53 -> 100 | PASS |
| `apps/web/src/components/ui/Modal.tsx` | n/a -> 100 | 46.15 -> 95.23 | n/a -> 100 | n/a -> 100 | PASS |
| `apps/web/src/components/ui/Drawer.tsx` | n/a -> 100 | 64.7 -> 95.65 | n/a -> 100 | n/a -> 100 | PASS |
| `apps/web/src/components/ui/Field.tsx` | n/a -> 100 | 50 -> 100 | n/a -> 100 | n/a -> 100 | PASS |
| `apps/web/src/components/ui/Segmented.tsx` | n/a -> 100 | n/a -> 100 | 50 -> 100 | n/a -> 100 | PASS |
| `apps/web/src/components/ui/Switch.tsx` | n/a -> 100 | n/a -> 100 | 50 -> 100 | n/a -> 100 | PASS |
| `apps/web/src/components/ui/Search.tsx` | n/a -> 100 | n/a -> 100 | 66.66 -> 100 | n/a -> 100 | PASS |
| `apps/web/src/components/ui/icons.ts` | 0 -> 100 | 0 -> 100 | 0 -> 100 | 0 -> 100 | PASS |
| `apps/web/src/components/ui/index.ts` | 0 -> 100 | 0 -> 100 | 0 -> 100 | 0 -> 100 | PASS |
| `apps/web/src/lib/url/login-state.ts` | n/a -> 100 | 33.33 -> 100 | n/a -> 100 | n/a -> 100 | PASS |

## Whole apps/web Coverage Context

| Metric | Value |
| --- | --- |
| Statements | 58.67 |
| Branches | 87.74 |
| Functions | 79.01 |
| Lines | 58.67 |

The whole-app values remain below target because this workflow intentionally scopes only the 13 admin-lib / UI primitive / login-state files. Public components, auth/fetch libs, and other layer gaps are tracked by sibling coverage workflows and the wave-level follow-up.
