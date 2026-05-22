# Phase 1: 要件・現状把握

[実装区分: 実装仕様書]

## 1. インシデント要約
- 発生 job: `backend-ci → runtime smoke staging / smoke` (PR #853 / run #507)
- exit code: 1（`scripts/smoke/runtime-attendance-provider.sh` の `fail_and_exit`）
- 失敗ライン: `request_json "admin-list" "$BASE/admin/members" "$STAGING_ADMIN_BEARER" '.members | type == "array"' '.members | length'`
- 出力メッセージ: `FAIL: admin-list http=500 contract=.members | type == "array"`
- `assert_staging_target` は通過済み（marker 200 + `.environment == "staging"`） → staging 接続自体は健全

## 2. 既知事実
- `GET /admin/members` のハンドラは `apps/api/src/routes/admin/members.ts:215-306`
- 500 は次のいずれかで返る:
  - `c.json({ ok:false, error:parsedView.error.message }, 500)` — zod `AdminMemberListViewZ.safeParse` 失敗（明示 500）
  - middleware `requireAdmin` / `attendanceProviderMiddleware` / `writeTagNoteProviderMiddleware` 内 throw
  - D1 `.prepare(...).first<>()` / `.all<>()` の例外（テーブル不存在・列不存在・SQL syntax）→ Hono default error → 500
- middleware は `app.use("*", ...)` で 3 段、`requireAdmin` 通過後に provider bind

## 3. 仮説（優先順位）
1. **staging D1 schema drift**: `member_status` / `member_responses` / `identity_aliases` / `member_tags` / `tag_definitions` の列・テーブル欠落
2. **AdminMemberListViewZ.safeParse 失敗**: `member_status.publish_state` などが想定外値（`null` 以外で enum 不一致）、`lastSubmittedAt` の ISO 化失敗
3. **provider middleware**: `attendanceProvider` / `writeTagNoteProvider` 注入 throw（staging のみで発火する初期化エラー）
4. **fetch 上流の Workers binding 障害**: `c.env.DB` 不在（wrangler env config 差分）

## 4. 未確定事項（Phase 2 で確認）
- staging API 実 URL（`STAGING_API_BASE` の値そのものは secret だが allow_regex は staging|127.0.0.1|localhost）
- 実 staging のレスポンス body（500 の `error` メッセージ）— smoke は body を保存しない
- 直近の staging D1 migration apply 状況（`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging`）

## 5. Phase 1 DoD
- 仮説 4 件と検証経路が列挙されている
- 影響 API endpoint surface が `GET /admin/members` に確定
- staging D1 / Workers binding を read-only で覗くコマンドが Phase 2 でリスト化される
