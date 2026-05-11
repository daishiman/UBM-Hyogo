# UT-17 Phase 8: Integration Check

## ローカル検証結果

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `mise exec -- pnpm exec vitest run apps/api/src/lib/__tests__/cf-webhook-auth.test.ts apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts apps/api/src/lib/__tests__/slack-sender.test.ts apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | PASS（33/33） |

## 統合確認項目

- `app.route("/internal/alert-relay", createAlertRelayRoute())` が `apps/api/src/index.ts` に追加済み。
- `Env` interface に `CF_WEBHOOK_AUTH_SECRET` / `SLACK_WEBHOOK_URL` を追加済み（`apps/api/src/env.ts`）。
- `apps/web` 側への変更なし（不変条件 #5: D1 アクセス境界 / web からの env import 禁止に準拠）。
- D1 アクセスなし（本タスクは relay のみ）。

## 既存テストの挙動について

`pnpm --filter @ubm-hyogo/api test` をフルで実行すると一部 auth/admin 系テストが `EADDRNOTAVAIL 127.0.0.1` で fail することがある。これは miniflare/undici の port 枯渇に起因する既存不安定性で、本タスクの変更前から発生する。本タスクで追加・変更した module の focused tests（33 ケース）は全て独立 PASS することを確認している。

## 外部統合テスト（未実施 / ユーザー実施）

T8: staging deploy 後、以下 curl で実通信確認:

```bash
curl -X POST "https://ubm-hyogo-api-staging.<account>.workers.dev/internal/alert-relay" \
  -H "cf-webhook-auth: $CF_WEBHOOK_AUTH_SECRET" \
  -H "content-type: application/json" \
  -d '{"name":"Workers Daily Requests Approaching Limit","data":{"current":80000,"threshold":100000},"severity":"warning"}'
```

期待: 200 / `{"ok":true,"attempts":1}`、Slack staging channel に日本語通知到達。
