# Sentry Alerts IaC

`infra/sentry-alerts/` is the declarative source of truth for Sentry alert rules.
It covers application error telemetry; Cloudflare billing and usage alert policies remain under `infra/cloudflare-alerts/`.

## Current Policy

- `policies/admin-error-boundary.json`: detects `error.boundary.caught` with `scope=admin`.
- The policy groups by `digest` so production render errors can be correlated when messages are omitted.
- The Slack action targets `#ubm-hyogo-incidents`; no token or webhook value is stored in the repo.

## Commands

```bash
pnpm test:sentry-alerts
SENTRY_ALERTS_MOCK_DIR=tests/fixtures/sentry-alerts pnpm sentry-alerts:diff --ci --json
pnpm sentry-alerts:apply --yes
```

`apply` requires explicit operator approval and a write-capable Sentry token. CI runs validation and read-only drift diff only.

The `sentry-alerts:{list,diff,apply}` scripts run through `scripts/with-env.sh`, which injects secrets via `op run --env-file=./.env` when 1Password CLI and `.env` are present (real values stay out of the repo as `op://` references). When `op`/`.env` are absent (e.g. CI), the command runs directly with environment variables supplied by GitHub Secrets / Variables. Mock-mode runs set `SENTRY_ALERTS_MOCK_DIR` and need no real token.

## Runtime Inputs

| Variable | Use |
| --- | --- |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `SENTRY_AUTH_TOKEN` / `SENTRY_AUTH_TOKEN_READ` | Read-only diff token; write-capable token only for approved local apply |
| `SENTRY_SLACK_WORKSPACE_ID` / `SENTRY_SLACK_CHANNEL_ID` | Slack integration routing for approved apply |
| `SENTRY_ALERTS_MOCK_DIR` | Local fixture mode; prevents real API calls |

## Related

- Runbook: `docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md`
- Drift workflow: `.github/workflows/sentry-alerts-drift.yml`
