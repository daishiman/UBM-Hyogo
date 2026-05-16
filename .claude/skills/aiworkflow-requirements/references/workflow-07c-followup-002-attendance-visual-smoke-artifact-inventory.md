# 07c Follow-up 002 Attendance Visual Smoke Artifact Inventory

> Status: `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / local_visual_evidence_pass`
> Date: 2026-05-15
> Source issue: #313 CLOSED; PR text uses `Refs #313`.

## Canonical Workflow

| Artifact | Role |
| --- | --- |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/index.md` | Workflow index and phase status ledger |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/artifacts.json` | Root metadata ledger |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/artifacts.json` | Output mirror metadata ledger |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-12/phase12-task-spec-compliance-check.md` | 9-heading compliance verdict |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/web/playwright/tests/attendance.spec.ts` | Focused 4-test visual smoke |
| `apps/web/playwright/fixtures/admin-meetings.ts` | Attendance scenario seed builder |
| `apps/web/playwright/fixtures/auth.ts` | Standalone mock API and seed/reset controls |
| `apps/web/playwright/page-objects/AdminMeetingsPage.ts` | Detail/list page object actions and assertions |
| `apps/web/src/components/admin/MeetingPanel.tsx` | List-page attendance selector exposure |
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | Detail-page `/attendances` mutation alignment |
| `apps/web/playwright.config.ts` | Evidence directory and attendance smoke readiness alignment |
| `apps/api/src/routes/admin/meetings.ts` | Detail `GET /admin/meetings/:id` route and attendance alias contract alignment |
| `apps/api/src/routes/admin/meetings.contract.spec.ts` | Detail route and attendance alias contract tests |
| `.github/workflows/playwright-smoke.yml` | Focused attendance visual smoke CI step |

## Evidence Artifacts

| Path | Role |
| --- | --- |
| `outputs/phase-11/screenshots/attendance-deleted-excluded.png` | Deleted member excluded evidence |
| `outputs/phase-11/screenshots/attendance-already-registered.png` | Already registered evidence |
| `outputs/phase-11/screenshots/attendance-dup-1.png` | Duplicate flow before second registration |
| `outputs/phase-11/screenshots/attendance-dup-2.png` | Duplicate toast evidence |
| `outputs/phase-11/screenshots/attendance-delete-before.png` | List delete before-state |
| `outputs/phase-11/screenshots/attendance-delete-after.png` | List delete after-state |
| `outputs/phase-11/trace/attendance-delete-trace.zip` | Delete-flow Playwright trace |
| `outputs/phase-11/e2e-run.txt` | Focused Playwright command output |
| `outputs/phase-11/e2e-list.txt` | Test discovery output |
| `outputs/phase-11/e2e-skip-count.txt` | Skip/TODO count evidence |
| `outputs/phase-11/runner-version.txt` | Playwright runner version |
| `outputs/phase-11/verify-design-tokens.txt` | Design-token verification output |
| `outputs/phase-11/phase11-capture-metadata.json` | Evidence provenance (`local-mock`) |
| `outputs/phase-11/screenshot-plan.json` | Screenshot capture plan |

## Boundaries

- Existing admin meetings API surface is preserved and completed: `/admin/meetings`, `/admin/meetings/:id`, and `POST /admin/meetings/:id/attendances`.
- Singular `/admin/meetings/:id/attendance` is not canonical.
- Baseline update, GitHub Actions CI smoke, staging replacement, commit, push, and PR are user-gated.
