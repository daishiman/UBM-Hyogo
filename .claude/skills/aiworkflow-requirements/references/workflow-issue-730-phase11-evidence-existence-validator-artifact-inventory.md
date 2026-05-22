# Workflow Artifact Inventory: Issue #730 Phase 11 evidence existence validator

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/issue-730-phase11-evidence-existence-validator/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / local evidence PASS` |
| issue | Issue #730 CLOSED; PR wording uses `Refs #730` |
| source unassigned | `docs/30-workflows/unassigned-task/task-27-followup-002-phase11-evidence-existence-validator.md` consumed |
| upstream | `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/` |

## Canonical Artifacts

| Path | Role |
| --- | --- |
| `scripts/lib/phase12-compliance/parse-phase11-evidence.ts` | Phase 11 evidence inventory markdown parser |
| `scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` | physical existence and workflow-root containment check |
| `scripts/lib/phase12-compliance/verify-compliance-file.ts` | integration point after canonical heading validation |
| `scripts/lib/phase12-compliance/types.ts` | `missing-evidence` reason |
| `scripts/__tests__/verify-phase12-compliance.spec.ts` | focused tests |
| `scripts/__tests__/fixtures/phase12-compliance/pass/outputs/phase-11/` | present evidence fixture |
| `scripts/__tests__/fixtures/phase12-compliance/fail-missing-evidence/` | red fixture |
| `.github/workflows/verify-phase12-compliance.yml` | manual `workflow_dispatch` base ref fallback while PR trigger remains paused |
| `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | promoted rule |
| `docs/30-workflows/issue-730-phase11-evidence-existence-validator/outputs/phase-11/` | local NON_VISUAL evidence |
| `docs/30-workflows/issue-730-phase11-evidence-existence-validator/outputs/phase-12/` | strict 7 close-out |

## Boundaries

Local implementation and evidence files are captured.
Focused command execution passes locally.
Commit, push, PR, GitHub issue mutation, and required-check mutation are user-gated.
