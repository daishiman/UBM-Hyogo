# Phase 2 Writer Contract

判定: resolved_by_existing_contract

新規 `AttendanceWriter` interface は追加しない。write 正本は `apps/api/src/repository/attendance.ts` の `addAttendance` / `removeAttendance` とし、`AttendanceRecordId` は導入しない。

| contract | 正本 |
| --- | --- |
| add | `addAttendance(c, memberId, sessionId, by)` |
| remove | `removeAttendance(c, memberId, sessionId)` |
| duplicate | repository: `{ ok: false, reason: "duplicate", existing }`; route: HTTP 409 `attendance_already_recorded` |
| deleted member | repository: `deleted_member`; route: HTTP 422 `member_is_deleted` |
