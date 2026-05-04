# Phase 2 Output: 設計

Status: completed

採用設計:

- 物理 table は `meeting_sessions` / `member_attendance`。
- `meeting_sessions.deleted_at` を追加し、一覧は `deleted_at IS NULL` のみ返す。
- API は既存 `/admin/meetings` route に PATCH / attendances alias / CSV export を追加する。
- web は既存 `MeetingPanel` に編集 details と CSV link を追加し、D1 直参照は行わない。
