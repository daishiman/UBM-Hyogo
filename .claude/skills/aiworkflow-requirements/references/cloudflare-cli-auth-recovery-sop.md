# Cloudflare CLI Auth Recovery SOP

## Purpose

Use this SOP when `bash scripts/cf.sh <command>` fails with Cloudflare authentication errors, especially `You are not authenticated`, while the project contract requires Cloudflare CLI operations to go through `scripts/cf.sh`.

## Invariants

- Do not run `wrangler` directly for Cloudflare mutation or deploy operations.
- Do not use `wrangler login` as the recovery path.
- Do not read or record `.env` values, Cloudflare API token values, real 1Password vault names, or real item names.
- Evidence may record environment variable key names, exit codes, redacted account identity, and user-confirmed checklist outcomes.

## Stage Isolation

| stage | contract | safe checks |
| --- | --- | --- |
| 1Password | `op run --env-file=.env` resolves `op://...` references into child process env | `op whoami`; user confirms `.env` key exists and points to an op reference; artifact records key name only |
| mise | `mise exec --` provides the expected Node / pnpm / wrangler binary context | `mise current`; `mise exec -- node -v`; `mise exec -- which wrangler` |
| wrangler | `wrangler whoami` consumes `CLOUDFLARE_API_TOKEN` from the wrapped env | `bash scripts/cf.sh whoami; echo "exit=$?"` with redacted stdout |

## Evidence Set

| file | required content |
| --- | --- |
| `outputs/phase-11/whoami-exit-code.log` | `bash scripts/cf.sh whoami` exit code only |
| `outputs/phase-11/whoami-account-identity.log` | redacted account identity; no account id, token, or email values |
| `outputs/phase-11/redaction-checklist.md` | secret / PII / vault / item / `.env` leak check |
| `outputs/phase-11/env-key-existence.md` | required env key names and user confirmation, not values |
| `outputs/phase-11/token-scope-checklist.md` | scope SOP and user confirmation status; do not treat deploy scope as PASS unless dashboard evidence exists |
| `outputs/phase-11/wrangler-login-residue.md` | OAuth residue check and action taken |
| `outputs/phase-11/handoff-to-parent.md` | parent workflow path and exact evidence files to consume |

## Close-Out Rule

If `whoami` reaches exit 0, update workflow ledgers, Phase 11 helper artifacts, Phase 12 compliance, and `task-workflow-active.md` in the same wave. Do not leave `pending_user_approval`, `not_run`, or `PENDING_RUNTIME_EVIDENCE` text in helper files after runtime evidence is captured.
