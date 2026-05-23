---
phase: 1
title: Requirements
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 1: Requirements — SA key 失効監視

[実装区分: 実装仕様書]

## 1. 目的

UT-25 で本番配置済みの Google Service Account key が、Google 側で失効・無効化された際に `apps/api` Workers が沈黙故障することを防ぐ。Sheets API の 401（key 無効）/ 403（権限剥奪）を区別検出し、構造化ログ + 既存 alert-relay 経路で通知する。

## 2. 機能要件（G-*）

| ID | 要件 |
| --- | --- |
| G-1 | `apps/api/src/jobs/sheets-fetcher.ts` の `SheetsFetchError` を受け取り、HTTP status に基づき `SHEETS_AUTH_401_KEY_INVALID` / `SHEETS_AUTH_403_FORBIDDEN` / `SHEETS_AUTH_OTHER` を返す純関数を提供する。 |
| G-2 | 上記分類結果を `console.error({ event: 'sheets.auth.failure', code, status, jobName, isolateId, ts })` 形式で構造化ログ出力する logger を提供する。 |
| G-3 | 既存 sync ジョブ（`backfill.ts`、`manual.ts`、`sync-sheets-to-d1.ts`）の 401/403 throw 経路を catch → log → rethrow の形で injection する（既存 throw を破壊しない）。 |
| G-4 | Sheets API へ最小 read（target spreadsheet metadata / `values.get` 1 cell）を発行して 401/403 を能動検出する health check job を `apps/api/src/scheduled/sheets-auth-healthcheck.ts` に新設する。 |
| G-5 | 既存 `*/15 * * * *` cron の scheduled() 分岐内で `ctx.waitUntil(runSheetsAuthHealthcheck(env, event))` を相乗り実行する。**新規 cron を追加しない**。 |
| G-6 | 既存 `apps/api/src/routes/internal/alert-relay.ts` payload に `category: 'sheets-auth'` を拡張し、401/403 検出時に Slack / mail fallback で通知する。新規 route は追加しない。 |
| G-7 | `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md` 冒頭に「失効検出時はまず `SHEETS_AUTH_401_*` / `SHEETS_AUTH_403_*` alert 内のリンクを参照」を追記する。 |

## 3. 非機能要件（NFR-*）

| ID | 要件 |
| --- | --- |
| NFR-1 | health check 相乗り実行が `*/15` cron 全体の実行時間予算 5 秒以内を侵食しない（Sheets API 1 call のみ） |
| NFR-2 | 5xx / 429 / network timeout を 401/403 と取り違えない（false positive 抑止） |
| NFR-3 | 401/403 連続 3 回 / 10 分窓 を threshold とした dedup を alert-relay 既存 KV dedup で実現する（新規 dedup ロジック追加しない） |
| NFR-4 | rotation 中の誤検知抑止のため alert mute 手順を runbook section として用意する |
| NFR-5 | health check 自身が SA 未設定で誤陽性を出さないよう staging 経由検証必須とする |
| NFR-6 | 構造化ログの key 名は generic（`event` / `code` / `status` / `jobName`）とし、Sentry / Workers Analytics Engine 双方で query 可能にする |

## 4. 不変条件（UNBREAKABLE）

1. Cloudflare free plan の cron 3 本上限を**侵犯しない**（`apps/api/wrangler.toml` の `crons` 配列を増やさない）
2. 401 と 403 を error code レベルで区別する
3. 既存 throw 経路を破壊しない（rethrow 必須）
4. D1 への直接アクセスは `apps/api` に閉じる
5. テストは `*.spec.ts` のみ
6. Cloudflare CLI は `scripts/cf.sh` 経由のみ。`wrangler` 直接実行禁止
7. 既定 PR base は `dev`

## 5. 受け入れ条件サマリ

詳細は Phase 8 (DoD) を参照。元 issue の完了条件 8 項目を継承し、Phase 11 evidence existence を追加する。
