# Local verification summary

## Scope

This file records local, non-secret verification for `ci-staging-deploy-failure-fix`.

## Local checks

| Check | Command | Status |
| --- | --- | --- |
| focused env contract test | `mise exec -- pnpm exec vitest run apps/web/src/lib/__tests__/build-time-env.spec.ts` | PASS |
| process.env direct-reference delta gate | `git diff -U0 -- apps/web/src apps/web/app .github/workflows/web-cd.yml \| rg '^\\+.*process\\.env\\.'` | PASS (0 new hits) |
| localhost API burn-in delta gate | `git diff -U0 -- apps/web/src apps/web/app .github/workflows/web-cd.yml \| rg '^\\+.*127\\.0\\.0\\.1:8888'` | PASS (0 new hits) |
| staging build smoke | `ENVIRONMENT=staging ... mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | PASS |
| repo typecheck | `mise exec -- pnpm typecheck` | PASS |
| repo lint | `mise exec -- pnpm lint` | PASS (stablekey generated `.open-next` warnings are warning-mode; command exit 0) |
| Phase 12 compliance verifier | `mise exec -- pnpm verify:phase12-compliance` | PASS |
| artifacts parity | `cmp -s docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/artifacts.json docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/artifacts.json` | PASS |

## Boundary

`gh secret set`, Cloudflare token issuance, `git push`, and GitHub Actions runtime evidence are not local checks. They remain user-gated and are tracked in `runtime-pending-gates.md`.
