# Phase 11 Visual Verification

## Verdict

`completed (local Playwright screenshot captured / Phase 13 user-gated)`.

## Evidence

| Evidence | Path | Result |
| --- | --- | --- |
| Attendance paging screenshot | `outputs/phase-11/screenshots/profile-attendance-paging-desktop.png` | captured |
| Playwright run JSON | `outputs/phase-11/evidence/playwright-report/results.json` | 1 passed / 0 failed |
| Monocart report JSON | `outputs/phase-11/evidence/monocart/index.json` | generated |
| Focused unit evidence | `outputs/phase-11/evidence/vitest-attendance-list.txt` | exit 0 |
| Design token evidence | `outputs/phase-11/evidence/design-token-grep.txt` | exit 0 |

## Command

```bash
PLAYWRIGHT_ATTENDANCE_PAGING_EVIDENCE=1 \
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/parallel-04-attendance-paging-ui/outputs/phase-11/evidence \
ATTENDANCE_PAGING_SCREENSHOT_DIR=../../docs/30-workflows/completed-tasks/parallel-04-attendance-paging-ui/outputs/phase-11/screenshots \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance-paging-ui-evidence.spec.ts --project=desktop-chromium
```

Actual result (2026-05-15 JST): exit 0, 1 passed.

## Visual Scope

- `/profile` with 50 initial attendance records.
- `hasMore=true` button state.
- Additional page append after clicking `もっと見る`.
- `定例会 51` visible after append.
- Design-token classes used for heading, muted date, button, and error text.
