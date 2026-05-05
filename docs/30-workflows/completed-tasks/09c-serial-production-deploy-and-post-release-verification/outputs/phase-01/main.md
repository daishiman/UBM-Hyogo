# Phase 1 Output: Requirements

Status: spec_created  
Runtime evidence: pending_user_approval

## Scope

09c is the final serial release gate after 09a staging green and 09b release / incident runbook handoff. It covers production deploy to `ubm-hyogo-web`, `ubm-hyogo-api`, and `ubm_hyogo_production`, release tagging, incident runbook sharing, and 24h post-release verification.

## Dependency Boundary

| 09c owns | 09c does not own |
| --- | --- |
| main merge approval and production deploy execution | staging deploy execution |
| production D1 backup, migration list/apply, and secret presence check | cron trigger design changes |
| production smoke for 10 routes and authz boundaries | application feature replacement |
| release tag `vYYYYMMDD-HHMM` and tag push | new secret registration or rotation |
| incident response runbook sharing evidence | Slack bot or email automation |
| 24h Cloudflare Analytics review | automatic alerting |

## True Questions

| Question | Decision template |
| --- | --- |
| When should production deploy run? | TBD at execution; business-hours or maintenance-window choice requires user approval. |
| Which release tag format is used? | `vYYYYMMDD-HHMM`; semver migration is a future task. |
| Is deploy frozen during the 24h verification window? | Yes, except incident hotfixes through the 09b incident path. |
| Are incident sharing destinations resolved here? | No. Use real values at execution and record them without committing secrets. |
| Are production secrets rotated here? | No. This task confirms existing required secrets only. |

## Four-Condition Assessment

| Condition | Template judgment |
| --- | --- |
| Value | PASS as a plan: production deploy + tag + verification complete the MVP release workflow. |
| Feasibility | PASS as a plan: execution is one deploy day plus a 24h observation window. |
| Consistency | PASS as a plan: scope is separated from 09a / 09b and covers invariants #4, #5, #10, #11, #15. |
| Operability | pending_user_approval: runtime operability depends on Phase 10 / 11 approval and actual evidence. |

## AC Draft

| AC | Summary | Runtime status |
| --- | --- | --- |
| AC-1 | Production D1 migrations are all Applied. | TBD at execution |
| AC-2 | Required 7 production secrets exist. | TBD at execution |
| AC-3 | API and web production deploy commands exit 0. | TBD at execution |
| AC-4 | 10 production routes satisfy 200 / authz expectations. | TBD at execution |
| AC-5 | `POST /admin/sync/schema` and `/responses` succeed and `sync_jobs` records success. | TBD at execution |
| AC-6 | Release tag `vYYYYMMDD-HHMM` is pushed to origin. | TBD at execution |
| AC-7 | Incident runbook sharing evidence is recorded. | TBD at execution |
| AC-8 | 24h Workers and D1 metrics stay below the defined thresholds. | TBD at execution |
| AC-9 | `/profile` does not provide a D1 body override form. | TBD at execution |
| AC-10 | Web build artifact has no D1 direct access import. | TBD at execution |
| AC-11 | Free-tier invariant passes on 24h metrics. | TBD at execution |
| AC-12 | Admin UI cannot directly edit member body text. | TBD at execution |

## Open Questions

All open questions are resolved at the spec level. Runtime values such as deploy window, release tag, commit hash, Slack channel, and email recipient remain `TBD at execution`.
