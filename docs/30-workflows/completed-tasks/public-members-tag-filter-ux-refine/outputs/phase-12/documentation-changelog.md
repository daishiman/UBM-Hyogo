# Documentation Changelog

## 2026-06-08

- Created canonical workflow root `docs/30-workflows/completed-tasks/public-members-tag-filter-ux-refine/` (implemented-local cycle).
- Added Phase 1-3 design specs (requirements / design / design-review) and Phase 11/12/13 specs.
- Materialized Phase 12 strict 7 output files under `outputs/phase-12/` as implementation close-out evidence.
- Established root/output `artifacts.json` parity (`workflow_state: implemented_local_runtime_pending`, 3 gates pending).
- Added `apps/web` implementation evidence for tag flex-wrap, filter grouping, selected tag accent styling, and member-grid spacing.
- Declared 5 local-static-visual screenshots in `outputs/phase-11/metadata.json` (`status: local_static_visual_present_staging_pending`, `evidenceType: local-static-visual`).
- Recorded RCA: tag chips stack vertically because `[data-role="tag-picker-options"]` lacks a `display` rule in both CSS files; fix is CSS + minimal markup only (API/D1/Form innocent).
- Recorded Step 2 domain-canon reflection判定 as N/A (public surface unchanged).
- No commit/push/PR or staging runtime screenshot captured (all user-gated).
