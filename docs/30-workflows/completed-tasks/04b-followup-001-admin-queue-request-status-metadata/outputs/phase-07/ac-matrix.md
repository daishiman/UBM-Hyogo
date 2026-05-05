# AC × 検証 × 実装トレース

| AC | 内容 | 実装箇所 | 検証 |
| --- | --- | --- | --- |
| AC-1 | 3 列追加、general 行は NULL 維持 | migration 0007 / `adminNotes.create` | `adminNotes.test.ts` "AC-1: general 行は ... 全て NULL" |
| AC-2 | 既存 visibility/delete 行を pending に backfill | migration 0007 `UPDATE ... WHERE note_type IN (...)` | runbook の検証 SQL（`SELECT COUNT(*) ... = 0`） |
| AC-3 | `hasPendingRequest` は `request_status='pending'` 限定 | `adminNotes.hasPendingRequest` | `adminNotes.test.ts` "create で visibility/delete request type ..." / "AC-7: ..." |
| AC-4 | `markResolved` で 3 列が更新、general/未知 id は null | `adminNotes.markResolved` | "AC-4: markResolved で pending → resolved" / "AC-4: general 行への markResolved は null" |
| AC-5 | `markRejected` で 3 列更新 + reason を body 末尾追記 | `adminNotes.markRejected` | "AC-5: markRejected で pending → rejected" |
| AC-6 | `pending → *` のみ許容 | 全 helper の `WHERE request_status='pending'` | "AC-6: resolved 行への再 markResolved / markRejected は null" |
| AC-7 | resolved のみの member は再申請 202 | 既存 route + 新 hasPendingRequest 挙動 | `routes/me/index.test.ts` "AC-7: resolved 行のみ存在する member は再申請が 202" |
| AC-8 | pending 行ありは 409 | 既存 route 動作維持 | "F-7: 二重申請は 409 DUPLICATE_PENDING_REQUEST" |
| AC-9 | partial index `idx_admin_notes_pending_requests` 作成 | migration 0007 `CREATE INDEX IF NOT EXISTS ... WHERE request_status='pending'` | runbook の `EXPLAIN QUERY PLAN` |
| AC-10 | typecheck / lint / vitest green | — | `pnpm typecheck` PASS / vitest 407 tests pass |
| AC-11 | spec 07 に状態遷移節追記 | `docs/00-getting-started-manual/specs/07-edit-delete.md` | spec ファイル diff |
