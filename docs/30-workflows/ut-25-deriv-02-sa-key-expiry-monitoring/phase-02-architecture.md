---
phase: 2
title: Architecture
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 2: Architecture — SA key 失効監視

[実装区分: 実装仕様書]

## 1. レイヤ構成

```
[scheduled() cron handler] (apps/api/src/index.ts:401-510)
        │
        ├── "0 18 * * *"  → cap-alert / retention-purge (既存)
        ├── "*/15 * * * *" → sync-sheets-to-d1 (既存)
        │                  └── ctx.waitUntil(runSheetsAuthHealthcheck) ★相乗り
        └── "*/5 * * * *"  → alert-relay healthcheck (既存)

[sync jobs] (backfill.ts / manual.ts / sync-sheets-to-d1.ts)
        │ try { sheets-fetcher } catch (SheetsFetchError) {
        │   logSheetsAuthFailure(err, ctx) ★ injection
        │   throw err
        │ }

[健康診断 job] sheets-auth-healthcheck.ts ★新設
        │
        ▼
[共通分類器] sheets-auth-classifier.ts ★新設 (純関数)
   classifySheetsAuthError(err) -> { code, status, message }
        │
        ▼
[共通 logger] sheets-auth-logger.ts ★新設
   logSheetsAuthFailure(err, ctx) -> console.error({ event, code, status, ... })
        │
        ▼
[alert-relay] routes/internal/alert-relay.ts (既存拡張)
   category: 'sheets-auth' payload 受け取り
        │  KV dedup (既存)
        ▼
[Notification] Slack / mail fallback (既存)
        │
        ▼
[Rollback runbook] ut-25 phase-13 rollback-runbook.md (逆参照)
```

## 2. 新設モジュール一覧

| パス | 役割 | export |
| --- | --- | --- |
| `apps/api/src/jobs/sheets-auth-classifier.ts` | `SheetsFetchError` を分類する純関数 | `classifySheetsAuthError(err: unknown): SheetsAuthClassification` |
| `apps/api/src/jobs/sheets-auth-logger.ts` | classifier 結果を構造化ログ化 | `logSheetsAuthFailure(err: unknown, ctx: SheetsAuthLogContext): SheetsAuthClassification` |
| `apps/api/src/scheduled/sheets-auth-healthcheck.ts` | Sheets API 最小 read で能動検出 | `runSheetsAuthHealthcheck(env: ApiEnv, event: ScheduledEvent): Promise<void>` |

## 3. 編集対象モジュール一覧

| パス | 編集内容 |
| --- | --- |
| `apps/api/src/sync/backfill.ts:63-67` | 401/403 catch → `logSheetsAuthFailure` → rethrow |
| `apps/api/src/sync/manual.ts:62` | 同上 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | 同上（catch スコープを拡張） |
| `apps/api/src/index.ts` (scheduled 内 `*/15` 分岐) | `ctx.waitUntil(runSheetsAuthHealthcheck(env, event))` 追記 |
| `apps/api/src/routes/internal/alert-relay.ts` | payload に `category: 'sheets-auth'` を許容、既存 dedup を流用 |
| `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md` | 冒頭に逆参照を追記 |

## 4. binding 参照点

- `env.GOOGLE_SERVICE_ACCOUNT_JSON` (Secrets) — `sheets-fetcher` 経由のみ参照
- `env.RATE_LIMIT_KV` または既存 alert dedup KV — 既存 alert-relay の dedup 仕様を踏襲（新規 binding なし）
- `env.SHEETS_SPREADSHEET_ID` (vars) — health check の対象 ID

## 5. SRP / DDD 整合

- 分類（classifier）/ ログ化（logger）/ 能動検出（healthcheck）/ 通知（alert-relay）を SRP で分離
- ユビキタス言語: 「Sheets 認証失敗（sheets.auth.failure）」「key 失効（key invalid）」「権限剥奪（forbidden）」を Phase 全体で統一
