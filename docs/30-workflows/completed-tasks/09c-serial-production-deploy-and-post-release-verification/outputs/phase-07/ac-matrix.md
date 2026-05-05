# Acceptance Criteria Matrix

Status: spec_created  
Runtime evidence: pending_user_approval

## Positive Matrix

| AC | Content | Verify suite | Runbook step | Invariant | Runtime result |
| --- | --- | --- | --- | --- | --- |
| AC-1 | Production D1 migrations Applied. | D-1 | Step 4 / 5 | none | TBD at execution |
| AC-2 | Production secrets 7 names present. | D-2 / D-3 | Step 6 | none | TBD at execution |
| AC-3 | API and web production deploy exit 0. | D-4 / D-5 | Step 7 / 8 | none | TBD at execution |
| AC-4 | 10 route smoke and authz boundaries. | S-1 to S-4 | Step 9 | #4, #11 | TBD at execution |
| AC-5 | Manual sync success and `sync_jobs` success. | S-5 | Step 10 | none | TBD at execution |
| AC-6 | Release tag `vYYYYMMDD-HHMM` pushed. | R-1 / R-2 | Step 11 | none | TBD at execution |
| AC-7 | Incident runbook share evidence recorded. | R-3 | Step 12 | none | TBD at execution |
| AC-8 | 24h Workers and D1 metrics under thresholds. | R-4 / R-5 | Step 13 | #10 | TBD at execution |
| AC-9 | `/profile` cannot override member body in D1. | S-3 | Step 9 | #4 | TBD at execution |
| AC-10 | Web artifact has no direct D1 access. | R-6 | Step 13 | #5 | TBD at execution |
| AC-11 | Free-tier invariant passes. | R-5 | Step 13 | #10 | TBD at execution |
| AC-12 | Admin UI cannot directly edit member body. | R-7 | Step 9 | #11 | TBD at execution |

## Negative Matrix

| Failure | Detection | Runbook step | Mitigation | Invariant | Runtime result |
| --- | --- | --- | --- | --- | --- |
| F-1 main merge conflict | `gh pr merge` output | Step 1 | Rebase/fix and retry PR. | none | TBD at execution |
| F-2 upstream pending | P-2 | Step 2 | Stop 09c and return upstream. | none | TBD at execution |
| F-3 D1 backup failure | P-3 | Step 3 | Retry; do not continue without backup. | none | TBD at execution |
| F-4 migration list failure | D-1 | Step 4 | Check wrangler/account/binding. | none | TBD at execution |
| F-5 migration apply failure | D-1 related | Step 5 | Backup plus forward fix migration. | none | TBD at execution |
| F-6 secrets missing | D-2 / D-3 | Step 6 | Infrastructure secret registration. | none | TBD at execution |
| F-7 API deploy failure | D-4 | Step 7 | Return to API/deploy owner. | none | TBD at execution |
| F-8 web deploy failure | D-5 | Step 8 | Return to web/OpenNext owner. | none | TBD at execution |
| F-9 smoke failure | S-1 to S-4 | Step 9 | Owning task or API/web rollback. | #4, #11 | TBD at execution |
| F-10 manual sync failure | S-5 | Step 10 | Sync owner; pause cron if needed. | none | TBD at execution |
| F-11 release tag failure | R-1 / R-2 | Step 11 | Fix access or create new tag; no overwrite. | none | TBD at execution |
| F-12 share failure | R-3 absent | Step 12 | Resend through alternate route. | none | TBD at execution |
| F-13 24h verification breach | R-4 / R-5 / R-8 | Step 13 | Incident path, cron/query mitigation, possible API rollback. | #5, #6, #10, #15 | TBD at execution |

## Production-Specific Audit

| Item | Trace |
| --- | --- |
| Release tag | AC-6, R-1, R-2, Step 11, F-11 |
| Share evidence | AC-7, R-3, Step 12, F-12 |
| 24h Workers metrics | AC-8, R-4, Step 13, F-13 |
| 24h D1 metrics | AC-8, R-5, Step 13, F-13 |
| Web D1 direct access check | AC-10, R-6, Step 13, F-13 |
| Attendance duplicate check | R-8, Step 13, F-13 |
