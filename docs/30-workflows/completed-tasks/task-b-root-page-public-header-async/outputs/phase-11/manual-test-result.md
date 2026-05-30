# Phase 11 Manual Test Result

| Item | Result |
| --- | --- |
| workflow | `task-b-root-page-public-header-async` |
| date | 2026-05-28 |
| environment | local worktree |
| status | `implemented_local_evidence_captured` |

## Local Evidence

| Gate | Command | Result |
| --- | --- | --- |
| focused Vitest | `mise exec -- pnpm exec vitest run apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts apps/web/src/components/public/__tests__/PublicHeader.spec.tsx apps/web/app/__tests__/page.spec.tsx` | PASS: 3 files / 9 tests |
| typecheck | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |
| web build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | PASS |

## Runtime Boundary

Cloudflare staging deploy, authenticated `/` curl, wrangler tail clean evidence,
commit, push, and PR remain user-gated.
