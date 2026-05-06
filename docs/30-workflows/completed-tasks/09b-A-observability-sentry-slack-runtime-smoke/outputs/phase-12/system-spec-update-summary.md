# Phase 12 System Spec Update Summary

## Status

| Item | Result |
| --- | --- |
| Workflow | `09b-A-observability-sentry-slack-runtime-smoke` |
| Task type | implementation / NON_VISUAL / implemented-local |
| Runtime interpretation | route implemented, provider smoke evidence pending |
| Root state | `implemented-local` |

## Updated Canonical Specs

| Target | Update | AC |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Added 09b-A runtime smoke contract and implementation placement: Sentry DSN receiving check, Slack incident webhook smoke, five trigger matrix, redaction rule, API route, and 09c blocker handoff | AC-01, AC-02, AC-03, AC-05 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Added Cloudflare runtime secret names for `SENTRY_DSN_API`, `SENTRY_DSN_WEB`, `SLACK_WEBHOOK_INCIDENT`, and optional `SLACK_WORKFLOW_URL`; marked `SLACK_ALERT_WEBHOOK_URL` as legacy generic monitoring name for this path | AC-03, AC-04 |
| `artifacts.json` and `outputs/artifacts.json` | Synchronized metadata, phase outputs, strict Phase 12 files, implemented-local route boundary, and provider smoke pending boundary | skill compliance |

## Step 1-A: Secret Name Conflict Check

| Name | Decision |
| --- | --- |
| `SLACK_ALERT_WEBHOOK_URL` | Existing UT-08 generic alert name. Do not reuse for 09b-A incident response. |
| `SLACK_WEBHOOK_INCIDENT` | 09b-A canonical incident-response Slack secret. |
| `SENTRY_DSN_API` / `SENTRY_DSN_WEB` | New runtime DSN names, split by app boundary. |

No runtime secret value was added to docs. The contract stores only secret names and `op://...` reference patterns.

## Step 1-B: Notification Matrix Canonicalization

| Trigger | Severity | Destination | Evidence |
| --- | --- | --- | --- |
| `sync_jobs.failed` 3 consecutive | P2 | `SLACK_WEBHOOK_INCIDENT` | Slack permalink |
| `sync_jobs.running` stale > 30 min | P1 | `SLACK_WEBHOOK_INCIDENT` | Slack permalink + runbook link |
| Workers 5xx spike | P1/P2 | Sentry + Slack | Sentry event id + Slack permalink |
| Sentry P1 tag | P1 | Slack incident channel | Sentry event id |
| Magic Link send failure | P2 | Slack incident channel | redacted error class |

## Step 1-C: Index Rebuild

Index rebuild command:

```bash
mise exec -- pnpm indexes:rebuild
```

Result: PASS on 2026-05-05. The command regenerated `indexes/topic-map.md` and `indexes/keywords.json`; hand-maintained `quick-reference.md` and `resource-map.md` contain the 09b-A routing rows.

## Step 2: Stale Contract Withdrawal

Step 2 is not a broad stale-doc rewrite in this wave. The only stale-risk boundary is `SLACK_ALERT_WEBHOOK_URL` vs `SLACK_WEBHOOK_INCIDENT`; this file records the deprecation decision and the canonical specs now point 09b-A to `SLACK_WEBHOOK_INCIDENT`.

## Runtime Boundary

This summary is not provider runtime PASS. The API smoke route is implemented locally; Sentry test event reception, Slack message delivery, and production secret registration remain approval-gated runtime evidence for the execution wave.
