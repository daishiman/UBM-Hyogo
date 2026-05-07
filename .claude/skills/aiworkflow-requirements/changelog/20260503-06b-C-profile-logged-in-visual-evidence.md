# 2026-05-03 06b-C `/profile` logged-in visual evidence

## Summary

Promoted the prior `ut-06b-profile-logged-in-visual-evidence` documentation skeleton to `06b-C-profile-logged-in-visual-evidence` with executable evidence-capture scaffolding. Repo-layout drift (`apps/web/tests/e2e` → `apps/web/playwright`) was corrected, and a production-safe capture wrapper was added. The `/profile` behavioral contract is unchanged; only evidence reproducibility improves.

## Updated Canonical References

- `indexes/quick-reference.md` (06b row points to `06b-C-profile-logged-in-visual-evidence` with `implementation-prepared / runtime evidence pending`)
- `indexes/resource-map.md` (06b-C row added with `VISUAL_ON_EXECUTION / 2026-05-03`)
- `references/task-workflow-active.md` (06b-C row replaces the `ut-06b-profile-logged-in-visual-evidence` row, status `implementation-prepared`)
- `references/legacy-ordinal-family-register.md` (UT-06B Current Alias Override now maps to `06b-C-profile-logged-in-visual-evidence/`)
- `references/lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md` (added L-06B-006 path drift, L-06B-007 capture wrapper guards, L-06B-008 evidence_status three-state)
- `references/workflow-06b-c-profile-logged-in-visual-evidence-artifact-inventory.md` (new artifact inventory)

## Implementation Artifacts

- `apps/web/playwright/tests/profile-readonly.spec.ts` (M-08 / M-09 / M-10 / M-16, desktop + mobile)
- `apps/web/playwright.config.ts` (`staging` project + `PLAYWRIGHT_STAGING_BASE_URL`)
- `scripts/capture-profile-evidence.sh` (production URL guard + `--storage-state` exit 4)
- `apps/web/playwright/.auth/.gitkeep` (committed) / `apps/web/playwright/.auth/*.json` (ignored)
- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/{screenshots,dom}/.gitkeep`
- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/` (strict 7 files)

## Deferred Evidence

- M-08 / M-09 / M-10 runtime screenshots and DOM dumps require a real logged-in `storageState` JSON. Execution is now promoted to `docs/30-workflows/completed-tasks/06b-c-runtime-evidence-execution/`; the former unassigned task remains only as a `promoted_to_workflow` pointer.
- M-14 (Magic Link end-to-end) / M-15 (Google OAuth end-to-end) remain external-gated by 09a staging deploy smoke.

## Skill Feedback Surfaced

- `task-specification-creator`: implementation-spec tasks should run a Phase 5 path-inventory check (declared code paths exist in repo) and a storageState leakage check before producing Phase 11 / 12 outputs. Captured in L-06B-006.
