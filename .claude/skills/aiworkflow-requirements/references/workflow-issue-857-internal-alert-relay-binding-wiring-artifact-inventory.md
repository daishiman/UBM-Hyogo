# Workflow Artifact Inventory: issue-857 internal alert relay binding wiring

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| source | `docs/30-workflows/completed-tasks/UT-25-DERIV-02-FU-01-internal-alert-binding-wiring.md` |
| parent | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/` |
| issue | `Refs #857` only; issue is CLOSED |

## Implementation Targets

| Path | Purpose |
| --- | --- |
| `apps/api/wrangler.toml` | Adds `API_INTERNAL_BASE_URL` to production and staging vars. |
| `apps/api/src/env.ts` | Documents deploy-required base URL and no separate token provisioning. |
| `apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts` | Static TOML guard for both envs and `AUTH_URL` parity. |
| `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` | `CF_WEBHOOK_AUTH_SECRET` fallback POST regression. |

## Evidence

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-11/main.md` | NON_VISUAL evidence index. |
| `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-11/evidence/vitest-sheets-auth-healthcheck.log` | Focused API Vitest log. |
| `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/phase12-task-spec-compliance-check.md` | Strict 7 compliance verdict. |

## User-Gated Boundary

Cloudflare secret list, staging deploy, Workers tail, controlled SA key invalidation, commit, push, and PR are not executed without explicit user approval.

