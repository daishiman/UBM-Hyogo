# UT-17 Phase 7: Implementation Summary

Phase 5 計画と Phase 6 テスト ID に従って実コードを `apps/api` 配下に追加した。
Phase 03 design review は NO-GO 判定だが、Phase 04 で確定した「外部操作（T1/T2/T8/T9/T10）はユーザー実施、コード実装（T3-T7, T11）は本サイクルで完成」というスコープ宣言に従い実装している。

## 追加・変更ファイル

### 新規

- `apps/api/src/types/cloudflare-notification.ts`（payload 型 / `AlertMetric`）
- `apps/api/src/lib/cf-webhook-auth.ts`（pure function 検証）
- `apps/api/src/lib/cloudflare-alert-formatter.ts`（payload → 日本語 Slack Block Kit）
- `apps/api/src/lib/slack-sender.ts`（Slack 送信 + retry）
- `apps/api/src/middleware/verify-cf-webhook-auth.ts`（Hono middleware）
- `apps/api/src/routes/internal/alert-relay.ts`（`POST /internal/alert-relay`）
- `apps/api/src/lib/__tests__/cf-webhook-auth.test.ts`
- `apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts`
- `apps/api/src/lib/__tests__/slack-sender.test.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`

### 編集

- `apps/api/src/env.ts` — `Env` に `CF_WEBHOOK_AUTH_SECRET` / `SLACK_WEBHOOK_URL` を追加
- `apps/api/src/index.ts` — `createAlertRelayRoute` を `/internal/alert-relay` に登録

## 設計上のポイント

- **依存注入**: `createAlertRelayRoute({ fetch, sleep, maxRetries, dashboardUrl, runbookUrl })` で fetch / sleep を差し替え可能にし、テストの決定論性を確保。
- **Pure function 化**: cf-webhook-auth 検証 / metric 分類 / Block Kit 生成 はすべて副作用を持たない pure function。Hono に依存する middleware / route 層と分離する。
- **日本語化**: METRIC_LABELS で日本語ラベルを正本管理。`text` / `header` / `fields` 全てに日本語を含み、数値は `toLocaleString("ja-JP")` でカンマ区切り整形。
- **Severity 判定**: payload.severity に "critical"/"high" を含むか、または現在値/閾値比 ≥ 0.95 で CRITICAL 判定。それ以外は WARNING。
- **Retry**: 4xx は即失敗（再送禁止）、5xx と network error のみ exponential backoff（200ms / 500ms / 1500ms）で最大 3 回。
- **設定欠落の挙動**: `CF_WEBHOOK_AUTH_SECRET` 未設定は 500（misconfiguration）/ `SLACK_WEBHOOK_URL` 未設定は 503（依存サービス未設定）として区別。

## ローカル検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test
```

両方 PASS であることを次節 Phase 8 で確認する。

## 外部操作残（次サイクル / ユーザー実施）

- T1: 1Password に `SLACK_WEBHOOK_URL` 登録
- T2: Cloudflare Secrets に `CF_WEBHOOK_AUTH_SECRET` / `SLACK_WEBHOOK_URL` 投入（`bash scripts/cf.sh secret put` × staging/production）
- T8: staging deploy + curl 検証
- T9: Cloudflare Dashboard で Notification Policy 4 種設定
- T10: production deploy + Notification Policy 切替
