# Phase 12 Main: task-02 runtime smoke staging secrets provisioning

| 項目 | 値 |
| --- | --- |
| workflow | `ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning` |
| canonical root | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `implemented-local-runtime-pending` |
| phase status | Phase 1-10 / 12 `completed`; Phase 11 `static-completed / runtime-pending`; Phase 13 `pending` |

## Close-out Summary

Task-02 fixes the runtime smoke staging readiness gap by adding an early secret pre-check to `.github/workflows/runtime-smoke-staging.yml` and by keeping the user-operated provisioning runbook at `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`.

Runtime secret placement, `gh workflow run`, commit, push, and PR remain user-gated. The local close-out is complete for the specification package, YAML readiness gate, runbook contract, Phase 12 strict outputs, and aiworkflow-requirements synchronization.

## Canonical Evidence Boundary

Phase 11 static evidence is captured under `outputs/phase-11/evidence/{yaml-syntax,actionlint,grep-gate}.log`. Runtime evidence files are planned under the same directory after the user provisions GitHub Environment secrets and approves workflow execution. This Phase 12 close-out does not claim runtime PASS.
