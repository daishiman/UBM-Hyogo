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

## Followup-006: Workers KV usage dashboard monitoring（2026-05-16）

| 種別 | パス | 状態 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring/` | implemented_local_runtime_pending |
| source spec (superseded) | `docs/30-workflows/completed-tasks/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md` | superseded by IaC route |
| policy: writes/day | `infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json` | added (`enabled: false`) |
| policy: stored bytes | `infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json` | added (`enabled: false`) |
| quota base | `infra/cloudflare-alerts/quota-base.json` | extended (`workers_kv_writes_per_day=1000`, `workers_kv_stored_bytes`) |
| load test | `infra/cloudflare-alerts/lib/__tests__/load.spec.ts` | updated (full key assertion) |
| quota-base test | `infra/cloudflare-alerts/lib/__tests__/quota-base.spec.ts` | updated (new key expectations) |
| API fixture | `tests/fixtures/cloudflare-alerts/api-list-policies.json` | updated (2 new policy entries) |
| README | `infra/cloudflare-alerts/README.md` | updated (KV usage section) |
| runbook | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | updated (two-stage rollout + namespace boundary) |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-ut-17-followup-006-kv-usage-dashboard-monitoring-2026-05.md` | added (L-UT17FU006-001..004) |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260516-ut17-followup006-kv-usage-monitoring.md` | added |

Boundary: Workers KV usage alerts are Cloudflare **account-scoped**; namespace selector is not supported by the Notification Policy API, so `ALERT_DEDUP_KV` dedicated wording is withdrawn and replaced with "account has only `ALERT_DEDUP_KV` namespace" boundary in spec/runbook. Cloudflare apply, 5 営業日 baseline observation, `enabled: true` flip PR, commit, push, and PR remain user-gated external ops.
