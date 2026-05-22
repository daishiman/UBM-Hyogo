# Public Attendance Privacy Contract

- Public profile response includes `attendance: AttendanceRecord[]` and optional `attendanceMeta`.
- `AttendanceRecord` fields are limited to `sessionId`, `title`, and `heldOn`.
- `attendanceMeta` fields are limited to `hasMore` and `nextCursor`; no public cursor endpoint is added by this task.
- Public eligibility is checked before attendance is returned.
- No `responseEmail`, `audit`, `adminNotes`, `admin_member_notes`, member-only field, or admin-only field may be added to `PublicMemberProfile`.
- `/public/*` remains unauthenticated; session/admin guard must not be added.
- Issue #533 remains CLOSED; PR text uses `Refs #533`.
