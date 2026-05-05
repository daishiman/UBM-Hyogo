# Phase 2: 設計 — 成果物サマリ

## 採用案

「列追加 + repository guard」案を採用。CHECK 制約は SQLite ALTER TABLE での後付けが
困難なため避け、enum は zod / repository helper 入口で守る（`markResolved` / `markRejected`
の `WHERE request_status='pending'` で構造的にガード）。

## 主要モジュール

| ファイル | 変更種別 | 責務 |
| --- | --- | --- |
| `apps/api/migrations/0007_admin_member_notes_request_status.sql` | 新規 | 列追加 + backfill + partial index |
| `apps/api/src/repository/adminNotes.ts` | 改修 | `RequestStatus` 型追加 / Row interface 拡張 / `hasPendingRequest` を pending 限定化 / `markResolved` / `markRejected` 追加 |
| `apps/api/src/repository/__tests__/adminNotes.test.ts` | 追記 | state transition / 再申請 / pending ガードの単体テスト |
| `apps/api/src/routes/me/index.test.ts` | 追記 | 「resolved 後の再申請が 202 で成功」ケース |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | 追記 | 状態遷移節 + Mermaid + 列定義 |

詳細 DDL / interface / Mermaid 図は `state-machine.md` を参照。
