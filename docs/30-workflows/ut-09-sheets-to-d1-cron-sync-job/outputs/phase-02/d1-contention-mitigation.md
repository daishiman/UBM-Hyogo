# Phase 2 成果物 — D1 競合対策

WAL を前提にせず、UT-02 の意思決定 (WAL 永続化を必須としない) を継承する。
本タスクでは以下 4 層で SQLITE_BUSY を抑制する。

## 1. SQLITE_BUSY retry/backoff

- 実装: `apps/api/src/utils/with-retry.ts`
- ポリシー:
  - `maxRetries = 5` (env で上書き可)
  - `baseMs = 50`、指数倍数 `2^(attempt-1)`、上限 `5000ms`
  - `jitter = 0..baseMs/2` で複数 worker の同期再試行衝突を緩和
  - `isRetryable` は `SQLITE_BUSY` / `D1_ERROR.*locked` / `database is locked` を正規表現で判定
- 失敗時の振る舞い: 上限超過時は最後のエラーを throw し、`sync_job_logs.error_reason` に記録

## 2. Write queue 直列化

- 実装: `apps/api/src/utils/write-queue.ts`
- 仕組み: `Promise` chain による FIFO（並列度 = 1）。失敗しても次タスクは継続
- 適用範囲: `runSync()` 内で `db.batch(upsert)` を `queue.enqueue(...)` 経由で実行

## 3. 短い transaction (batch sizing)

- `db.batch()` 1 回あたり最大 100 行（`SYNC_BATCH_SIZE`）
- transaction を細切れにし、1 batch あたりのロック保持時間を抑制
- 100 行を超える場合は `chunk()` で分割し、複数の batch に分けて queue へ enqueue

## 4. TTL 付き二重実行防止

- 実装: `apps/api/src/jobs/sync-lock.ts`
- ID は `sheets-to-d1` 固定。`expires_at < now` の lock は acquire 時に強制 release
- TTL: 10 分（`DEFAULT_LOCK_TTL_MS`）
- 既存 holder と異なる acquire は SQLite UNIQUE constraint で失敗し `null` を返却 → `runSync` は `skipped` を返す

## 5. 監視メトリクス

`sync_job_logs.retry_count` を観測し、retry 多発 (>maxRetries の 80%) を検出した場合は UT-08 のアラートで通知する想定。
