# 30 Workflows Log

## Latest Updates

| Date | Task | Status | Summary |
| --- | --- | --- | --- |
| 2026-04-29 | UT-26 Sheets API E2E smoke test | spec_created | Added the implementation / NON_VISUAL workflow under `docs/30-workflows/completed-tasks/ut-26-sheets-api-e2e-smoke-test/` with Phase 1-13 specs complete. Implemented dev/staging-only `/admin/smoke/sheets` route (`apps/api/src/routes/admin/smoke-sheets.ts` + unit test, production returns 404), added `getTokenFetchCount()` diagnostic to `apps/api/src/jobs/sheets-fetcher.ts` for cache verification, mounted the route with `SMOKE_ADMIN_TOKEN` env in `apps/api/src/index.ts`, and synced `aiworkflow-requirements` skill (`api-endpoints.md`, `environment-variables.md`, `topic-map.md`). Phase 13 halted at user_approval_required = true; Issue #41 stays CLOSED under "Re-link to closed issue #41" policy. |
| 2026-04-29 | UT-09 direction reconciliation | spec_created | Added docs-only / NON_VISUAL reconciliation workflow under `docs/30-workflows/ut09-direction-reconciliation/`; fixed Phase 12 close-out to treat A-maintained Forms direction as stale-withdrawal trigger when Sheets references/runtime remain, synced artifacts parity, and recorded 10 follow-up items including runtime kill-switch. |
| 2026-04-29 | ut-27-github-secrets-variables-deployment | spec_created | Added implementation / NON_VISUAL workflow for GitHub Secrets / Variables deployment. Phase 1-3 are completed, Phase 4-13 remain pending/reserved, Phase 11/13 execution artifacts are NOT EXECUTED until user approval, and aiworkflow-requirements was synced for GitHub Secrets / Variables placement and 1Password-derived copy governance. |
| 2026-04-29 | coverage-80-enforcement | implementation_started | Added coverage 80% enforcement workflow and PR1 tooling changes: `scripts/coverage-guard.sh`, Vitest coverage measurement config, package `test:coverage` scripts, CI `coverage-gate`, lefthook pre-push guard, and Phase 12 canon sync. PR/commit/push remain user-gated. |
| 2026-04-29 | UT-GOV-004 required status checks context sync | spec_created | Added docs-only / NON_VISUAL workflow under `docs/30-workflows/ut-gov-004-required-status-checks-context-sync/`; confirmed `ci`, `Validate Build`, and `verify-indexes-up-to-date` as the only rollout phase 1 required status check contexts for UT-GOV-001; kept branch protection apply gated to UT-GOV-001. |
| 2026-04-28 | ut-gov-001-github-branch-protection-apply | spec_created | Added the implementation / NON_VISUAL workflow under `docs/30-workflows/ut-gov-001-github-branch-protection-apply/`. Phase 1-3 are completed, Phase 4-13 remain pending, and destructive `gh api PUT` branch protection apply is explicitly gated behind Phase 13 user approval. |
| 2026-04-28 | skill-ledger-a1-gitignore | spec_created | Added the docs-only / NON_VISUAL workflow under `docs/30-workflows/skill-ledger-a1-gitignore/`, corrected Phase 12 artifact ledger coverage, and split hook follow-up work into `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md`. |
| 2026-04-27 | UT-12 / Cloudflare R2 storage | spec_created | Defined the R2 storage setup package under `docs/30-workflows/ut-12-cloudflare-r2-storage/`, including prod/staging bucket names, `R2_BUCKET` binding, dedicated R2 token policy, CORS policy, NON_VISUAL Phase 11 evidence, and Phase 12 handoff documents. |

## UT-12 Details

- Bucket names: `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`
- Workers binding: `R2_BUCKET`
- Adopted decisions: environment-separated buckets, dedicated R2 token, private bucket with presigned URL access
- Upstream references: `01b-parallel-cloudflare-base-bootstrap`, `04-serial-cicd-secrets-and-environment-sync`
- Related handoffs: UT-16 for production `AllowedOrigins`, UT-17 for R2 usage alerting, future file upload implementation for actual bucket creation and API logic
- Main artifact root: `docs/30-workflows/ut-12-cloudflare-r2-storage/`
