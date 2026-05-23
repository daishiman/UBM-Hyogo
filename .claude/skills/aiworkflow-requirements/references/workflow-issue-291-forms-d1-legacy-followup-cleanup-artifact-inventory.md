# Workflow Artifact Inventory: Issue #291 Forms D1 Legacy Follow-Up Cleanup

| Item | Path | Notes |
| --- | --- | --- |
| Workflow root | `docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/` | Canonical root for closed Issue #291 recovery. |
| Root spec | `docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/index.md` | `implemented_local / docs-only / NON_VISUAL`. |
| Root artifacts | `docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/artifacts.json` | Full mirror with outputs artifacts. |
| Output artifacts | `docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/artifacts.json` | Full mirror with root artifacts. |
| Phase 11 evidence | `docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/manual-test-result.md` | NON_VISUAL manual evidence. |
| Phase 11 rg evidence | `docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/rg-before-after.md` | Before/after stale-current scan. |
| Phase 12 strict 7 | `docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-12/` | `main.md` plus six required outputs. |
| Source unassigned | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-followup-cleanup-001.md` | Consumed pointer to canonical workflow. |
| Current guidance refs | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`, `.claude/skills/aiworkflow-requirements/references/environment-variables.md`, `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`, `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`, `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | Forms API split sync is current; Sheets/single sync/`sync_audit` are legacy or historical. |
| Ledgers | `.claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Superseded legacy tasks and related backlinks. |

## Runtime Boundary

No `apps/` or `packages/` code changes belong to this workflow. If runtime changes appear in a later wave, reclassify the workflow before Phase 12 close-out.
