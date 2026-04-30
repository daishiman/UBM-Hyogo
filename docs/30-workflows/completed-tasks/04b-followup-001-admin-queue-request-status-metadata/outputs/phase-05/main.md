# Phase 5: 実装ランブック — 成果物サマリ

## 実装手順（実行済み）

1. `apps/api/migrations/0007_admin_member_notes_request_status.sql` を新規作成（DDL + backfill + partial index）
2. `apps/api/src/repository/adminNotes.ts` を改修
   - `RequestStatus` 型と `AdminMemberNoteRow` の 3 列追加
   - `SELECT_COLS` に新列を追加し `toRow` で normalize
   - `create` で `noteType !== 'general'` のとき `request_status='pending'` を INSERT
   - `hasPendingRequest` を `request_status='pending'` の SELECT 1 LIMIT 1 に書き換え
   - `markResolved` / `markRejected` を新規追加（`WHERE request_status='pending'` で単方向遷移を構造保証）
3. テスト追加（adminNotes.test.ts / routes/me/index.test.ts）
4. spec 追記（07-edit-delete.md）

詳細 runbook は `migration-runbook.md` を参照。
