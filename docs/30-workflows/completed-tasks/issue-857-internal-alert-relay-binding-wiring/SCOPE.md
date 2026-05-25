---
workflow_id: issue-857-internal-alert-relay-binding-wiring
title: SCOPE
status: completed
---

# SCOPE — issue #857 internal alert relay binding 配線

[実装区分: 実装仕様書]

## 含む

- `apps/api/wrangler.toml` の `[env.production.vars]` に `API_INTERNAL_BASE_URL = "https://api.ubm-hyogo.workers.dev"` を追加（非機密・自 Worker public URL = production `AUTH_URL` と同値）
- `apps/api/wrangler.toml` の `[env.staging.vars]` に `API_INTERNAL_BASE_URL = "https://api-staging.ubm-hyogo.workers.dev"` を追加（非機密・staging `AUTH_URL` と同値）
- `apps/api/src/env.ts:109-112` のコメントを「deploy-required（healthcheck alert 発火に必須）」「token は `CF_WEBHOOK_AUTH_SECRET` fallback を正本とし、`INTERNAL_ALERT_TOKEN` を別値で設定すると relay 401」に明確化
- config 回帰 guard test の新設（`apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts`）: `wrangler.toml` の 2 環境 vars に `API_INTERNAL_BASE_URL` が存在することを assert
- 既存 `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` に「`INTERNAL_ALERT_TOKEN` 未設定時に `CF_WEBHOOK_AUTH_SECRET` で alert-relay POST が成功する」fallback ケースを追加
- `CF_WEBHOOK_AUTH_SECRET` の staging / production Secret name presence 確認手順の runbook 化（実投入は user-gated runtime op）
- 親ワークフロー（`ut-25-deriv-02-sa-key-expiry-monitoring`）からの逆参照追記

## 含まない

- **新規 `INTERNAL_ALERT_TOKEN` Cloudflare Secret の投入**（現コードでは relay 401 を誘発するため明示的に除外。現コード最適化判定を index.md / Phase 1 に記録）
- `verify-cf-webhook-auth.ts` の token 検証ロジック変更（既存 `CF_WEBHOOK_AUTH_SECRET` 単一照合を維持）
- alert-relay 受信側の Slack / mail 送信先設定（UT-17 / UT-08 のスコープ）
- `ALERT_DEDUP_KV` namespace の有効化（user-gated。未有効化でも alert forward は degrade 動作で継続する）
- SA key 自体のローテーション SOP（UT-25-DERIV-01）
- `GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_SPREADSHEET_ID` の投入（UT-25 deploy で完了済み前提）
- 新規 cron Trigger 追加（free plan 3 本上限済み・healthcheck は既存 `*/15` cron 相乗り）

## 不変条件

1. Cloudflare CLI は `scripts/cf.sh` 経由のみ。`wrangler` 直接実行禁止（CLAUDE.md）。
2. 機密値は `[vars]` に書かない。`API_INTERNAL_BASE_URL` は非機密 URL のため vars に書いてよい。token 類は Cloudflare Secrets のみ。
3. `[vars]` は top-level 継承されないため、`[env.production.vars]` と `[env.staging.vars]` の**両方**に同名 var を書く（片方欠落で sibling 環境が no-op になる）。
4. D1 への直接アクセスは `apps/api` に閉じる（CLAUDE.md 不変条件 5）。
5. 新規 test ファイルは `*.spec.ts` のみ（`*.test.ts` 禁止）。
6. `apps/api/wrangler.toml` の `crons` 配列の本数を増やさない。
7. 既定 PR base は `dev`。`main` への直接 PR はしない。
8. healthcheck の token 送信値（`INTERNAL_ALERT_TOKEN ?? CF_WEBHOOK_AUTH_SECRET`）は受信側 `CF_WEBHOOK_AUTH_SECRET` と必ず一致させる（401 回避）。

## 正本順位

1. 現コードの実態（`sheets-auth-healthcheck.ts` 送信契約 / `verify-cf-webhook-auth.ts` 受信検証） — issue 原文より優先
2. 本ワークフロー配下の `phase-*.md`
3. CLAUDE.md の不変条件（`apps/web` env / `scripts/cf.sh` / PR base=dev）
4. 元 unassigned-task spec `UT-25-DERIV-02-FU-01-internal-alert-binding-wiring.md`（現コード最適化により一部差し替え）
5. 親ワークフロー `ut-25-deriv-02-sa-key-expiry-monitoring`（healthcheck 実装本体）

> 既存 endpoint surface（`/internal/alert-relay`）と token 検証ロジックは変更しない。配線（vars 追加）と回帰 guard の追加のみで根本問題を解消する。
