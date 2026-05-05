# Verify Suite

Status: spec_created  
Runtime evidence: pending_user_approval

## Pre-Deploy

| ID | Case | Expected | Runtime result |
| --- | --- | --- | --- |
| P-1 | Compare `origin/main..origin/dev` or approved PR scope. | Merge target is explicit. | TBD at execution |
| P-2 | Check 09a / 09b completion evidence. | Required upstream phases completed. | TBD at execution |
| P-3 | Export production D1 backup. | Backup file exists and size > 0. | TBD at execution |
| P-4 | Check working tree before production operations. | No unrelated uncommitted deploy changes. | TBD at execution |

## Deploy-Time

| ID | Case | Expected | Runtime result |
| --- | --- | --- | --- |
| D-1 | `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production`. | All migrations Applied. | TBD at execution |
| D-2 | API worker secret list. | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_FORM_ID`, `MAIL_PROVIDER_KEY` exist. | TBD at execution |
| D-3 | Web Pages secret list. | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` exist. | TBD at execution |
| D-4 | `pnpm --filter @ubm/api deploy:production`. | exit 0. | TBD at execution |
| D-5 | `pnpm --filter @ubm/web deploy:production`. | exit 0. | TBD at execution |

## Smoke

| ID | Case | Expected | Runtime result |
| --- | --- | --- | --- |
| S-1 | `/`, `/members`, `/members/:id` public pages. | 200 and public data rules respected. | TBD at execution |
| S-2 | `/login`. | 200 and auth entry visible. | TBD at execution |
| S-3 | Authenticated `/profile`. | 200, profile visible, D1 body edit form absent. | TBD at execution |
| S-4 | `/admin`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings`. | Admin 200, non-admin 403 or login redirect. | TBD at execution |
| S-5 | `POST /admin/sync/schema` and `POST /admin/sync/responses`. | 200 and `sync_jobs` success rows. | TBD at execution |

## Post-Release

| ID | Case | Expected | Runtime result |
| --- | --- | --- | --- |
| R-1 | Local release tag exists. | `vYYYYMMDD-HHMM` points to main release commit. | TBD at execution |
| R-2 | Remote release tag exists. | `git ls-remote --tags origin` shows the tag. | TBD at execution |
| R-3 | Incident runbook share evidence. | Slack post URL or email log recorded. | TBD at execution |
| R-4 | 24h Workers Analytics. | Requests below 5k/day MVP threshold. | TBD at execution |
| R-5 | 24h D1 metrics. | Reads/writes at or below 10% of free tier. | TBD at execution |
| R-6 | Web bundle D1 direct access scan. | `rg D1Database apps/web/.vercel/output` returns 0 hits. | TBD at execution |
| R-7 | Admin body edit check. | No direct member body edit form. | TBD at execution |
| R-8 | Attendance duplicate SQL. | 0 rows for duplicate non-deleted attendance. | TBD at execution |

## AC Mapping

| AC | Suite |
| --- | --- |
| AC-1 | D-1 |
| AC-2 | D-2, D-3 |
| AC-3 | D-4, D-5 |
| AC-4 | S-1, S-2, S-3, S-4 |
| AC-5 | S-5 |
| AC-6 | R-1, R-2 |
| AC-7 | R-3 |
| AC-8 | R-4, R-5 |
| AC-9 | S-3 |
| AC-10 | R-6 |
| AC-11 | R-5 |
| AC-12 | R-7 |
