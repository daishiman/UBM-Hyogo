# Workflow Artifact Inventory: UT-17-FU-005 Alert Relay KV Operation Error Metrics

State: implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING

## Workflow

- `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics/index.md`
- `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics/artifacts.json`
- `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics/phase-01.md` through `phase-13.md`
- `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-11/visual-verification-skip.md`
- `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-12/*.md`

## Implementation

- `apps/api/src/routes/internal/alert-relay.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

## Evidence

- `outputs/phase-11/evidence/typecheck.txt`
- `outputs/phase-11/evidence/lint.txt`
- `outputs/phase-11/evidence/build.txt`
- `outputs/phase-11/evidence/test.txt`
- `outputs/phase-11/evidence/grep-gate.txt`

## User-Gated

- Runtime deploy
- Workers Logs / `bash scripts/cf.sh tail ... | grep alert_relay_kv_op_failed`
- Commit
- Push
- PR
