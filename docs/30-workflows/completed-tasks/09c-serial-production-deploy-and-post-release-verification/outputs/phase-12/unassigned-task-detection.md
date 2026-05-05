# Unassigned Task Detection

Status: spec_created  
Runtime evidence: pending_user_approval

## Follow-Up Candidates

| Candidate task | Handling | Formalized path |
| --- | --- | --- |
| Production deploy execution after dev -> main approval. | Required follow-up; 09c itself remains docs-only / spec_created. | `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` |
| Automate 24h Cloudflare dashboard verification with API / scheduled job. | Future task; not required for MVP. | `docs/30-workflows/unassigned-task/task-09c-post-release-dashboard-automation-001.md` |
| Auto-create GitHub Releases from release tags. | Future task; keep manual tag for MVP. | `docs/30-workflows/unassigned-task/task-09c-github-release-tag-automation-001.md` |
| Slack bot delivery for incident response runbook. | Future task; manual Slack/Email evidence is enough now. | `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md` |
| 1-week and 1-month production cost trend review. | Operational follow-up candidate. | `docs/30-workflows/unassigned-task/task-09c-long-term-production-observation-001.md` |
| Long-term Cloudflare Analytics export / retention. | Future task; evaluate free-tier and privacy constraints. | `docs/30-workflows/unassigned-task/task-09c-cloudflare-analytics-export-001.md` |
| Postmortem template automation. | Future task after first incident exercise. | `docs/30-workflows/unassigned-task/task-09c-postmortem-template-automation-001.md` |
| 08a canonical workflow tree is missing while 09c depends on the contract gate. | Large cross-workflow cleanup; do not solve inside 09c. | `docs/30-workflows/unassigned-task/task-08a-canonical-workflow-tree-restore-001.md` |

## Runtime-Driven Follow-Ups

| Trigger | Follow-up |
| --- | --- |
| Workers req exceeds 5k/day MVP threshold | Query traffic sources and cron/event volume. |
| D1 reads exceed 50k/day | Review list/detail query shape and cache strategy. |
| D1 writes exceed 10k/day | Review sync frequency and write amplification. |
| Any authz smoke failure | Open incident and return to auth/admin owner. |
| Any invariant runtime failure | Block release completion and create owner-specific fix task. |
