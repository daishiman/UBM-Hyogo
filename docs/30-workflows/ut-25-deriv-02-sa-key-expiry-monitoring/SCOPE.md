---
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
title: SCOPE
status: draft
---

# SCOPE — UT-25-DERIV-02 SA key 失効監視

[実装区分: 実装仕様書]

## 含む

- `apps/api/src/jobs/sheets-fetcher.ts` の `SheetsFetchError` から HTTP status を読み取り、401 / 403 / その他に分類する純関数の新設（`sheets-auth-classifier.ts`）
- 上記分類結果を構造化ログ（`console.error({ event: 'sheets.auth.failure', code, status, ... })`）として出力するロガーの新設（`sheets-auth-logger.ts`）
- 既存 sync ジョブ（`apps/api/src/sync/backfill.ts:63-67`、`apps/api/src/sync/manual.ts:62`、`apps/api/src/jobs/sync-sheets-to-d1.ts`）に対する 401/403 catch → log → rethrow の injection
- 新規 health check job `apps/api/src/scheduled/sheets-auth-healthcheck.ts`（Sheets API 最小 read を発行し失効を能動検出）
- 既存 `*/15 * * * *` cron への health check 相乗り（新規 cron は追加しない）
- 既存 `apps/api/src/routes/internal/alert-relay.ts` への `sheets-auth` カテゴリ payload 拡張
- `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md` への逆参照追記
- staging で意図的に key を無効化して alert 発火確認（dry run 手順）

## 含まない

- SA key 定期ローテーション運用 SOP（UT-25-DERIV-01 が担当）
- Cloudflare Secret 監査ログ整備（UT-25-DERIV-03 が担当）
- Cloudflare 全般の SLO / error budget 設計（UT-08）
- Sheets API quota / rate limit 監視（UT-26 以降）
- OAuth / Resend / 他シークレットの失効監視
- Logpush 有償プラン契約（MVP では Workers logs + alert-relay のみで完結）
- 新規 cron Trigger 追加（free plan 3 本上限済み）

## 不変条件

1. `apps/api/wrangler.toml` の `crons` 配列の本数を増やさない。新 health check は既存 `*/15 * * * *` cron 内で実行する。
2. 401 と 403 は error code レベルで区別する（`SHEETS_AUTH_401_KEY_INVALID` / `SHEETS_AUTH_403_FORBIDDEN`）。
3. 5xx / 429 / network timeout は alert 対象外（`SHEETS_AUTH_OTHER` または分類対象外として通常 sync ジョブの既存挙動に委ねる）。
4. 既存 throw 経路は破壊しない（catch → log → rethrow を厳守）。
5. D1 への直接アクセスは `apps/api` に閉じる（CLAUDE.md 不変条件 5）。
6. 新規 test ファイルは `*.spec.ts` のみ。
7. Cloudflare CLI は `scripts/cf.sh` 経由のみ。`wrangler` 直接実行禁止（CLAUDE.md）。
8. 既定 PR base は `dev`。

## 正本順位

1. `docs/30-workflows/unassigned-task/UT-25-DERIV-02-sa-key-expiry-monitoring.md`（要件正本）
2. 本ワークフロー配下の `phase-*.md`
3. CLAUDE.md の不変条件
4. UT-25 Phase 13 `rollback-runbook.md`（逆参照先）
5. UT-25-DERIV-01（rotation SOP）の mute 仕様（下流タスク仕様）
