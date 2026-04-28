# UT-09 実装ガイド — Sheets→D1 同期ジョブ

## Part 1: 中学生にもわかる解説

### 何を作ったか

「UBM 兵庫支部会の会員情報は、Google スプレッドシートに集まっています。
そのデータを定期的に取り出して、サイトのデータベース (Cloudflare D1) にコピーする
"自動コピー機"」を作りました。

### なぜ必要か

スプレッドシートに直接アクセスして毎回読み込むと、
- 遅い
- Google 側の利用制限にあたる
- サイトが落ちやすい

ので、いったん自前のデータベースに「写し」を置いてから、サイトはそちらを読みます。

### どうやって動くか

1. Cloudflare のサーバーが「6 時間に 1 回」目覚まし時計のように動き出す (production)
2. Google スプレッドシートからデータをまとめて取り出す
3. 必要な形に整えて、データベースに上書き保存する
4. 「いつ・何件できたか」を記録ノート (sync_job_logs) に書き残す

困ったときは、管理者が `/admin/sync` ボタンを押すと、待たずにすぐコピーを実行できます。

### 安全のしくみ

- 同時に 2 回動かないように **錠前 (sync_locks)** をかける
- データベースが「ちょっと待って」と言ったら少し待ってもう一度試す (retry)
- 一度に 100 件ずつ書き込んで、データベースに負担をかけない

---

## Part 2: 技術者向け詳細

### 構成 (entry → core → util)

```
apps/api/src/
├── index.ts                   # fetch + scheduled() を export
├── jobs/
│   ├── sync-sheets-to-d1.ts   # runSync core
│   ├── sync-lock.ts           # sync_locks acquire / release
│   ├── sheets-fetcher.ts      # GoogleSheetsFetcher (fetch + WebCrypto JWT)
│   └── mappers/
│       └── sheets-to-members.ts
├── routes/admin/sync.ts       # POST /admin/sync (Bearer 認証)
└── utils/
    ├── with-retry.ts          # exponential backoff (SQLITE_BUSY)
    └── write-queue.ts         # FIFO 直列化
```

### Cron 設定 (`apps/api/wrangler.toml`)

| 環境 | schedule |
| --- | --- |
| production | `0 */6 * * *` |
| staging | `0 * * * *` |

### Secret / Variable

| 名前 | 種別 | 注入経路 |
| --- | --- | --- |
| `GOOGLE_SHEETS_SA_JSON` | Secret | `wrangler secret put` |
| `SYNC_ADMIN_TOKEN` | Secret | `wrangler secret put` |
| `SHEETS_SPREADSHEET_ID` | Variable | `wrangler.toml [vars]` |
| `SYNC_BATCH_SIZE` (default 100) | Variable | 同上 |
| `SYNC_MAX_RETRIES` (default 5) | Variable | 同上 |
| `SYNC_RANGE` (default `Form Responses 1!A1:ZZ10000`) | Variable | 同上 |

### エラーハンドリングと定数

| 項目 | 現在の実装値 | 実装箇所 |
| --- | --- | --- |
| D1 write batch size | default 100 (`SYNC_BATCH_SIZE`) | `sync-sheets-to-d1.ts` |
| D1 retry max | default 5 (`SYNC_MAX_RETRIES`) | `sync-sheets-to-d1.ts` / `with-retry.ts` |
| D1 retry base delay | 50ms + jitter、上限 5000ms | `with-retry.ts` |
| lock TTL | 10 分 (`DEFAULT_LOCK_TTL_MS`) | `sync-sheets-to-d1.ts` |
| range | `Form Responses 1!A1:ZZ10000` | `sync-sheets-to-d1.ts` |

Sheets API の 401/403/404/422/429/5xx 分岐は UT-10 で標準化する。現タスクでは fetcher 例外を `failed` として `sync_job_logs.error_reason` に残し、D1 の `SQLITE_BUSY` / locked 系だけを retry 対象にする。

### 主要 API

```ts
import { runSync } from "./jobs/sync-sheets-to-d1";
const result = await runSync(env, { trigger: "cron" });
// SyncResult { status: 'success'|'failed'|'skipped', runId, fetched, upserted, failed, retryCount, durationMs }
```

`scheduled()` は `ctx.waitUntil(runSync(env, { trigger: 'cron' }))` を呼ぶだけ。
`POST /admin/sync` は Bearer Token 検証後に同 core を呼ぶ。

### D1 マイグレーション

`apps/api/migrations/0002_sync_logs_locks.sql` を追加:
- `sync_locks (id PK, acquired_at, expires_at, holder, trigger_type)`
- `sync_job_logs (id, run_id UNIQUE, trigger_type, status, started_at, finished_at, fetched_count, upserted_count, failed_count, retry_count, duration_ms, error_reason)`

### 動作の流れ

```
scheduled() / POST /admin/sync
  └─▶ runSync()
        ├─ acquireSyncLock() … TTL 10 分
        │   └─ expired は強制 release、INSERT 失敗 → skipped
        ├─ insertRunningLog (status=running)
        ├─ fetcher.fetchRange(SYNC_RANGE)
        ├─ mapSheetRows(values) … 不明列は extra_fields_json
        ├─ chunk(rows, SYNC_BATCH_SIZE)
        │   └─ writeQueue.enqueue(() => withRetry(() => upsertMembers(batch)))
        ├─ finishLog (status=success / failed)
        └─ releaseSyncLock
```

### テスト

`apps/api/src/**/*.test.ts` (5 ファイル / 22 ケース) — `pnpm test apps/api/src` で実行。

### 受入条件

AC-1〜AC-11 のトレーサビリティは [phase-07/ac-matrix.md](../phase-07/ac-matrix.md)。

### 既知の引き継ぎ事項

- 4xx (429 など) の retry 拡張は UT-10 (エラーハンドリング標準化) で議論
- staging 実機 load test (AC-8) は UT-26 staging-deploy-smoke で実施
- 通知連携は UT-07、メトリクスは UT-08

### スクリーンショット

UI/UX 実装を伴わないバックエンドジョブのため、スクリーンショットは N/A。
代わりに自動テスト出力と手動 smoke 手順を [phase-11/manual-smoke-log.md](../phase-11/manual-smoke-log.md) に記載。Secret が必要な staging 実機 smoke は UT-26 へ引き継ぐ。
