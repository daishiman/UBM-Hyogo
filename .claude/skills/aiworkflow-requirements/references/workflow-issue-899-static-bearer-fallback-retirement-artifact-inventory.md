# Workflow Artifact Inventory: issue-899-static-bearer-fallback-retirement

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-899-static-bearer-fallback-retirement/` |
| status | `spec_created / implementation / NON_VISUAL / implementation_pending` |
| issue | `Refs #899` only; issue is CLOSED |
| prerequisite | #916 `STAGING_AUTH_SECRET` provisioning and mint path smoke green |
| parent SSOT | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` |

## Specification Artifacts

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-899-static-bearer-fallback-retirement/index.md` | Root specification, AC, order constraints, DoD. |
| `docs/30-workflows/completed-tasks/issue-899-static-bearer-fallback-retirement/artifacts.json` | Root artifact ledger with gate metadata. |
| `docs/30-workflows/completed-tasks/issue-899-static-bearer-fallback-retirement/outputs/artifacts.json` | Output mirror for root/output parity. |
| `docs/30-workflows/completed-tasks/issue-899-static-bearer-fallback-retirement/outputs/phase-1/phase-1.md` through `outputs/phase-13/phase-13.md` | Phase 1-13 specification outputs. |
| `docs/30-workflows/completed-tasks/issue-899-static-bearer-fallback-retirement/outputs/phase-12/phase12-task-spec-compliance-check.md` | Canonical compliance check with 30-method compact evidence. |

## Implementation Targets

| Path | Planned change |
| --- | --- |
| `.github/workflows/runtime-smoke-staging.yml` | Remove static bearer job.env fallback, make mint step mandatory, remove `static-fallback` branch, restore freshness hard-fail default. |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | Replace fallback recovery text with minted-only operation and static secret physical deletion procedure. |
| `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` | Mark #899 fallback retirement complete after implementation PR merge. |

## User-Gated Boundary

Workflow edit PR, staging runtime smoke rerun, GitHub Environment secret physical deletion, commit, push, and PR are not executed without explicit user approval. #916 must complete before implementation merge.

