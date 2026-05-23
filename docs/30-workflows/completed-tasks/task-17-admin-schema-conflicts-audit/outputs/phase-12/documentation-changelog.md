# Documentation Changelog

## 2026-05-10

### Workflow-local

- Reclassified task-17 from `implementation_mode: new` to `existing-admin-contract-hardening`.
- Reclassified task-17 close-out from `spec_created` to `implemented-local / local_visual_evidence_pass` after same-cycle evidence plumbing and screenshot capture.
- Replaced stale `apps/web/src/app` and `apps/web/src/features/admin` references with current canonical paths under `apps/web/app`, `apps/web/src/components/admin`, and `apps/web/src/lib/admin`.
- Normalized root and output `artifacts.json` to identical canonical metadata.
- Added Phase 12 strict 7 outputs.
- Added Phase 11 10 screenshots and `phase11-capture-metadata.json`.
- Corrected Phase 11/13 wording from modal/timeline/article assumptions to current inline form / inline confirmation / table implementation.

### Global Skill Sync

- Added task-17 spec sync references to aiworkflow indexes and task workflow active ledger.
- Added artifact inventory for task-17.
- Added changelog and LOGS entry.

### Phase 12 Steps

| Step | Result |
| --- | --- |
| Step 1-A | recorded task-17 implemented-local workflow |
| Step 1-B | set implementation state to `local_visual_evidence_pass` |
| Step 1-C | task-15/16/18 relationships documented |
| Step 2 | no production interface change; E2E-local fixture/evidence plumbing only |

### Generator Execution

| Command | Result |
| --- | --- |
| `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | exit 0, regenerated `topic-map.md` / `keywords.json` |
| `node .claude/skills/task-specification-creator/scripts/generate-index.js --workflow docs/30-workflows/task-17-admin-schema-conflicts-audit --regenerate` | exit 0 but incompatible with `phase-01.md` naming; generated `Phase files found: 0/13`, so the hand-authored task-17 `index.md` was restored |
| `PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit pnpm -F @ubm-hyogo/web exec playwright test playwright/tests/admin-schema-conflicts-audit.spec.ts --project=desktop-chromium` | exit 0, 3 passed, 10 screenshots captured |
