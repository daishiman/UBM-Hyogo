# Cloudflare Token Rotation Runbook

## Scope

This runbook rotates one token at a time. Never rotate all six tokens in one operation.

## Token List

| Token | Consumer |
| --- | --- |
| `CF_TOKEN_D1_STAGING` | backend-ci staging D1 migration |
| `CF_TOKEN_D1_PRODUCTION` | backend-ci production D1 migration |
| `CF_TOKEN_WORKERS_STAGING` | backend-ci staging Workers deploy |
| `CF_TOKEN_WORKERS_PRODUCTION` | backend-ci production Workers deploy |
| `CF_TOKEN_PAGES_STAGING` | web-cd staging Pages deploy |
| `CF_TOKEN_PAGES_PRODUCTION` | web-cd production Pages deploy |

## Rotation Steps

1. Create the replacement token in Cloudflare with the same minimal scope.
2. Store the value in 1Password under the same item name plus a dated note. Do not store hashes in docs.
3. Update the matching GitHub environment secret with stdin, not shell history.
4. Run only the affected workflow/environment.
5. Keep the old token active for 24h after production success.
6. Revoke the old token in Cloudflare and record token name, scope, and timestamp only.

## Rollback

| Failed token | Rollback |
| --- | --- |
| D1 | Restore previous `CF_TOKEN_D1_<ENV>` GitHub secret and rerun only migration verification. |
| Workers | Restore previous `CF_TOKEN_WORKERS_<ENV>` GitHub secret and rerun only backend deploy. |
| Pages | Restore previous `CF_TOKEN_PAGES_<ENV>` GitHub secret and rerun only web deploy. |

## Evidence Files

| Evidence | Secret values allowed |
| --- | --- |
| `outputs/phase-11/token-issuance-evidence.json` | No |
| `outputs/phase-11/github-secret-list.json` | No |
| `outputs/phase-11/staging-7day-green-evidence.json` | No |
| `outputs/phase-11/old-token-retirement-evidence.json` | No |
