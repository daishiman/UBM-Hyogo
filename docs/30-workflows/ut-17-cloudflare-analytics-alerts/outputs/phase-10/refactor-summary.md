# UT-17 Phase 10: Refactor Summary

## 適用したリファクタ

1. **依存注入の徹底**: `createAlertRelayRoute(deps)` で fetch / sleep / dashboardUrl / runbookUrl / maxRetries を全て optional 注入可能に。テストの決定論性とカスタマイズ性を両立。
2. **責務分離**: 認証 (`cf-webhook-auth.ts` / `verify-cf-webhook-auth.ts`)、整形 (`cloudflare-alert-formatter.ts`)、送信 (`slack-sender.ts`)、ルーティング (`alert-relay.ts`) を 1 ファイル 1 責務で分割。
3. **`exactOptionalPropertyTypes` 対応**: 親 deps から子 options への undefined パススルーを明示的にフィルタする helper パターンを採用（`alert-relay.ts` の `fmtOptions` / `sendOptions` 構築）。tsconfig 厳格モードに適合。
4. **METRIC_LABELS の正本化**: 日本語ラベルを Record で集約し、テストとも整合。新規メトリクス追加時は labels と classifier の 2 箇所のみ更新で完結。
5. **severity の 2 経路判定**: payload.severity が信頼できる場合と、現在値/閾値比から推定する場合を共通関数に集約。

## 適用しなかった事項（意図）

- Hono の error-handler に集約せず、route handler 内で 400/401/500/502/503 を明示的に返す: relay は 1 endpoint のみで責務がシンプルなため、共通 handler 経由の抽象化は過剰。
- formatter の i18n 化（多言語対応）: 不変条件 #6（日本語必須）と矛盾するため、English fallback を残さない。
- 構造化 logger 経由のログ出力: 既存 `apps/api/src/lib/logger.ts` は別 PR で導入された既存 utility だが、本タスクは「Slack へ送ること」自体が観測手段のため、追加ロギングは導入しない（過剰実装の回避）。

## 不変条件の最終チェック

| 不変条件 | 状態 |
| --- | --- |
| D1 直接アクセスは `apps/api` に閉じる | OK（本タスクは D1 アクセスなし） |
| Secret は 1Password → Cloudflare Secrets / `.env` は `op://` のみ | OK（コードに実値なし） |
| Cloudflare CLI は `bash scripts/cf.sh` 経由のみ | OK（外部操作 T2/T8/T10 で遵守宣言） |
| UT-08 と責務重複なし | OK（本タスクは Cloudflare native usage alerts のみ） |
| Slack メッセージは日本語 + 必須項目 | OK（METRIC_LABELS / fields に閾値 / 残量を含む） |
| cf-webhook-auth 固定シークレット必須 | OK（middleware で 401） |
