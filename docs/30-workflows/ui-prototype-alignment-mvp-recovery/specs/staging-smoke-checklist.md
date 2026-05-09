# Staging Smoke Checklist

This file is the route source of truth for `task-05-error-boundary-and-staging-smoke`.
Other task-05 phase files must link here instead of duplicating the route table.

## Execution Contract

| Item | Value |
| --- | --- |
| Command | `mise exec -- pnpm --filter @repo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke` |
| Base URL | `STAGING_BASE_URL` must point to the Cloudflare staging deployment and must not match production hosts |
| Fixture flag | `ENABLE_STAGING_SMOKE_FIXTURE=1` is required for error-boundary fixture routes |
| Skip policy | `test.describe.skip`, `test.skip(true)`, and `it.skip` are forbidden in `apps/web/tests/e2e/staging-smoke.spec.ts` |
| Coverage | `coverage/e2e/coverage-summary.json` must keep total and task-touched `lines.pct >= 80` |

## Route Matrix

| # | Layer | Route | Expected unauth status | Expected member status | Expected admin status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | public | `/` | 200/301/302/307 | 200/301/302/307 | 200/301/302/307 | response status |
| 2 | public | `/members` | 200/301/302/307 | 200/301/302/307 | 200/301/302/307 | response status |
| 3 | public | `/members/{publicMemberId}` | 200/301/302/307/404 | 200/301/302/307/404 | 200/301/302/307/404 | response status |
| 4 | public | `/register` | 200/301/302/307 | 200/301/302/307 | 200/301/302/307 | response status |
| 5 | public | `/privacy` | 200/301/302/307 | 200/301/302/307 | 200/301/302/307 | response status |
| 6 | public | `/terms` | 200/301/302/307 | 200/301/302/307 | 200/301/302/307 | response status |
| 7 | member | `/login` | 200/301/302/307 | 200/301/302/307 | 200/301/302/307 | response status |
| 8 | member | `/profile` | 200/301/302/307/401/403 | 200/301/302/307 | 200/301/302/307 | response status |
| 9 | admin | `/admin` | 200/301/302/307/401/403 | 200/301/302/307/401/403 | 200/301/302/307 | response status |
| 10 | admin | `/admin/members` | 200/301/302/307/401/403 | 200/301/302/307/401/403 | 200/301/302/307 | response status |
| 11 | admin | `/admin/tags` | 200/301/302/307/401/403 | 200/301/302/307/401/403 | 200/301/302/307 | response status |
| 12 | admin | `/admin/meetings` | 200/301/302/307/401/403 | 200/301/302/307/401/403 | 200/301/302/307 | response status |
| 13 | admin | `/admin/schema` | 200/301/302/307/401/403 | 200/301/302/307/401/403 | 200/301/302/307 | response status |
| 14 | admin | `/admin/requests` | 200/301/302/307/401/403 | 200/301/302/307/401/403 | 200/301/302/307 | response status |
| 15 | admin | `/admin/identity-conflicts` | 200/301/302/307/401/403 | 200/301/302/307/401/403 | 200/301/302/307 | response status |
| 16 | admin | `/admin/audit` | 200/301/302/307/401/403 | 200/301/302/307/401/403 | 200/301/302/307 | response status |
| 17 | common | `/__nonexistent__` | 404 | 404 | 404 | `ページが見つかりません` visible |
| 18 | fixture | `/__smoke__/error-boundary` | 200 with boundary UI | 200 with boundary UI | 200 with boundary UI | `role="alert"` and `エラーID` visible |
| 19 | fixture | `/__smoke__/members-list` | 200/301/302/307 | 200/301/302/307 | 200/301/302/307 | list fixture response status |

## Fixture Safety Gates

- Fixture routes must be unavailable unless `ENABLE_STAGING_SMOKE_FIXTURE=1`.
- Production deploys must fail if `ENABLE_STAGING_SMOKE_FIXTURE=1` is present.
- `apps/web/tests/e2e/staging-smoke.spec.ts` must assert the flag before using fixture routes.
- Phase 9 grep gate must include fixture source files and prove production hosts are not accepted by `STAGING_BASE_URL`.
