# Workflow Artifact Inventory: task-issue-359-production-d1-out-of-band-apply-audit-001

| item | path | role |
| --- | --- | --- |
| workflow root | `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/` | Current canonical docs-only workflow; root remains spec_created, Phase 1-12 completed |
| root index | `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/index.md` | Scope, AC, invariants, dependencies |
| root artifacts | `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/artifacts.json` | Workflow state and phase ledger |
| Phase 11 runtime evidence | `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/outputs/phase-11/` | Read-only audit evidence; decision=confirmed |
| Phase 12 strict outputs | `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/outputs/phase-12/` | Seven fixed close-out outputs plus confirmed-path `cross-reference-plan.md` |
| parent runtime evidence | `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-13/` | Already-applied production D1 verification that triggered this audit |
| aiworkflow spec changelog | `.claude/skills/aiworkflow-requirements/changelog/20260504-issue359-out-of-band-apply-audit-spec.md` | Initial spec sync record |
| aiworkflow confirmed changelog | `.claude/skills/aiworkflow-requirements/changelog/20260504-issue434-out-of-band-apply-audit-confirmed.md` | Runtime audit confirmed sync record |

## Boundary

This inventory records the specification and the read-only audit evidence bundle. It does not record new production mutation evidence from this task. The confirmed attribution is fixed in `outputs/phase-11/attribution-decision.md` and `outputs/phase-11/single-record.md`; parent workflow references were appended without rewriting existing Phase 13 evidence.
