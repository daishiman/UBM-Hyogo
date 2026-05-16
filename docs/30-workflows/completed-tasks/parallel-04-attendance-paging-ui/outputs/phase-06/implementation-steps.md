# Phase 6 Implementation Steps

1. Add or verify `MeAttendancePageResponse` in `apps/web/src/lib/api/me-types.ts`.
2. Render `AttendanceList` from `apps/web/app/profile/page.tsx` with `profile.attendance` and `profile.attendanceMeta`.
3. In `AttendanceList`, guard `loadMore` with `!hasMore || !cursor || loading`.
4. Fetch `/api/me/attendance?cursor=<encoded opaque cursor>`.
5. Append records, update `nextCursor`, update `hasMore`.
6. Render error with `role="alert"` and keep retry possible.
7. Keep `it.todo` / `test.todo` count at zero.

