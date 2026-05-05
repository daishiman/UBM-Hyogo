# Documentation Changelog

| 日付 | ファイル | 種別 | 内容 |
| --- | --- | --- | --- |
| 2026-04-30 | `docs/00-getting-started-manual/specs/07-edit-delete.md` | 追記 | 申請 queue の状態遷移節（Mermaid + 列定義 + 不変条件参照） |
| 2026-04-30 | `apps/api/migrations/0007_admin_member_notes_request_status.sql` | 新規 | request_status / resolved_at / resolved_by_admin_id の追加 |
| 2026-04-30 | `apps/api/src/repository/adminNotes.ts` | 改修 | `RequestStatus` / `markResolved` / `markRejected` 追加、`hasPendingRequest` を pending 限定化 |
| 2026-04-30 | `outputs/phase-*` | 新規 | フェーズ 1〜12 の成果物群 |
