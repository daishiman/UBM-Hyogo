# System Spec Update Summary

## Updated SSOT

| File | Update |
| --- | --- |
| `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Documents that `verify-phase12-compliance` reads `Required Sections` as the SSOT. |
| `.claude/skills/task-specification-creator/SKILL.md` | Adds a 2026-05-11 changelog entry for the CI gate. |
| `.claude/skills/task-specification-creator/SKILL-changelog.md` | Mirrors the Issue #603 skill change for changelog-based audits. |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | Records why the Phase 12 template became CI-enforced. |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | Registers `.github/workflows/verify-phase12-compliance.yml` in the GitHub Actions workflow table without dropping prior current facts. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Registers this workflow as active implemented-local NON_VISUAL work. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md` | Marks the source unassigned task as promoted/consumed. |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-603-phase12-compliance-check-ci-gate-artifact-inventory.md` | Adds artifact inventory for this workflow. |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Records aiworkflow SSOT sync for Issue #603. |
| `docs/30-workflows/LOGS.md` | Records the workflow package in the global task history. |

## Step 1-A: Implementation Status Table

`task-workflow-active.md`, `quick-reference.md`, and `resource-map.md` point to `docs/30-workflows/issue-603-phase12-compliance-check-ci-gate/` as `implemented_local_runtime_pending / implementation / NON_VISUAL`. Local typecheck, lint, focused tests, and verifier evidence are captured; PR-hosted CI evidence remains user-gated until Phase 13.

## Step 1-B: Related Task / Backlog Table

`task-workflow-backlog.md` marks `task-spec-skill-compliance-check-ci-gate` as promoted/consumed and redirects to the Issue #603 workflow root. `unassigned-task-detection.md` records no new follow-up task for this cycle.

## Step 1-C: System Spec / Deployment Table

`deployment-core.md` adds `verify-phase12-compliance.yml` while preserving the UT-CICD-DRIFT current-facts note. The new dated fact states that the workflow runs focused Vitest and the compliance verifier for workflow docs, workflow self, package script, verifier, fixture, test, and canonical template changes.

## Step 1-H: Logs / Topic Map / Generated Index Handling

`docs/30-workflows/LOGS.md`, `task-specification-creator/SKILL-changelog.md`, `task-specification-creator/LOGS/_legacy.md`, and `aiworkflow-requirements/LOGS/_legacy.md` are updated in this cycle. `aiworkflow-requirements/indexes/keywords.json` is already updated for the new keywords. A full topic-map rebuild is not required because this cycle adds a workflow artifact inventory and changelog entry, not a new broad reference topic requiring section-level navigation.

## Step 2: Conditional Spec Update Applicability

Step 2 is applicable only for stale or conflicting system facts. One stale-risk was found: the previous `deployment-core.md` current-facts paragraph had been replaced. This cycle restores the prior UT-CICD-DRIFT fact and appends the Issue #603 fact, so no unresolved stale system-spec contradiction remains.

## Runtime Boundary

Local tests and local script execution are captured in this cycle. PR creation, push, and GitHub-hosted CI evidence remain user-gated.
