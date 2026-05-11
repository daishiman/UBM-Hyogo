# Skill Feedback Report

## Template Improvements

- Task creation templates should force a current worktree path inventory before emitting `implementation_mode: new`.
- If a route/component exists, the default wording should be `existing-*-hardening` or `existing-*-alignment`, not new implementation.

## Workflow Improvements

- `artifacts.json` and `outputs/artifacts.json` must be generated from one source to avoid parity drift.
- Phase 12 generated text should distinguish Task count from strict output file count: Task 12-1..12-6 vs strict 7 files.
- `task-specification-creator/scripts/generate-index.js` should support both `phase-01.md` and `phase-1-*.md` naming. Current task-17 execution returned exit 0 with `Phase files found: 0/13`, which is semantically unsafe despite shell success.
- Promotion route: use existing `docs/30-workflows/unassigned-task/TASK-SPEC-PHASE-FILENAME-DETECTION-001.md`; do not create a duplicate follow-up.
- UI evidence workflows that rely on Server Component fetches need an explicit local fixture hook. Browser `page.route()` alone cannot supply server-side data.

## Documentation Improvements

- aiworkflow sync should include current canonical path, implementation state, and downstream task relation in one entry.
- For UI implementation specs, current `apps/web/app` vs stale `apps/web/src/app` must be grep-validated before Phase 4.
