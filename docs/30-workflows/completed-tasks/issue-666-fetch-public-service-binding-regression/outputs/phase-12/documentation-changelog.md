# Documentation Changelog

| Date | File | Change |
| --- | --- | --- |
| 2026-05-14 | `docs/30-workflows/issue-666-fetch-public-service-binding-regression/artifacts.json` | Added root workflow ledger with `implemented_local_evidence_captured / implementation_complete_pending_pr` state. |
| 2026-05-14 | `docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-12/*` | Added Phase 12 strict 7 outputs. |
| 2026-05-14 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added Issue #666 quick lookup. |
| 2026-05-14 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added Issue #666 resource-map row. |
| 2026-05-14 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow ledger entry. |
| 2026-05-14 | `.claude/skills/aiworkflow-requirements/references/workflow-issue-666-fetch-public-service-binding-regression-artifact-inventory.md` | Added artifact inventory. |
| 2026-05-14 | `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md` | Narrowed Stage 3b HTTP fallback priority to Vitest / Playwright contexts, ignored `CI=true` alone, and preserved production / staging service binding priority. |
| 2026-05-14 | `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | Added Issue #666 skill history entry. |
| 2026-05-14 | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` | Rewrote L-E2EQU-013 to require `PLAYWRIGHT_TEST=1` instead of `CI=true` fallback. |
| 2026-05-14 | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-stage3b-server-component-mock-api-2026-05.md` | Updated Stage 3b mock API lesson to ignore `CI=true` alone. |
| 2026-05-14 | `apps/web/playwright.config.ts` | Added `PLAYWRIGHT_TEST=1` to Playwright local webServer env so E2E mock fallback remains explicit. |
| 2026-05-14 | `docs/30-workflows/unassigned-task/task-e2e-stage3b-fetch-public-service-binding-priority-regression-001.md` | Marked source proposal as consumed by Issue #666 workflow. |
