# Phase 3 — 設計レビュー

## 観点別チェック

### 不変条件 (CLAUDE.md)
- ✅ #4 admin-managed data 分離: `admin_member_notes` のみで管理。Google Form schema (`member_identities`) は触らない
- ✅ #5 D1 直接アクセス: API route は `apps/api`、Web は admin proxy `/api/admin/*` 経由のみ
- ✅ #11 profile 本文 mutation 不在: 本ワークフローは status と note のみ操作
- ✅ #13 tag 直接更新 不在

### atomicity / 競合
- ✅ D1 batch で member_status と admin_member_notes を 1 トランザクション化
- ✅ 楽観ロック: 最終 UPDATE の `WHERE request_status='pending'` + `meta.changes` 判定
- ✅ レース条件（2 admin 同時 resolve）: 後勝ちで 409 を返す。先勝ちはそのまま resolved 化
- ✅ サブクエリガード: member_status UPDATE は admin_member_notes が pending の場合のみ実行（中間状態を防ぐ）

### セキュリティ
- ✅ requireAdmin middleware で 401/403 切り分け
- ✅ PII raw 値は API レスポンスから除外（`sanitizePayload`）
- ✅ `resolutionNote` は max 500 文字、PII 注意喚起 UI を modal に表示
- ✅ 監査ログ追記（`admin.request.approve` / `admin.request.reject`）

### UX
- ✅ confirmation modal で破壊的操作（特に delete_request）に警告表示
- ✅ 409 → toast + `router.refresh()` で一覧再読込
- ✅ FIFO 順（古い依頼から処理）

### 観測性
- audit のみ。専用メトリクスは現状未追加（将来要件）。

## 残課題 / 将来要件
- 一括承認 UI（複数件まとめて approve）— MVP 範囲外
- reject 後の自動通知（メール）— MVP 範囲外
- pending 件数の sidebar バッジ — MVP 範囲外（将来 GET /admin/requests/count を追加）

## 結論
GO — Phase 4 へ進行。
