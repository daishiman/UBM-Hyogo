# UT-17-FU-005 Alert Relay KV Error Metrics Artifact Inventory

| item | path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-error-metrics/` |
| root artifacts | `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-error-metrics/artifacts.json` |
| output artifacts parity | `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/phase-11/evidence/` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source unassigned task | `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md` |
| runbook | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-ut-17-followup-005-alert-relay-kv-error-metrics-2026-05.md` |

## Implementation Targets

| type | path | contract |
| --- | --- | --- |
| code | `apps/api/src/routes/internal/alert-relay.ts` | `ALERT_DEDUP_KV.get` / `put` failure emits `event: "alert_relay_kv_op_failed"` via 1-line JSON `console.warn` |
| tests | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | KV get throw, dedupeKeyHash reproducibility, KV put throw, and success no-warn regression coverage |
| runbook | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | Step 4c tail/grep procedure, 10/hour investigation threshold, schema table |

## State

| field | value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_status | `implementation_complete_pending_pr` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| GitHub Issue | `#701` closed; PR text must use `Refs #701` only |
| user-gated | commit / push / PR / staging deploy / production deploy / Workers Logs runtime tail evidence |

## Local Evidence

| command | result |
| --- | --- |
| `mise exec -- pnpm typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | PASS, API test suite 48 files / 290 tests |

## Downstream

UT-17-FU-006 dashboard work consumes `event: "alert_relay_kv_op_failed"`, `op`, `errorClass`, `dedupeKeyHash`, `isolateId`, and `ts` as the stable log schema.
