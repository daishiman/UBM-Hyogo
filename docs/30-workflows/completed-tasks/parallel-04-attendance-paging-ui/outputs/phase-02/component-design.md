# Phase 2 Component Design

`AttendanceList` receives `MemberProfile["attendance"]` and optional `MemberProfile["attendanceMeta"]` from the profile Server Component.

State:

- `items`: rendered attendance records
- `cursor`: next opaque cursor
- `hasMore`: button visibility
- `loading`: disabled/loading label
- `error`: `role="alert"` message

The browser fetch target is `/api/me/attendance?cursor=${encodeURIComponent(cursor)}`.

