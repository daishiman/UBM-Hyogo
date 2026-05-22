# Local Check Result

Status: `local_checks_passed_commit_pr_user_gated`

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm typecheck` | PASS | `outputs/phase-11/evidence/typecheck.log` |
| `pnpm lint` | PASS | `outputs/phase-11/evidence/lint.log` |
| `pnpm exec vitest run ...useConfirmDialog...ConfirmDialog...MeetingPanel...MeetingAttendancePanel` | PASS: 4 files / 52 tests | `outputs/phase-11/evidence/test.log` |
| `pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS: 9 tests | `outputs/phase-11/evidence/design-tokens.log` |
| `pnpm --filter @ubm-hyogo/web build` with explicit local env | PASS | `outputs/phase-11/evidence/build-web-local.log` |
| `PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002 ... playwright test playwright/tests/attendance.spec.ts --project=desktop-chromium` | PASS: 5 tests | `outputs/phase-11/evidence/e2e-attendance.log` |

Root `pnpm build` without env is recorded in `outputs/phase-11/evidence/build.log` and failed because required local env vars were absent. This is not a code regression; the env-explicit web build passed.

Commit / push / PR are not executed.
