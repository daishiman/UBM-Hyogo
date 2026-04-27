# Phase 5 成果物 — 実装ランブック

## 1. 実装結果ファイル一覧

### 新規作成

| パス | 役割 |
| --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | runSync core (fetch→map→upsert→log) |
| `apps/api/src/jobs/sync-lock.ts` | sync_locks acquire/release |
| `apps/api/src/jobs/sheets-fetcher.ts` | Sheets API v4 + JWT 署名 (WebCrypto) |
| `apps/api/src/jobs/mappers/sheets-to-members.ts` | header-driven row mapper |
| `apps/api/src/utils/with-retry.ts` | exponential backoff + SQLITE_BUSY 判定 |
| `apps/api/src/utils/write-queue.ts` | FIFO 直列化 |
| `apps/api/src/routes/admin/sync.ts` | POST /admin/sync (Bearer 認証) |
| `apps/api/migrations/0002_sync_logs_locks.sql` | sync_locks / sync_job_logs DDL |
| `apps/api/src/utils/with-retry.test.ts` 他 5 件 | unit/integration tests |

### 修正

| パス | 修正内容 |
| --- | --- |
| `apps/api/src/index.ts` | `scheduled()` export、`/admin` ルート登録 (既存ハンドラを破壊しない) |
| `apps/api/wrangler.toml` | `[triggers] crons`、`[env.staging.triggers]`、`SHEETS_SPREADSHEET_ID` / `SYNC_BATCH_SIZE` / `SYNC_MAX_RETRIES` / `SYNC_RANGE` を `[vars]` に追加 |

## 2. Runbook

### Step 0: 事前準備

```bash
mise exec -- pnpm install
```

### Step 1: Secret 登録 (各環境)

```bash
wrangler secret put GOOGLE_SHEETS_SA_JSON --env staging
wrangler secret put SYNC_ADMIN_TOKEN     --env staging
wrangler secret put GOOGLE_SHEETS_SA_JSON          # production
wrangler secret put SYNC_ADMIN_TOKEN
```

### Step 2: D1 マイグレーション適用

```bash
mise exec -- pnpm --filter @ubm-hyogo/api wrangler d1 migrations apply ubm-hyogo-db-staging --env staging --local
mise exec -- pnpm --filter @ubm-hyogo/api wrangler d1 migrations apply ubm-hyogo-db-staging --env staging --remote
```

### Step 3: typecheck / test

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm vitest run apps/api/src
```

### Step 4: ローカル smoke

```bash
mise exec -- pnpm --filter @ubm-hyogo/api wrangler dev --test-scheduled --env staging
# 別タブ:
curl -X POST 'http://127.0.0.1:8787/__scheduled?cron=0+*+*+*+*'
curl -X POST 'http://127.0.0.1:8787/admin/sync' \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"
```

### Step 5: staging デプロイ

```bash
mise exec -- pnpm --filter @ubm-hyogo/api wrangler deploy --env staging
mise exec -- pnpm --filter @ubm-hyogo/api wrangler tail --env staging
```

## 3. 擬似コード対応

擬似コード (Phase 5 spec の `runSync`) と実装 (`apps/api/src/jobs/sync-sheets-to-d1.ts`) の対応:

| 擬似コード要素 | 実装 |
| --- | --- |
| `acquireLock` | `acquireSyncLock` (sync-lock.ts) |
| `startLog` / `finishLog` | `insertRunningLog` / `finishLog` |
| `buildA1Ranges` | `env.SYNC_RANGE` を 1 範囲で fetch、必要に応じて将来 `buildA1Ranges` (sheets-fetcher.ts) を利用 |
| `fetchSheetsRange` | `fetcher.fetchRange(range)` |
| `mapRows` | `mapSheetRows(values)` |
| `chunk(rows, 100)` | `chunk(rows, batchSize)` |
| `writeQueue.enqueue` + `retryOnBusy` | `queue.enqueue(() => withRetry(() => upsertMembers(...), ...))` |
| `releaseLock` | `releaseSyncLock` |

## 4. canUseTool 適用範囲

- 自動編集許可: ファイル編集 (Edit/Write)、ローカルテスト実行 (vitest/typecheck)
- 人手承認必須: `wrangler secret put` / `wrangler d1 migrations apply --remote` / `wrangler deploy`
