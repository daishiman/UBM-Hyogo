# Implementation Guide

## Part 1: 中学生向け説明

このタスクは、Google スプレッドシートを読むための鍵が壊れたときに、
アプリが静かに失敗し続けないようにする警報装置を作る仕様です。
鍵が無効なら 401、権限が外れたなら 403 として分けて記録し、担当者が
間違った復旧手順を選ばないようにします。

15 分ごとの既存 cron に小さな確認を相乗りさせるので、新しいタイマーは
増やしません。Google 側の一時的な 500 や 429 は鍵の故障ではないため、
警報にしないことも重要です。

## Part 2: 実装背景

UT-25 で `GOOGLE_SERVICE_ACCOUNT_JSON` の配置 runbook は整いましたが、
Google 側で key が失効した場合の検出経路がありません。同期ジョブの
失敗をただ rethrow するだけでは、復旧者が 401 と 403 を区別できません。

本仕様は classifier、logger、healthcheck、alert-relay 拡張を分離し、
既存 sync ジョブの throw 経路を壊さずに認証失敗だけを見える化します。

## Part 3: 実装ステップ

1. `apps/api/src/jobs/sheets-auth-classifier.ts` に 401/403/OTHER の純関数を追加する。
2. `apps/api/src/jobs/sheets-auth-logger.ts` で構造化ログを出す。
3. `backfill.ts`、`manual.ts`、`sync-sheets-to-d1.ts` に catch -> log -> rethrow を入れる。
4. `apps/api/src/scheduled/sheets-auth-healthcheck.ts` を追加する。
5. `apps/api/src/index.ts` の既存 `*/15` cron に `ctx.waitUntil` で相乗りする。
6. `alert-relay.ts` に `category: 'sheets-auth'` payload を追加する。
7. rollback-runbook と DERIV-01 handoff を更新する。

## Part 4: 検証コマンド

Local gate は `mise exec -- pnpm typecheck`、`mise exec -- pnpm lint`、
`mise exec -- pnpm --filter @ubm/api test`、`bash scripts/verify-pr-ready.sh`
で確認します。Cron invariant は `apps/api/wrangler.toml` の crons 配列が
3 本のままであることを diff と grep で確認します。

Staging dry-run は user-gated です。無効 key 投入、Workers tail、Slack/mail
alert 確認、元 key 復旧の順で実行し、production では意図的失効を行いません。

## Part 5: 既知制限

この Phase 12 では runtime code は実装済みですが、staging secret invalidation
と alert 受信確認は user-gated のため未実施です。そのため workflow state は
`implemented_local_runtime_pending` です。

Cloudflare Secret 値は読み戻せないため、`secret list` は name presence のみを
証明します。key の実用性は Sheets API 疎通または healthcheck evidence で
別途証明します。

---

## Part 13: 実装結果サマリ (2026-05-22)

本ワークフローのコード実装を完了。主要な追加・変更:

### 新規ファイル

- `apps/api/src/jobs/sheets-auth-classifier.ts` — Sheets API error の 401/403/その他分類純関数
- `apps/api/src/jobs/sheets-auth-logger.ts` — classifier 結果を `console.error` で構造化ログ化
- `apps/api/src/scheduled/sheets-auth-healthcheck.ts` — 既存 `*/15` cron 相乗りの能動 healthcheck
- 各 spec ファイル (`*.spec.ts` / `*.contract.spec.ts`) — classifier / logger / healthcheck / alert-relay 拡張の test

### 編集ファイル

- `apps/api/src/sync/backfill.ts` / `manual.ts` / `jobs/sync-sheets-to-d1.ts` — catch → log → rethrow 注入（既存挙動非破壊）
- `apps/api/src/index.ts` — `*/15 * * * *` cron に `runSheetsAuthHealthcheck` 相乗り（新 cron Trigger なし）
- `apps/api/src/routes/internal/alert-relay.ts` — `category: 'sheets-auth'` payload を専用ハンドラで受理、dedup key `alert:sheets-auth:{code}:{10min-window}`
- `apps/api/src/env.ts` — `API_INTERNAL_BASE_URL` / `INTERNAL_ALERT_TOKEN` を optional binding として追加
- `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md` — 検出側ワークフローへの逆参照追記

### 不変条件遵守

- `apps/api/wrangler.toml` の cron 配列は未変更（新 cron 追加なし — 不変条件 1）
- 401 / 403 は error code レベルで分離（不変条件 2）
- 5xx / 429 / network timeout は `SHEETS_AUTH_OTHER` / `isAuthFailure: false` で alert 対象外（不変条件 3）
- 既存 sync ジョブの throw 経路は維持（catch → log → rethrow — 不変条件 4）
- 新規 test ファイルは `*.spec.ts` のみ（不変条件 6）

### ローカル検証

```
mise exec -- pnpm --filter @ubm-hyogo/api typecheck   # OK
mise exec -- pnpm lint                                 # OK (boundaries / deps / stable-key / eslint 全 pass)
mise exec -- pnpm --filter @ubm-hyogo/api test         # 354 passed (新規 spec 含む)
```

### 未実施 / 後続タスク

- staging dry-run（SA key を意図的に無効化して alert 発火確認）— production env 影響あり、ユーザー実行要
- production cron 相乗りの動作確認 — deploy 後 evidence 取得
