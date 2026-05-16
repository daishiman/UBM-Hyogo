# Adjacent Unregistered Secret Inventory

## Summary

The previous provisional count is superseded. The canonical inventory is 15
items because `SLACK_WEBHOOK_URL` is tracked separately from
`SLACK_BOT_TOKEN_INCIDENT_RUNBOOK`.

| # | Secret | Current refs | Chosen action | Mutation owner | Verification command / evidence |
| ---: | --- | --- | --- | --- | --- |
| 1 | `CLOUDFLARE_API_TOKEN_STAGING` | `.github/workflows/d1-migration-verify.yml:40,59` | align to `secrets.CLOUDFLARE_API_TOKEN` with job `environment: staging` | AI for YAML; user ensures env secret exists | `rg -n 'CLOUDFLARE_API_TOKEN_STAGING' .github/workflows/d1-migration-verify.yml` returns 0 |
| 2 | `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` | `.github/workflows/post-release-dashboard.yml:50,76` | provision repo secret | user | `gh api repos/daishiman/UBM-Hyogo/actions/secrets --jq '.secrets[].name' | grep CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` |
| 3 | `CF_AUDIT_D1_TOKEN_PROD` | `.github/workflows/cf-audit-log-monitor.yml:69,79` | provision production-scoped audit token | user | production/env or repo name list contains the secret |
| 4 | `CF_AUDIT_R2_TOKEN_PROD` | `.github/workflows/cf-audit-log-cold-storage.yml:42,64` | provision production-scoped R2 token | user | production/env or repo name list contains the secret |
| 5 | `CF_AUDIT_TOKEN_PROD` | `.github/workflows/cf-audit-log-monitor.yml:70` | provision production audit token | user | production/env or repo name list contains the secret |
| 6 | `CF_AUDIT_WORKERS_AI_TOKEN` | `.github/workflows/cf-audit-log-monitor.yml:82` | provision Workers AI audit token | user | production/env or repo name list contains the secret |
| 7 | `CLOUDFLARE_ACCOUNT_TAG` | `.github/workflows/cloudflare-analytics-export.yml:83` | migrate to GitHub Variable `vars.CLOUDFLARE_ACCOUNT_TAG` | AI for YAML; user ensures variable exists | workflow no longer references `secrets.CLOUDFLARE_ACCOUNT_TAG`; variable name list contains the name |
| 8 | `CLOUDFLARE_ZONE_TAG` | `.github/workflows/cloudflare-analytics-export.yml:82` | migrate to GitHub Variable `vars.CLOUDFLARE_ZONE_TAG` | AI for YAML; user ensures variable exists | workflow no longer references `secrets.CLOUDFLARE_ZONE_TAG`; variable name list contains the name |
| 9 | `CLOUDFLARE_ALERTS_TOKEN_READ` | `.github/workflows/cloudflare-alerts-drift.yml:63` | provision read-only alerts token | user | repo name list contains the secret |
| 10 | `CLOUDFLARE_ANALYTICS_API_TOKEN` | `.github/workflows/cloudflare-analytics-export.yml:81` | provision analytics token | user | repo name list contains the secret |
| 11 | `CLOUDFLARE_ALERT_RELAY_URL` | `.github/workflows/cloudflare-alerts-drift.yml:64` | provision relay URL as secret | user | repo name list contains the secret |
| 12 | `AUTH_SECRET` | `.github/workflows/lighthouse.yml:36,63,75,81,97` | provision repo or environment-specific auth secret used by Lighthouse | user | relevant name list contains the secret |
| 13 | `EMAIL_WEBHOOK_URL` | `.github/workflows/cf-audit-log-monitor.yml:114` | provision optional mail webhook; keep workflow guarded | user | repo name list contains the secret or monitor evidence records optional disabled state |
| 14 | `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` | `.github/workflows/incident-runbook-slack-delivery.yml:100,141` | provision bot token; do not collapse into webhook because bot API semantics differ | user | repo name list contains the secret |
| 15 | `SLACK_WEBHOOK_URL` | `.github/workflows/post-release-30day-auto-summary.yml:50` | provision as legacy post-release summary webhook for now; do not collapse into incident webhook without a separate semantics review | user | repo name list contains `SLACK_WEBHOOK_URL` |

## Current AI-applied Alignment

`CLOUDFLARE_API_TOKEN_STAGING` has been removed from
`.github/workflows/d1-migration-verify.yml`; the job now uses
`environment: staging` and `secrets.CLOUDFLARE_API_TOKEN`.

`CLOUDFLARE_ACCOUNT_TAG` and `CLOUDFLARE_ZONE_TAG` have been removed from
secret scope in `.github/workflows/cloudflare-analytics-export.yml`; the
workflow now reads `vars.CLOUDFLARE_ACCOUNT_TAG` and
`vars.CLOUDFLARE_ZONE_TAG`.

All other items are classified as user-gated provisioning. They are not backlog
items; they require secret values or external GitHub secret/variable mutation and
therefore remain Phase 13 runtime evidence.

## Safety

Evidence may contain only names, scopes, workflow paths, line numbers, run IDs,
and conclusions. Do not store secret values, hashes, suffixes, token lengths, or
URL query strings.
