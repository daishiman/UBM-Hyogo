# Documentation Changelog

## 2026-05-15

### Changed

- Added root `artifacts.json` for machine-readable workflow state.
- Replaced Phase 12 custom output names with canonical strict 7 filenames.
- Added Phase 11 `main.md` evidence entry requirement.
- Added Phase 11 local mock visual evidence screenshots and reports.
- Reclassified workflow state to `implemented_local_runtime_pending` and generated `outputs/artifacts.json`.
- Added admin detail notes contract implementation notes for API/shared/web.
- Fixed Phase 13 user approval gate and unchecked PR template test plan.
- Unified local command examples with existing package scripts.
- Clarified `parallel-08` / `serial-05-step-01` owner boundary.

### Validator Execution Log

| Command | Result |
| --- | --- |
| `git status --short` | recorded after edits |
| `git diff --stat` | recorded after edits |
| `test -f docs/30-workflows/serial-05-step-01-members-note-mutation-ui/artifacts.json` | pass |
| `find docs/30-workflows/serial-05-step-01-members-note-mutation-ui/outputs/phase-12 -maxdepth 1 -type f \| sort` | pass: 7 canonical files |
| `pnpm verify:phase12-compliance docs/30-workflows/serial-05-step-01-members-note-mutation-ui/outputs/phase-12/phase12-task-spec-compliance-check.md` | pass after canonical heading correction |
| `pnpm --filter @ubm-hyogo/web typecheck` | pass |
| `pnpm --filter @ubm-hyogo/web test -- useAdminMutation.spec.ts NoteForm.spec.tsx MemberDrawer.notes.integration.spec.tsx` | pass: full web Vitest set matched, 86 files passed / 574 tests passed / 1 skipped |
