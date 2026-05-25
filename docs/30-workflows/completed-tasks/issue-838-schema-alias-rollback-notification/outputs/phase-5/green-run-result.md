# Phase 5 GREEN 実行記録 — issue-838-schema-alias-rollback-notification

> 実行日時: 2026-05-24（worktree: task-20260524-001616-wt-2）

## サマリー

| 検証 | コマンド | 結果 |
| --- | --- | --- |
| 新規 unit spec | `vitest run --root=../.. --config=vitest.config.ts apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | PASS: 1 file, 5 tests |
| 通知 + rollback route フォーカス | `vitest run ... schemaAliasRollbackNotification.spec.ts schema.rollback.spec.ts` | PASS: 2 files, 13 tests |
| apps/api 全テスト（回帰） | `pnpm --filter @ubm-hyogo/api test` | PASS: 58 files, 375 tests |
| 型チェック | `pnpm typecheck` | PASS（apps/api 含む全 6 workspace 0 エラー） |
| リント | `pnpm lint` | PASS（dependency-cruiser 0 violation / stablekey-lint OK / eslint OK） |

## 変更ファイル一覧（git 確認済み）

### 新規

| ファイル | 役割 |
| --- | --- |
| `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | best-effort 通知 dispatch / payload 構築 / redactRollbackActor / audit 記録 |
| `apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | unit spec（5 test: Slack 優先 / mail fallback / skipped / failed sanitize / audit 記録）|
| `apps/api/.dev.vars.example` | 通知関連 secret/var の op 参照テンプレート（実値なし）|

### 修正

| ファイル | 変更内容 |
| --- | --- |
| `apps/api/src/routes/admin/schema.ts` | rollback 成功後の best-effort dispatch + audit 記録を try/catch 隔離で追加（+28 行）|
| `apps/api/src/routes/admin/_shared.ts` | `AdminRouteEnv` に通知 env（`SLACK_WEBHOOK_INCIDENT` / `SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `OPS_NOTIFICATION_EMAIL`）を optional 追加（+5 行）|
| `apps/api/wrangler.toml` | production / staging 両 `[env.*.vars]` に `OPS_NOTIFICATION_EMAIL = ""` を追記（+6 行）|
| `apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts` | rollback audit の action 絞り込み + skipped notification audit 回帰テスト追加（+36 行）|

## DoD 達成状況

- [x] `schemaAliasRollbackNotification.ts` の全エクスポート関数を実装
- [x] unit spec 全 it ブロック GREEN（5/5 PASS）
- [x] rollback route に best-effort dispatch + audit 記録を追加
- [x] `AdminRouteEnv` に通知 env を型追加
- [x] `wrangler.toml` に `OPS_NOTIFICATION_EMAIL` vars を追記
- [x] `.dev.vars.example` に通知設定の op 参照を追記
- [x] `pnpm typecheck` 0 エラー
- [x] `pnpm lint` 0 エラー
- [x] `pnpm --filter @ubm-hyogo/api test` 全 375 件 PASS（回帰なし）

## best-effort 隔離の確認（AC-3）

二重隔離が実装されていることを確認:
1. `dispatchSchemaAliasRollbackNotification` は内部で Slack/mail の例外を catch し、必ず `RollbackNotificationResult` を返す（throw しない）。
2. route 層で `dispatch` + `recordRollbackNotificationAudit` 全体を `try/catch` で囲み、例外を swallow して `c.json(result, 200)` を返す。

rollback の D1 batch は dispatch より前に commit 済みのため、通知の失敗は rollback result（200）に影響しない。
