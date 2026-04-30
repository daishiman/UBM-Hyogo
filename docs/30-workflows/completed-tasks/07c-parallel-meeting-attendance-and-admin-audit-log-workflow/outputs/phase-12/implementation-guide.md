# Implementation Guide

## Part 1: 初学者向け

これは出席簿の実装です。同じ人を同じ会に 2 回書けないようにし、退会済みの人を候補に出さず、誰が出席を追加・削除したかを変更ノートに残します。UNIQUE 制約は「同じ欄に同じ名前を 2 回書けないルール」、audit log は「あとから確認できる変更ノート」です。

## Part 2: 開発者向け

変更ファイル:

- `apps/api/src/repository/attendance.ts`
- `apps/api/src/routes/admin/attendance.ts`
- `apps/api/src/repository/attendance.test.ts`
- `apps/api/src/routes/admin/attendance.test.ts`

主要型:

```ts
interface MemberAttendanceRow {
  memberId: MemberId;
  sessionId: string;
  assignedAt: string;
  assignedBy: string;
}

type AddAttendanceResult =
  | { ok: true; row: MemberAttendanceRow }
  | { ok: false; reason: "duplicate"; existing: MemberAttendanceRow }
  | { ok: false; reason: "deleted_member" | "session_not_found" };

interface AttendableMember {
  memberId: MemberId;
  fullName: string;
  occupation: string;
}
```

API:

- `GET /admin/meetings/:sessionId/attendance/candidates`
- `POST /admin/meetings/:sessionId/attendance`
- `DELETE /admin/meetings/:sessionId/attendance/:memberId`

Request / response:

```http
GET /admin/meetings/s1/attendance/candidates
200 { "ok": true, "items": [{ "memberId": "m1", "fullName": "", "occupation": "" }] }
404 { "ok": false, "error": "session_not_found" }

POST /admin/meetings/s1/attendance
{ "memberId": "m1" }
201 { "ok": true, "attendance": { "meetingSessionId": "s1", "memberId": "m1", "attendedAt": "...", "createdAt": "...", "assignedBy": "admin@example.com" } }
400 invalid JSON / invalid body
404 member_not_found / session_not_found
409 attendance_already_recorded + existing
422 member_is_deleted

DELETE /admin/meetings/s1/attendance/m1
200 { "ok": true, "attendance": { ...removedRow } }
404 attendance_not_found
```

Edge cases:

- Duplicate add is resolved by the `(member_id, session_id)` primary key and returns `409` with the existing row.
- Deleted members are rejected in `addAttendance()` and excluded from candidates.
- Candidates now validate `meeting_sessions` existence before returning a list.
- DELETE intentionally aggregates missing session/member/row into `attendance_not_found`; it removes an attendance row, not a member or meeting resource.
- `fullName` and `occupation` are placeholder fields until the response projection integration is completed.

検証:

```bash
pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/routes/admin/attendance.test.ts apps/api/src/repository/attendance.test.ts
```

新規 secret はなし。成功した add/remove のみ `attendance.add` / `attendance.remove` を `audit_log` に記録する。

Visual evidence:

- 07c is NON_VISUAL because the diff is API-only.
- Phase 11 evidence is `outputs/phase-11/evidence/vitest-attendance-smoke.txt`.
- `/admin/meetings` browser screenshot is delegated to 08b Playwright E2E / 09a staging smoke.
