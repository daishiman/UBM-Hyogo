# System Spec Update Summary

Status: `implemented_local_runtime_pending`

## aiworkflow-requirements Sync

This cycle registers `admin-visual-baseline-admin-routes-task-e` as `implemented_local_runtime_pending / implementation / VISUAL` with runtime capture and external operations user-gated.

Updated or added canonical references:

| Target | Purpose |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow ledger |
| `.claude/skills/aiworkflow-requirements/references/workflow-admin-visual-baseline-admin-routes-task-e-artifact-inventory.md` | artifact inventory |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | quick lookup |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | progressive disclosure resource map |
| `.claude/skills/aiworkflow-requirements/changelog/20260527-admin-visual-baseline-admin-routes-task-e.md` | dated changelog |

Implementation review follow-up:

- `apps/web/playwright.config.ts` now maps admin-shell visual runs to `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-11/evidence`.
- `.github/workflows/playwright-smoke.yml` now sets `PLAYWRIGHT_EVIDENCE_DIR` for the `admin-visual` matrix and uploads Task E evidence artifacts on failure.

No product API, D1 schema, auth, or UI component contract is changed by this specification-sync cycle.
