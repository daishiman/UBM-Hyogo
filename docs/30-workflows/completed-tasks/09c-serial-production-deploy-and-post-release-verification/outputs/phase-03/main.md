# Phase 3 Output: Design Review

Status: spec_created  
Runtime evidence: pending_user_approval

## Alternatives

| Option | Summary | Pros | Cons | Spec decision |
| --- | --- | --- | --- | --- |
| A | Blue/green by promoting preview to production | Fast conceptual rollback | DNS / routing complexity and more moving parts | rejected for MVP |
| B | Canary traffic split | Limits blast radius | Split traffic setup is outside MVP and increases operational cost | rejected for MVP |
| C | In-place production deploy with rollback procedures | Matches current runbooks, simple, low free-tier overhead | All traffic receives new version until rollback | adopted |

## PASS / MINOR / MAJOR Review

| Area | A | B | C |
| --- | --- | --- | --- |
| Deploy speed | MINOR | MINOR | PASS |
| Rollback speed | PASS | MINOR | PASS |
| Free-tier overhead | MINOR | PASS | PASS |
| Operational complexity | MAJOR | MAJOR | PASS |

Adopted approach: Option C, in-place production deploy with worker / pages / D1 / cron / release-tag rollback procedures.

## Tag Strategy

| Format | Judgment | Reason |
| --- | --- | --- |
| `vYYYYMMDD-HHMM` | PASS | Unique to minute, readable, sufficient for MVP release history. |
| semver | MINOR | Valuable later, but feature-version semantics are not fixed yet. |
| `release-<n>` | MINOR | Too little chronological context. |

## 24h Verification Strategy

| Strategy | Judgment | Reason |
| --- | --- | --- |
| Manual Cloudflare dashboard check | PASS | Zero additional cost and adequate for MVP. |
| Analytics API + GitHub Actions | MINOR | Useful follow-up, not needed before first release. |
| Sentry alerting | MINOR | Requires separate integration work. |

## Invariant Review

| Invariant | Spec review result | Runtime evidence |
| --- | --- | --- |
| #4 member body not overridden in D1 | Covered by `/profile` no-edit-form smoke. | TBD at execution |
| #5 apps/web has no direct D1 access | Covered by bundle inspection. | TBD at execution |
| #10 Cloudflare free tier | Covered by 24h metrics thresholds. | TBD at execution |
| #11 admin cannot edit member body directly | Covered by admin UI smoke. | TBD at execution |
| #15 attendance duplicate prevention | Covered by post-release SQL. | TBD at execution |
