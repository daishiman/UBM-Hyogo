# Phase 11 Command Results

Date: 2026-05-17

## PASS

| Command | Result | Note |
| --- | --- | --- |
| `ESBUILD_BINARY_PATH="$PWD/node_modules/@esbuild/darwin-arm64/bin/esbuild" pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | PASS | 11 tests passed, including 401 redirect DI and reset |
| `ESBUILD_BINARY_PATH="$PWD/node_modules/@esbuild/darwin-arm64/bin/esbuild" pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/fetch/authed.spec.ts apps/web/src/lib/url/login-redirect.spec.ts` | PASS | 21 tests passed |
| `mise exec -- pnpm -F "@ubm-hyogo/web" typecheck` | PASS | exit 0 |
| `mise exec -- pnpm -F "@ubm-hyogo/web" lint` | PASS | exit 0 |
| `rg -n "AdminMutationHttpError|useAdminMutation\\.spec\\.tsx" apps/web/src/features/admin/hooks apps/web/src/lib/fetch` | PASS | 0 hits / exit 1 expected |

## Environment Note

Vitest requires the local esbuild binary path in this worktree because a stale platform binary can otherwise report
`Host version "0.27.3" does not match binary version "0.25.4"` before test collection.
