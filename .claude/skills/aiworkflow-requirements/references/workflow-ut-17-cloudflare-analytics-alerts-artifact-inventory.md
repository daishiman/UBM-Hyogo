# Workflow Artifact Inventory: UT-17 Cloudflare Analytics Alerts

## Workflow

| Artifact | Role |
| --- | --- |
| `docs/30-workflows/ut-17-cloudflare-analytics-alerts/` | Canonical workflow root |
| `docs/30-workflows/ut-17-cloudflare-analytics-alerts/artifacts.json` | Root task artifact metadata |
| `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/artifacts.json` | Mirror artifact metadata |
| `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md` | PR message source and implementation guide |
| `docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md` | Consumed source task pointer |

## Code

| Artifact | Role |
| --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` | Cloudflare notification relay route |
| `apps/api/src/lib/cf-webhook-auth.ts` | Fixed secret verification |
| `apps/api/src/lib/cloudflare-alert-formatter.ts` | Japanese Slack message formatter |
| `apps/api/src/lib/slack-sender.ts` | Slack Incoming Webhook sender |
| `apps/api/src/middleware/verify-cf-webhook-auth.ts` | Hono auth middleware |
| `apps/api/src/types/cloudflare-notification.ts` | Input payload types |
| `apps/api/src/env.ts` | Worker binding type additions |
| `apps/api/src/index.ts` | Route mount |

## Tests

| Artifact | Role |
| --- | --- |
| `apps/api/src/lib/__tests__/cf-webhook-auth.test.ts` | Auth unit tests |
| `apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts` | Formatter unit tests |
| `apps/api/src/lib/__tests__/slack-sender.test.ts` | Slack sender retry / redaction tests |
| `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | Route integration tests |

## Runbooks

| Artifact | Role |
| --- | --- |
| `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md` | Usage alert response runbook |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | Monthly relay healthcheck runbook |

## Runtime Boundary

Cloudflare Secrets placement, staging / production deploy, Cloudflare Notification Policy setup, Slack runtime smoke, commit, push, and PR are not executed in this local implementation cycle.
## Followup-003: alert-relay weekly healthcheck cron（Issue #635 / 2026-05-14）

| 種別 | パス | 状態 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/` | implementation_completed_external_ops_pending |
| root artifact | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/artifacts.json` | added |
| outputs artifact | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/artifacts.json` | added |
| scheduled module | `apps/api/src/scheduled/healthcheck.ts` | added |
| mail fallback | `apps/api/src/lib/healthcheck-mail-fallback.ts` | added |
| tests | `apps/api/src/scheduled/__tests__/healthcheck.test.ts`, `apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts` | added |
| API wiring | `apps/api/src/index.ts`, `apps/api/src/env.ts` | updated |
| runbook | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | updated |
| system spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | updated |

Boundary: Cloudflare secrets / deploy / runtime cron evidence / commit / push / PR remain user-gated external ops.
