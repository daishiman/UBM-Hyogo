# Cloudflare Token Provisioning And Revocation Runbook

## Purpose

This runbook replaces the retired 90 day Cloudflare API token rotation workflow. Current policy is:

- non-expiring tokens
- least privilege per environment and purpose
- separate staging and production tokens
- 1Password as the source of truth
- GitHub environment secrets as derived copies
- immediate revocation when compromise, scope drift, owner change, or validation failure is detected

Do not record token values, token identifiers, hashes, screenshots, or exact scope internals in docs, issues, PR text, logs, or artifacts.

## Token Inventory

| Use | GitHub environment | Secret name | 1Password reference | Scope boundary |
| --- | --- | --- | --- | --- |
| staging bulk-tag runtime smoke | `staging-runtime-smoke` | `CLOUDFLARE_API_TOKEN` | `op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE` | staging D1 edit only |
| production deploy | `production` | `CLOUDFLARE_API_TOKEN` | production deploy token item in 1Password | production Workers deploy + production D1 edit only |

Staging and production must not share a token. Repository-scoped Cloudflare deploy tokens are prohibited for these paths.

## Provision Staging Runtime Smoke

1. Create or confirm a non-expiring staging token in Cloudflare Dashboard with the minimum staging D1 edit scope needed by `scripts/smoke/runtime-tag-bulk.sh`.
2. Store the value in 1Password at `op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE`.
3. Confirm `op signin` is active and `gh auth status` can write to `daishiman/UBM-Hyogo`.
4. Run `bash scripts/smoke/provision-staging-secrets.sh`.
5. Confirm the script prints secret names only and the final inventory includes `CLOUDFLARE_API_TOKEN`.
6. Run or dispatch `runtime-smoke-staging` and confirm `bulk-tag-runtime-smoke` executes instead of CF-degraded skip.

## Provision Production Deploy

Production token issuance and GitHub secret mutation require explicit user approval.

1. Create a non-expiring production token with production-only Workers deploy and D1 edit scope.
2. Store the value in the production deploy token 1Password item.
3. Set the derived GitHub environment secret `CLOUDFLARE_API_TOKEN` in the `production` environment.
4. Run the approved production deploy or smoke gate.
5. Revoke the old production token only after the replacement gate passes.

## Revocation Triggers

Revoke and replace the affected token immediately when any of these conditions is true:

- suspected or confirmed exposure
- scope drift from the inventory above
- environment reuse across staging and production
- owner or account access change that invalidates the trust boundary
- repeated runtime validation failure that cannot be explained by service outage

## Verification Gates

| Gate | Command or evidence | Required result |
| --- | --- | --- |
| provisioning contract | `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts` | PASS |
| verifier unit tests | `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` | PASS |
| shell syntax | `bash -n scripts/smoke/provision-staging-secrets.sh` | PASS |
| workflow lint | `actionlint .github/workflows/runtime-smoke-staging.yml .github/workflows/verify-runtime-smoke-secret-contract.yml` | PASS |
| runtime | `runtime-smoke-staging / bulk-tag-runtime-smoke` | PASS after user-approved token provisioning |

## Retired Policy

The deleted `.github/workflows/cf-token-rotation-reminder.yml` opened reminder issues for a 90 day calendar rotation. Calendar rotation is no longer the source of truth because the operational risk was stale provisioning state, not token age. The current control is a drift gate plus least-privilege, environment-separated, non-expiring tokens with immediate event-based revocation.
