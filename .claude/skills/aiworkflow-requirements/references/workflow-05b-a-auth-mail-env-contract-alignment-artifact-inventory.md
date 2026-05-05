# 05b-A Auth Mail Env Contract Alignment Artifact Inventory

| Item | Value |
| --- | --- |
| Task ID | `05b-A-auth-mail-env-contract-alignment` |
| Canonical task root | `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/` |
| Legacy root | `docs/30-workflows/02-application-implementation/05b-A-auth-mail-env-contract-alignment/` |
| State | `spec_created / docs-only / remaining-only / NON_VISUAL` |
| Date | 2026-05-01 |

## Canonical contract

- Auth + Magic Link mail env names are `MAIL_PROVIDER_KEY`, `MAIL_FROM_ADDRESS`, and `AUTH_URL`.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SITE_URL` are stale documentation names and must not be used for new provisioning.
- `MAIL_PROVIDER_KEY` is a Secret. `MAIL_FROM_ADDRESS` and `AUTH_URL` are Variables.
- Production missing `MAIL_PROVIDER_KEY` is a request-level fail-closed condition: 502 `MAIL_FAILED`.

## Workflow artifacts

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/index.md` | workflow overview |
| `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/artifacts.json` | root artifact ledger |
| `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/phase-01.md` ... `phase-13.md` | phase specifications |
| `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-11/` | NON_VISUAL readiness evidence templates |
| `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-12/` | strict 7-file Phase 12 close-out set |

## Downstream ownership

- `09a-A-staging-deploy-smoke-execution`: staging provisioning and real Magic Link send smoke.
- `09c-A-production-deploy-execution`: production provisioning readiness and fail-closed verification.
- `05b-B-magic-link-callback-credentials-provider`: callback/provider integration consuming `AUTH_URL`.
