# workflow-regression-evidence-ci-gate-foundation artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/regression-evidence-ci-gate-foundation/` |
| index | `docs/30-workflows/regression-evidence-ci-gate-foundation/index.md` |
| root artifacts | `docs/30-workflows/regression-evidence-ci-gate-foundation/artifacts.json` |
| output artifacts | `docs/30-workflows/regression-evidence-ci-gate-foundation/outputs/artifacts.json` |
| Phase 11 inventory | `docs/30-workflows/regression-evidence-ci-gate-foundation/phase-11-evidence-inventory.md` |
| Phase 12 compliance | `docs/30-workflows/regression-evidence-ci-gate-foundation/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| upstream source | `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/` |
| implementation targets | `apps/web/playwright/tests/visual/top.spec.ts`, `apps/web/playwright/tests/visual/members-list.spec.ts`, `apps/web/playwright/tests/visual/member-detail.spec.ts`, `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` |
| CI gates | `verify-design-tokens`, `playwright-smoke / smoke (chromium)`, `playwright-smoke / visual (chromium, 4 screens)`, `verify-phase12-compliance`, `verify-gate-metadata`, `verify-indexes-up-to-date` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-regression-evidence-ci-gate-foundation-2026-05.md` (L-RECGF-001..006) |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260525-regression-evidence-ci-gate-foundation.md` |
| legacy-ordinal note | `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md` (NOTE 2026-05-25) |
| playwright config edit | `apps/web/playwright.config.ts` (staging project `testIgnore` 追加で visual baseline spec を chromium project に限定) |

## Runtime Boundary

The workflow is `spec_created / implementation / VISUAL / runtime_pending`. Playwright visual execution, Chromium/Linux baseline PNG capture, Phase 11 evidence logs, branch protection mutation, commit, push, and PR are user-gated.

## Canonical Ownership

This top-level root is the canonical execution root for the regression evidence CI gate. The earlier `ui-prototype-design-system-foundation/serial-07-regression-evidence/` path remains the upstream source context and should not be treated as a second execution root.
