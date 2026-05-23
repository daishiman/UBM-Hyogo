# Workflow Artifact Inventory — parallel-i06-root-error-focus

## Metadata

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/` |
| state | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` |
| parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/` |

## Implementation

| Path | Purpose |
| --- | --- |
| `apps/web/app/error.tsx` | Adds h1 ref and focus transfer after `logger.error`. |
| `apps/web/app/error.spec.tsx` | Verifies h1 focus and digest display. |

## Evidence

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/artifacts.json` | Root workflow metadata. |
| `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/outputs/artifacts.json` | Output artifact mirror. |
| `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/outputs/phase-11/evidence/typecheck.log` | Typecheck command output. |
| `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/outputs/phase-11/evidence/lint.log` | Lint command output. |
| `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/outputs/phase-11/evidence/test.log` | Focused Vitest output. |
| `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/outputs/phase-11/evidence/grep-gate.log` | HEX / arbitrary color grep gate. |
| `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/outputs/phase-11/evidence/diff.txt` | Implementation diff evidence. |
| `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/outputs/phase-12/phase12-task-spec-compliance-check.md` | Strict Phase 12 compliance. |

## System Sync

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` | Source task consumed trace. |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` | i06 state sync. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Quick lookup entry. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Resource map entry. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Active workflow ledger entry. |

## User Gates

Commit, push, and PR creation are pending explicit user approval.
