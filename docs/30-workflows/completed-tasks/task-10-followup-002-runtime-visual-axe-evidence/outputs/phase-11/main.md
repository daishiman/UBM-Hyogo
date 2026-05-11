# Phase 11: runtime visual + axe evidence

## Status

`completed`

Local harness and Playwright spec are present in this wave. Runtime screenshot and axe evidence were captured by the Phase 11 command, moving this workflow to `implemented_local_evidence_captured`.

## Evidence Paths

| Evidence | Path | Status |
| --- | --- | --- |
| screenshots | `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/screenshots/` | `completed (37 files)` |
| axe report | `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/axe-report.json` | `completed (0 violations)` |
| Playwright JSON | `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/playwright-report/results.json` | `completed (38 passed)` |

## Command

```bash
PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002 \
PLAYWRIGHT_EVIDENCE_DIR="$(pwd)/docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence" \
  mise exec -- pnpm --filter @ubm-hyogo/web e2e \
  --project=desktop-chromium \
  ui-primitives-visual.spec.ts
```

## Expected Inventory

Expected screenshot count: `37`.

Actual screenshot count: `37`.

Unknown axe violations: `0`.

Any future allowlisted violation must include `id`, `selector`, `reason`, and a follow-up owner or same-cycle fix decision.
