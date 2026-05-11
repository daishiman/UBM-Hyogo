# UT-17 Phase 4: Task Breakdown (T1〜T11)

Phase 02 設計（`relay-worker-design.md` / `slack-message-format.md` / `secret-management.md` / `alert-policy-matrix.md`）を入力として、UT-17 の実装作業を SRP で T1〜T11 へ分解する。本サイクルで実装するのは T3〜T7 と T11 のローカル完結部分であり、T1 / T2 / T8 / T9 / T10 はユーザー側の外部操作（1Password 登録 / Cloudflare Secrets 投入 / Dashboard 設定 / staging・production deploy）として宣言する。

## サブタスク一覧

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD | 本サイクル実施 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | Slack Incoming Webhook URL 取得 + 1Password 登録 | Webhook URL の保管 | 1Password Vault | Phase 03 GO | 0.5h | `op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL` 登録、`.dev.vars.example` に op:// 参照 | NO（外部） |
| T2 | `CF_WEBHOOK_AUTH_SECRET` 生成 + Cloudflare Secrets 投入 | 共有 secret 投入 | `bash scripts/cf.sh secret put` × staging / production | T1 | 0.5h | `cf.sh secret list --env <env>` に表示 | NO（外部） |
| T3 | リレー Worker 雛形作成 (Hono route) | URL surface 確定 | 新規 `apps/api/src/routes/internal/alert-relay.ts`、編集 `apps/api/src/index.ts` | T2 | 1h | `POST /internal/alert-relay` 200 / typecheck PASS | YES |
| T4 | cf-webhook-auth 検証 middleware | header 検証 | 新規 `apps/api/src/lib/cf-webhook-auth.ts`、`apps/api/src/middleware/verify-cf-webhook-auth.ts` | T3 | 1.5h | 不正 401 / 正規 next() の unit 4 ケース PASS | YES |
| T5 | Cloudflare → 日本語 Slack formatter | payload 整形 pure function | 新規 `apps/api/src/lib/cloudflare-alert-formatter.ts`、`apps/api/src/types/cloudflare-notification.ts` | Phase 02 | 2h | Workers / D1 / Pages / R2 / unknown の 5 ケースで Block Kit を返す snapshot PASS | YES |
| T6 | Slack Incoming Webhook 送信 + retry | HTTP POST + exponential backoff | 新規 `apps/api/src/lib/slack-sender.ts` | T5 | 1h | 200 即返却 / 5xx 3 回 retry / 4xx 即失敗 unit PASS | YES |
| T7 | unit test 整備 (vitest) | T4〜T6 包括テスト | 新規 `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`、`apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts`、`apps/api/src/lib/__tests__/cf-webhook-auth.test.ts`、`apps/api/src/lib/__tests__/slack-sender.test.ts` | T4-T6 | 1.5h | `pnpm --filter @ubm-hyogo/api test` 全 PASS | YES |
| T8 | staging deploy + テスト通知 | staging 環境 deploy + curl 検証 | `bash scripts/cf.sh deploy --env staging` | T7 | 1h | staging URL に curl で投入 → Slack staging channel 到達 | NO（外部） |
| T9 | Cloudflare Dashboard で Notification Policy 4 種設定 | Dashboard 操作 | Cloudflare Dashboard | T8 | 1h | Workers / D1 / Pages / R2 の policy が staging relay URL を指す | NO（外部） |
| T10 | production deploy + Notification Policy 切替 | production 反映 | `bash scripts/cf.sh deploy --env production` | T9 | 1h | production relay URL に policy 4 種 / Slack production channel 到達 | NO（外部） |
| T11 | runbook 追記 + 月次 health check | 運用ドキュメント | 新規 `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`、新規 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | T10 | 1h | 一次対応フロー + 月次 health check 記載 | YES |

## 不変条件チェック

- D1 直接アクセスは `apps/api` に閉じる: 本タスクは D1 アクセスなし、`apps/web` 変更なし → OK
- Secret は 1Password → Cloudflare Secrets、`.env` には `op://` 参照のみ → T1/T2 で遵守
- Cloudflare CLI は `bash scripts/cf.sh` 経由のみ → T2/T8/T10 で遵守
- UT-08 (WAE custom alerts) と責務重複なし → 本タスクは Cloudflare native usage alerts のみ

## クリティカルパス

```
T1 → T2 → T3 → T4 ─┐
                   ├─→ T7 → T8 → T9 → T10 → T11
              T5 → T6
```

| 区間 | 累積時間 |
| --- | --- |
| T1〜T3（前提整備） | 2.0h |
| T4〜T7（実装+テスト） | 6.0h |
| T8〜T10（deploy） | 3.0h |
| T11（runbook） | 1.0h |
| 合計 | 12.0h |

## 本サイクルで実装する範囲（ユーザー指示）

ユーザー回答: 「Phase 4-11 全て (外部操作はスキップ宣言)」

- 実装対象: T3, T4, T5, T6, T7, T11
- スキップ宣言: T1, T2, T8, T9, T10（全て外部 console / CLI 実行が必要）
- スキップ宣言の根拠: 1Password / Cloudflare Dashboard / Cloudflare Secrets / wrangler deploy はローカル完結不可。コード実装はユーザー deploy 直前まで完成させる。
