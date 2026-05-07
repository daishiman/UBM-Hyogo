# Phase 12 Task Spec Compliance Check

| Check | Result | Evidence |
| --- | --- | --- |
| Root artifacts present | PASS | `artifacts.json` exists |
| outputs artifacts parity present | PASS | `cmp -s artifacts.json outputs/artifacts.json` expected exit 0 after mirror refresh |
| Phase 12 strict 7 files | PASS | `main.md` + 6 companion files exist |
| taskType fixed | PASS | `implementation` |
| visualEvidence fixed | PASS | `VISUAL_ON_EXECUTION` |
| Runtime PASS not claimed | PASS | Phase 11 records local test evidence only; curl / screenshot runtime PASS remains pending |
| SQL schema aligned | PASS | `meeting_sessions.session_id` used |
| Index policy aligned | PASS | new `idx_member_attendance_member` only; existing indexes reused |
| Web proxy aligned | PASS | existing `apps/web/app/api/admin/[...path]/route.ts` reused |
| aiworkflow same-wave sync | PASS | quick-reference / resource-map / task-workflow-active / changelog updated |
| manual spec same-wave sync | PASS | `01-api-schema.md` / `08-free-database.md` updated |

## Four Conditions

| Condition | Result |
| --- | --- |
| 矛盾なし | PASS |
| 漏れなし | PASS |
| 整合性あり | PASS |
| 依存関係整合 | PASS for attendance scope; WORKTREE-WIDE BLOCKED by pre-existing deletion diffs in unrelated workflow roots that were not reverted without explicit user approval |
