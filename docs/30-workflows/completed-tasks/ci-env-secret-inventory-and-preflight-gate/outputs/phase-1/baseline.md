# Phase 1 Baseline

## Read-only Baseline

This baseline records the current problem without secret values. It is safe to
store because it contains only secret names, workflow paths, and pending user
operations.

| Check | Result |
| --- | --- |
| `staging-runtime-smoke` environment exists | expected existing environment |
| `staging-runtime-smoke` required names | `STAGING_API_BASE`, `STAGING_ADMIN_BEARER`, `STAGING_MEMBER_ID`, `STAGING_ME_BEARER`, `SLACK_WEBHOOK_INCIDENT` |
| Adjacent workflow secret refs | 15 tracked items in `task-02-adjacent-unregistered-secret-inventory/inventory.md` |
| Org scope | N/A because `daishiman` is a user account |

## Evidence Commands

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets --jq '.secrets[].name' | sort
rg -n 'secrets\.(CLOUDFLARE_API_TOKEN_STAGING|CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY|CF_AUDIT_D1_TOKEN_PROD|CF_AUDIT_R2_TOKEN_PROD|CF_AUDIT_TOKEN_PROD|CF_AUDIT_WORKERS_AI_TOKEN|CLOUDFLARE_ACCOUNT_TAG|CLOUDFLARE_ZONE_TAG|CLOUDFLARE_ALERTS_TOKEN_READ|CLOUDFLARE_ANALYTICS_API_TOKEN|CLOUDFLARE_ALERT_RELAY_URL|AUTH_SECRET|EMAIL_WEBHOOK_URL|SLACK_BOT_TOKEN_INCIDENT_RUNBOOK|SLACK_WEBHOOK_URL)' .github/workflows/
```

Runtime values, hashes, bearer fragments, webhook URLs, and token lengths must
not be recorded.
