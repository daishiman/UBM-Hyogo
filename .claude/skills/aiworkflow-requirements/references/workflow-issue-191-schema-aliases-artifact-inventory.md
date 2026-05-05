# Artifact Inventory: issue-191 schema aliases

## Metadata

| Field | Value |
| --- | --- |
| Workflow | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/` |
| State | `spec_created / docs_only / NON_VISUAL` |
| Sync date | 2026-05-01 |
| Canonical spec | `references/database-implementation-core.md` §Schema Alias Resolution Contract |

## Current Canonical Set

| Artifact | Role |
| --- | --- |
| `artifacts.json` / `outputs/artifacts.json` | Phase ledger parity source |
| `outputs/phase-12/implementation-guide.md` | Phase 12 Part 1/2 implementation guide |
| `outputs/phase-12/system-spec-update-summary.md` | system spec sync summary |
| `outputs/phase-12/unassigned-task-detection.md` | A/B/C follow-up detection |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback source |
| `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001.md` | completed / promoted source follow-up |
| `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/outputs/phase-11/` | implementation evidence |
| `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` | fallback retirement follow-up |
| `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md` | direct update guard follow-up |

## Validation Chain

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring --json
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --json --target-file docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001.md
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --json --target-file docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --json --target-file docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js
```

## Notes

The workflow stays under `completed-tasks/` because it records a closed issue specification closeout. The implementation follow-up was promoted to `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/`; fallback retirement and direct update guard remain open.
