# System Spec Update Summary

## Step 1-A: aiworkflow Requirements Sync

| file | update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | CI pipeline recovery entry now includes task-02 readiness gate and strict outputs |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | CI pipeline recovery lookup now points at task-02 Phase 12 compliance |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | task-02 row added with canonical root and user-gated runtime boundary |
| `.claude/skills/aiworkflow-requirements/changelog/20260509-ci-pipeline-recovery-web-cd-runtime-smoke.md` | 2026-05-10 task-02 update recorded |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | latest headline added |

## Step 1-B: Workflow Artifact Sync

Task-02 canonical root remains under the parent workflow:

`docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/`

The temporary top-level move is not the canonical shape because parent workflow references, unassigned follow-ups, and aiworkflow indexes already model task-02 as a child of `ci-secret-alignment-and-runtime-smoke-recovery`.

## Step 1-C: Runtime Contract Sync

`.github/workflows/runtime-smoke-staging.yml` now has an explicit readiness pre-check for the four smoke-required secrets and fails with secret names only.

## Step 2: Additional Spec Update Decision

No `docs/00-getting-started-manual/specs/*` update is required in this cycle. The change is a CI workflow/runbook readiness contract already owned by deployment/secret-management references and aiworkflow indexes.
