# Skill Feedback Report

## Template Improvements

`task-specification-creator` template does not require a structural change, but two operational rules from this cycle warrant explicit cross-link from the skill's lessons-learned aggregation index when next regenerated:

- **Token-gate pre-emptive run**: Workflows that touch design tokens, CSS, or any `apps/web/app/**/opengraph-image*.tsx` route should run `pnpm verify:tokens` proactively before Phase 5 implementation. The gate scans the whole workspace and can fail on adjacent preexisting HEX literals / negative `letter-spacing`. See L-HOMEALIGN-006.
- **Unassigned-task placement**: Followup tasks must be placed under `docs/30-workflows/unassigned-task/<workflow-id>-followup-<NNN>-<slug>.md`, never at `docs/30-workflows/completed-tasks/<file>.md` (the latter bypasses the unassigned-task pre-flight gate). See L-HOMEALIGN-007.

## Workflow Improvements

Applied locally: this workflow now carries Phase 4-13 files, implemented `apps/web` diffs, Phase 11 local screenshots, and Phase 12 strict 7 outputs. This follows the existing rule that workflows with `apps/` / `packages/` dirty diffs must not remain `spec_created`.

Also corrected in this cycle: `outputs/phase-12/unassigned-task-detection.md` was reissued with `Detected count: 1` after relocating `home-page-prototype-alignment-followup-001` from `docs/30-workflows/completed-tasks/` (incorrect) to `docs/30-workflows/unassigned-task/` (canonical).

## Documentation Improvements

Applied locally: aiworkflow-requirements received same-wave entries for quick lookup, active workflow tracking, artifact inventory, lessons learned (now L-HOMEALIGN-001..007), changelog, and LOGS. No skill definition contradiction was found.
