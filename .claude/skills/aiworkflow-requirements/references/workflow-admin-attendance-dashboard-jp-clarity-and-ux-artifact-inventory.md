# admin-attendance-dashboard-jp-clarity-and-ux artifact inventory

## Summary

`docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/` is the active workflow root for the admin attendance dashboard Japanese clarity and UX refinement. The same cycle implements the local `apps/web` presentation-layer changes, focused tests, local Playwright fixture screenshots, design-token gate, implementation-guide validation, and aiworkflow workflow inventory sync. Authenticated staging baseline screenshots, commit, push, and PR remain user-gated.

## Canonical Artifacts

| Classification | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/` |
| root metadata | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/artifacts.json` |
| output metadata mirror | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/artifacts.json` |
| Phase 11 evidence ledger | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-11/manual-test-result.md` |
| Phase 11 screenshot coverage | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-11/screenshot-coverage.md` |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| implementation guide validator | `.claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js` |

## Implementation Targets

| Area | Files |
| --- | --- |
| route header | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` |
| attendance components | `apps/web/src/features/admin/attendance/components/{AttendanceAnalyticsPage,KpiPanel,AttendanceAbsenteeAlert,AttendanceDetailTabs,AttendanceFilterBar,AttendanceTrendChart,AttendanceZoneDistributionChart,SessionAttendanceTable}.tsx` |
| formatting constants | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` |
| CSS rhythm | `apps/web/src/styles/globals.css` |
| focused tests | `apps/web/src/features/admin/attendance/__tests__/{AttendanceDetailTabs,AttendanceZoneDistributionChart,KpiPanel,format-attendance}.spec.tsx?` |
| Playwright fixture assertion | `apps/web/playwright/tests/admin-attendance-dashboard-ux.spec.ts` |

## Evidence

| Check | Result |
| --- | --- |
| focused Vitest | `apps/web/src/features/admin/attendance/__tests__`: 8 files / 23 tests PASS |
| local Playwright fixture screenshots | 6 canonical PNG present in `outputs/phase-11/screenshots/` |
| design token gate | `mise exec -- pnpm verify:tokens`: PASS (`91 tracked`) |
| implementation guide validator | `validate-phase12-implementation-guide.js --workflow ...`: 12/12 PASS |
| API/shared boundary | `git diff --name-only -- apps/api packages/shared`: empty |
| old wording grep | UI-facing old English/jargon removed; residual matches are identifiers/test names only |

## Invariants

- `apps/api`, D1 schema, Google Form schema, and `packages/shared` are unchanged.
- Existing admin attendance endpoint surface and `fetchAttendanceAnalyticsBundle` contract are unchanged.
- No new primitive, component, design token, endpoint, migration, or shared type is introduced.
- Runtime authenticated staging baseline screenshots, commit, push, and PR are user-gated.

## Lessons Learned

| ID | Lesson |
| --- | --- |
| L-AADJP-001 | Implementation-spec workflows must not leave Phase 12 as “docs only / implementation pending” after same-cycle code changes. Metadata, evidence, and aiworkflow workflow inventory must be synchronized in the same cycle. |
| L-AADJP-002 | For wording-only UI tasks, system contract sync may be N/A while workflow inventory sync is still required. These two meanings of “sync” must be separated in Phase 12. |
| L-AADJP-003 | Plain-Japanese label changes should include focused regression assertions for both user-visible text and aria-labels so English/jargon does not drift back in. |
| L-AADJP-004 | When a wording task also touches CSS rhythm (`globals.css` U-01/U-03), jsdom/happy-dom does not evaluate CSS, so Vitest can only assert structure and class presence. Visual rhythm must be verified via the Phase 11 staging screenshots (user-gated), and the change must stay within existing `var(--ubm-color-*)` tokens to pass the `verify-design-tokens` gate without introducing HEX literals. |
