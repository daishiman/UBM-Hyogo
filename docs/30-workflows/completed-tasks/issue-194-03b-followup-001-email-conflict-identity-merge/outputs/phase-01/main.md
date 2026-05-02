# Phase 1: 要件定義 — 実行記録（実装済 reflect）

## 状態
実施済み。実装は本サイクルで完了済み。spec は実装結果と整合済。

## 真因
`apps/api/src/jobs/sync-forms-responses.ts` の `classifyError()` が UNIQUE / constraint 違反を
`EMAIL_CONFLICT` に分類し `sync_jobs.error_json` に記録するに留まっており、admin による手動 merge
経路が未確定だった。

## scope（確定）
- name + 所属 (`fullName` / `occupation`) の `trim` + `NFKC` 正規化後の完全一致を第一段階の重複候補とする
- admin route 3 系統を新設: list / merge / dismiss
- merge transaction は `identity_aliases` (canonical alias) と `identity_merge_audit` を `db.batch` で atomic に書く
- 既存 `member_responses` / `response_fields` / `member_status` の本文は更新しない（不変条件 #11）
- responseEmail は API 側で部分マスク（`maskResponseEmail`）して返却（不変条件 #3）
- merge `reason` は email / 電話 regex で `[redacted]` 置換

## AC 達成状況（evidence: 実装ファイル）
- [x] 重複候補判定 spec の明文化 → `apps/api/src/services/admin/identity-conflict-detector.ts`
- [x] `GET /admin/identity-conflicts`（cursor pagination） → `apps/api/src/routes/admin/identity-conflicts.ts`
- [x] `POST /admin/identity-conflicts/:id/merge`（D1 batch atomic） → `apps/api/src/repository/identity-merge.ts`
- [x] `POST /admin/identity-conflicts/:id/dismiss` → `apps/api/src/repository/identity-conflict.ts`
- [x] `identity_aliases.source_member_id -> target_member_id` 永続化 → `apps/api/migrations/0011_identity_aliases.sql`
- [x] response 本文は移動・編集なし（merge 関数内で `member_responses` / `response_fields` / `member_status` への UPDATE 一切なし）
- [x] canonical 解決: `resolveCanonicalMemberId()` → `apps/api/src/repository/identity-merge.ts`
- [x] `identity_merge_audit` 永続化 → `apps/api/migrations/0010_identity_merge_audit.sql`
- [x] `audit_log` への二重ガード（`action='identity.merge'`） → `apps/api/src/repository/identity-merge.ts` 末尾の `appendAuditLog`
- [x] admin UI（二段階確認 + 別人マーク） → `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` + `apps/web/src/components/admin/IdentityConflictRow.tsx`
- [x] `requireAdmin` middleware 配下 mount → `apps/api/src/index.ts:226`
- [x] apps/web は generic proxy `[...path]` 経由（D1 直参照なし）
- [x] responseEmail 部分マスク（`maskResponseEmail`） → `packages/shared/src/schemas/identity-conflict.ts`

## 自走禁止操作（未実施）
- 実機 D1 migration apply（local in-memory のみで検証）
- production deploy
- commit / push / PR 作成
- production secret の参照

## 引き渡し
- Phase 2 へ: 実コード抽出済の関数シグネチャ / DDL / route 契約
