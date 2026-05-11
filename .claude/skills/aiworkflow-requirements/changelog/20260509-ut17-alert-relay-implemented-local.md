# 2026-05-09 UT-17 Alert Relay Implemented Local

UT-17 Cloudflare Analytics alerts + Slack relay を `implemented-local / implementation / NON_VISUAL / CODE_COMPLETE_EXTERNAL_OPS_PENDING` として同期した。

## Canonical Changes

- `apps/api/src/routes/internal/alert-relay.ts`: `POST /internal/alert-relay`
- `apps/api/src/lib/cf-webhook-auth.ts`: `cf-webhook-auth` fixed secret verification with timing-safe comparison
- `apps/api/src/lib/cloudflare-alert-formatter.ts`: Cloudflare notification payload to Japanese Slack Block Kit
- `apps/api/src/lib/slack-sender.ts`: Slack Incoming Webhook sender with retry for 429 / 5xx / network errors
- `apps/api/src/middleware/verify-cf-webhook-auth.ts`: Hono auth middleware
- `apps/api/src/env.ts`: UT-17 secrets / link vars
- `apps/api/src/index.ts`: route mount
- `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

## Boundary

Cloudflare Secrets placement, staging / production deploy, Cloudflare Notification Policy setup, Slack runtime smoke, commit, push, and PR remain user-gated.

## Evidence

- Focused UT-17 vitest suite
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/phase12-task-spec-compliance-check.md`
