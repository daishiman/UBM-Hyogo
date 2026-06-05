# workflow artifact inventory — admin-meetings-attendance-404-fix-and-ux

| key | value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| purpose | staging `/admin/meetings` の開催日追加 404 を admin proxy transport 非対称（Server Component GET = service binding / Client mutation POST = HTTP fallback）として修正し、出席管理 UI の発見性を改善する |
| implementation targets | `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/app/api/admin/[...path]/route.spec.ts`, `apps/web/src/features/admin/components/_meetings/{MeetingAttendanceDrawer,MeetingTimeline,MeetingsClientShell}.tsx`, `_meetings/__tests__/{MeetingAttendanceDrawer,MeetingTimeline,MeetingsClientShell}.spec.tsx` |
| invariant | apps/api endpoint / D1 schema / Google Form schema / `apps/web/src/lib/admin/api.ts` attendance path / `useAdminMutation` hook unchanged |
| local evidence | focused Vitest 4 files / 15 tests PASS: route proxy 6 tests, MeetingTimeline 6 tests, MeetingAttendanceDrawer 2 tests, MeetingsClientShell 1 test; web typecheck PASS; web lint PASS; verify:phase12-compliance PASS |
| runtime boundary | staging deploy, authenticated `/admin/meetings` POST 201 proof, screenshots, commit, push, PR are user-gated |

## Notes

- `apps/web/app/api/admin/[...path]/route.ts` now prefers `getAuthEnv().API_SERVICE.fetch("https://service-binding.local/admin/...")` outside local/test HTTP override contexts, then falls back to `INTERNAL_API_BASE_URL`, then fails fast with `internal_api_base_url_missing`.
- `MeetingTimeline` exposes attendance count via `getAttendanceCount` and an accessible "出席を記録・編集" label.
- `MeetingAttendanceDrawer` resolves attendee names from existing candidates and keeps memberId as secondary text.
