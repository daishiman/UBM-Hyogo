# Production Release Summary

Status: spec_created  
Runtime evidence: pending_user_approval

## Release Information

| Field | Value |
| --- | --- |
| Release datetime | TBD at execution |
| Release tag | TBD at execution |
| Main commit | TBD at execution |
| Production web URL | `${PRODUCTION_WEB}` |
| Production API URL | `${PRODUCTION_API}` |
| D1 database | `${PRODUCTION_D1}` |

## 24h Metrics

| Metric | Runtime value | Threshold | Judgment |
| --- | --- | --- | --- |
| Workers requests | TBD at execution | < 5k/day MVP threshold | TBD at execution |
| D1 reads | TBD at execution | <= 50k/day | TBD at execution |
| D1 writes | TBD at execution | <= 10k/day | TBD at execution |

## Runtime Evidence Links

| Evidence | Path / URL |
| --- | --- |
| Production smoke runbook | `outputs/phase-11/production-smoke-runbook.md` |
| Release tag evidence | `outputs/phase-11/release-tag-evidence.md` |
| Share evidence | `outputs/phase-11/share-evidence.md` |
| Workers dashboard screenshot | TBD at execution |
| D1 dashboard screenshot | TBD at execution |
| Bundle scan output | TBD at execution |
| Attendance duplicate SQL output | TBD at execution |

## Invariant 24h Checks

| Invariant | Runtime judgment |
| --- | --- |
| #5 apps/web no direct D1 access | TBD at execution |
| #10 Cloudflare free tier | TBD at execution |
| #15 attendance duplicate prevention | TBD at execution |

## Follow-Up Observations

| Timing | Item | Status |
| --- | --- | --- |
| 1 week after release | D1 read/write trend review. | unassigned candidate |
| 1 month after release | Cron frequency and query cost review. | unassigned candidate |
| periodic | Incident response runbook exercise. | unassigned candidate |

Do not label this release complete until the runtime evidence fields are filled.
