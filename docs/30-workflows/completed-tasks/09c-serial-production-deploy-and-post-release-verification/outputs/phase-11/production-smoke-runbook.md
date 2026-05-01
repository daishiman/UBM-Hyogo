# Production Smoke Runbook

Status: spec_created  
Runtime evidence: pending_user_approval

## Execution Log

| Step | Operation | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| 1 | main checkout and pull | latest approved main commit | TBD at execution | TBD |
| 2 | 09a / 09b completion check | required handoff completed | TBD at execution | TBD |
| 3 | production D1 backup | backup file size > 0 | TBD at execution | TBD |
| 4 | migration list | all Applied | TBD at execution | TBD |
| 5 | migration apply | exit 0 | TBD at execution | TBD |
| 6 | secret list checks | required 7 names present | TBD at execution | TBD |
| 7 | API deploy | exit 0 | TBD at execution | TBD |
| 8 | Web deploy | exit 0 | TBD at execution | TBD |
| 9 | 10 route smoke | expected status/authz | TBD at execution | TBD |
| 10 | manual sync trigger | `sync_jobs.success` | TBD at execution | TBD |
| 11 | release tag | local and remote tag exist | TBD at execution | TBD |
| 12 | incident runbook share | receipt evidence recorded | TBD at execution | TBD |
| 13 | 24h verify | metrics and invariants satisfy thresholds | TBD at execution | TBD |

## Route Smoke Checklist

| Route / operation | Expected | Result |
| --- | --- | --- |
| `${PRODUCTION_WEB}/` | landing page visible | TBD at execution |
| `${PRODUCTION_WEB}/members` | public-consented members only | TBD at execution |
| `${PRODUCTION_WEB}/members/sample-id` | public fields only | TBD at execution |
| `${PRODUCTION_WEB}/login` | auth entry visible | TBD at execution |
| `${PRODUCTION_WEB}/profile` unauthenticated | redirects to login | TBD at execution |
| `${PRODUCTION_WEB}/profile` authenticated | profile visible, editResponseUrl CTA, no body edit form | TBD at execution |
| `${PRODUCTION_WEB}/admin` admin | dashboard visible | TBD at execution |
| `${PRODUCTION_WEB}/admin` member | 403 or login redirect | TBD at execution |
| `${PRODUCTION_WEB}/admin/members` | drawer/status visible, no direct member body edit form | TBD at execution |
| `${PRODUCTION_WEB}/admin/tags` | queue UI visible | TBD at execution |
| `${PRODUCTION_WEB}/admin/schema` | diff / alias UI visible | TBD at execution |
| `${PRODUCTION_WEB}/admin/meetings` | meeting session UI visible and duplicate prevention observable | TBD at execution |

## Manual Sync Checklist

| Operation | Expected | Result |
| --- | --- | --- |
| `POST ${PRODUCTION_API}/admin/sync/schema` | 200 and job success | TBD at execution |
| `POST ${PRODUCTION_API}/admin/sync/responses` | 200 and job success | TBD at execution |
| `sync_jobs` query | latest jobs show `success` | TBD at execution |
| `bash scripts/cf.sh tail` 30 min | no unhandled production errors; no secret leakage | TBD at execution |

## Evidence Checklist

- [ ] user approval gate 2/3 recorded
- [ ] 13-step execution log completed
- [ ] desktop and mobile screenshots recorded
- [ ] AuthGateState screenshots recorded
- [ ] `sync-jobs-production.json` captured
- [ ] `wrangler-tail-production.log` captured
- [ ] release tag evidence captured
- [ ] share evidence captured
- [ ] 24h metric evidence captured
- [ ] invariant #5 bundle scan captured
- [ ] invariant #15 attendance SQL captured
