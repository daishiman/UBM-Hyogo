# Implementation Guide

## Part 1: 中学生レベル

学校の出席簿を考える。先生は「いつ集まりがあったか」と「誰が来たか」を名簿とは別のノートに書く。06c-E は、このノートを管理画面で使えるようにする作業である。

会員プロフィールは本人が書く Google フォームが正本だが、支部会の開催日と参加履歴は管理者が記録する。だから `meeting_sessions` は「集まりの日付ノート」、`member_attendance` は「その日に来た人の印」として分けて保存する。

専門用語の言い換え:

| 用語 | 言い換え |
| --- | --- |
| D1 | クラウド上の表 |
| table | 表 |
| migration | 表の形を変える手順 |
| API | 画面と表の間の窓口 |
| CSV | 表計算ソフトで開ける一覧ファイル |

## Part 2: 技術者レベル

変更点:

- `apps/api/migrations/0013_meeting_sessions_soft_delete.sql`: `meeting_sessions.deleted_at` と active index を追加。
- `apps/api/src/repository/meetings.ts`: `updateMeeting`, `listMeetingAttendanceForExport` を追加。
- `apps/api/src/routes/admin/meetings.ts`: `PATCH /admin/meetings/:id`, `POST /admin/meetings/:id/attendances`, `GET /admin/meetings/:id/export.csv` を追加。
- `apps/web/src/lib/admin/api.ts`: `updateMeeting` helper を追加。
- `apps/web/src/components/admin/MeetingPanel.tsx`: edit details / soft delete / CSV link を追加。

Scope note: `packages/shared` の `MeetingSession` / `MeetingSessionZ` は public/profile attendance 用の既存契約として維持する。06c-E の admin meetings response は `apps/api/src/repository/meetings.ts` と `apps/web/src/components/admin/MeetingPanel.tsx` の local view type が正本であり、`deletedAt` は admin soft-delete mutation / audit 境界だけで扱う。

API contract:

```ts
PATCH /admin/meetings/:id
body: { title?: string; heldOn?: "YYYY-MM-DD"; note?: string | null; deletedAt?: string | null }

POST /admin/meetings/:id/attendances
body: { memberId: string; attended: boolean }

GET /admin/meetings/:id/export.csv
columns: meetingId, heldOn, memberId, displayName, attended
```

Error boundaries: unknown / soft-deleted meeting = 404, unknown member = 404, invalid PATCH / attendances body = 422, duplicate attendance = 409, deleted member = 422.
