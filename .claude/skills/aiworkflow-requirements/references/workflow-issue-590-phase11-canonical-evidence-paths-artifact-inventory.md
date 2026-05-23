# Issue #590 Phase 11 Canonical Evidence Paths Artifact Inventory

## Current Canonical Set

| Kind | Path | Status |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/` | implemented-local |
| schema | `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json` | present |
| validator | `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js` | present |
| validator tests | `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs` | present |
| skill module metadata | `.claude/skills/task-specification-creator/package.json` | present |
| package script | `package.json#scripts.validate:phase11-paths` | present |
| parent manifest | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json` | present |
| consumed source | `docs/30-workflows/completed-tasks/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md` | superseded |

## Boundary

Issue #590 standardizes evidence paths. It does not collect Issue #549 post-merge 7 day runtime observation evidence.
