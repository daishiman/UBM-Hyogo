# Phase 11 Manual Smoke Log

| Item | Value |
| --- | --- |
| task type | implementation |
| visual evidence | NON_VISUAL |
| reason no screenshot | config/test/env wiring only; no UI route or rendered surface changed |
| executor | Codex local worktree |
| checked_at | 2026-05-24 |

## Local Commands

| Command | Expected | Result |
| --- | --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api test sheets-auth-healthcheck` | binding guard + healthcheck contract tests pass | PASS, log in `evidence/vitest-sheets-auth-healthcheck.log` |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | TypeScript errors 0 | PASS, log in `evidence/typecheck-api.log` |
| `mise exec -- pnpm --filter @ubm-hyogo/api lint` | TypeScript lint lane errors 0 | PASS, log in `evidence/lint-api.log` |
| `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | Wrangler accepts TOML and shows `API_INTERNAL_BASE_URL` binding | PASS, log in `evidence/wrangler-staging-dry-run.log` |
| `rg -n "API_INTERNAL_BASE_URL" apps/api/wrangler.toml apps/api/src/env.ts docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring` | production/staging vars plus spec references visible | PASS |

## Runtime Commands

| Command | Status | Reason |
| --- | --- | --- |
| `bash scripts/cf.sh secret list --env staging` | pending_user_approval | Cloudflare runtime access |
| `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | pending_user_approval | external deploy mutation |
| Workers tail alert receipt check | pending_user_approval | requires deployed Worker and controlled SA key invalidation |
