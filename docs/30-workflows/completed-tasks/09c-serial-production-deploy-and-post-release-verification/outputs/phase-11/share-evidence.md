# Incident Response Runbook Share Evidence

Status: spec_created  
Runtime evidence: pending_user_approval

## Share Targets

| Channel | Value |
| --- | --- |
| Slack dry-run | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json` |
| Slack production | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-production.json` |
| Recipients | `#ubm-hyogo-incident-runbook` after `production-slack-delivery` approval |

## Shared Content

| Item | Value |
| --- | --- |
| Incident runbook | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/incident-response-runbook.md` |
| Production web URL | `${PRODUCTION_WEB}` |
| Production API URL | `${PRODUCTION_API}` |
| Release tag | TBD at execution |
| Dashboard URLs | `${ANALYTICS_URL_API_PRODUCTION}`, `${ANALYTICS_URL_D1_PRODUCTION}` |

## Evidence Template

| Field | Value |
| --- | --- |
| Shared at | `deliveredAt` in Slack delivery JSON |
| Slack post URL | `message.permalink` in Slack delivery JSON |
| Email sent log | n/a; Slack bot delivery is canonical for this path |
| Receipt confirmation | Slack thread / reaction evidence after runtime execution |
| Artifact path | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/` |

## Judgment

Runtime judgment: pending_user_approval. Do not mark AC-7 PASS until Slack delivery JSON exists with `ok=true`, `ts`, `channel`, and `message.permalink`.
