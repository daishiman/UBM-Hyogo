# Phase 5 成果物: UT-09 実装委譲ランブック

> ステータス: spec_created / docs-only / NON_VISUAL
> 申し送り先: UT-09（Sheets→D1 同期ジョブ実装タスク）
> 確定値の正本: `outputs/phase-02/canonical-retry-offset-decision.md`、`outputs/phase-02/migration-impact-evaluation.md`
> 本ファイルは UT-09 implementor が「何を / どのファイルに / どの順序で / どこまでやるか」を一目で把握するための実装ガイド。

---

## 1. 反映対象ファイル一覧

| # | ファイル | 変更種別 |
| --- | --- | --- |
| 1 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 既定値変更 + chunk loop UPDATE 追加 + 再開ロジック追加 |
| 2 | `apps/api/src/utils/with-retry.ts`（または相当）| baseMs 既定 1000 化 + cap 32s 引数追加 + jitter ±20% 追加 |
| 3 | `apps/api/migrations/0003_processed_offset.sql` | 新規追加（DDL） |
| 4 | `apps/api/wrangler.toml` | `SYNC_MAX_RETRIES` 既定 3（または未設定削除） |
| 5 | `apps/api/.dev.vars`（local） | `SYNC_MAX_RETRIES=3` |
| 6 | `apps/api/src/jobs/__tests__/sync-sheets-to-d1.spec.ts` | V1-V4 テスト追加 |

---

## 2. 反映順序（Step A〜F）

### Step A: migration 追加
- ファイル: `apps/api/migrations/0003_processed_offset.sql`
- 内容: `ALTER TABLE sync_job_logs ADD COLUMN processed_offset INTEGER NOT NULL DEFAULT 0;`
- 適用: staging 先行 → production
- 検証: `PRAGMA table_info(sync_job_logs)` で列確認

### Step B: `withRetry` 修正
- baseMs 既定値 50 → 1000
- cap 引数追加（既定 32000）
- jitter ±20% を返す wait 値に乗算
- 影響範囲: 他の `withRetry` 利用者がいないことを `rg "withRetry"` で確認、いた場合は引数省略時の挙動が後方互換であること

### Step C: `sync-sheets-to-d1.ts` 既定値変更
- L49: `DEFAULT_MAX_RETRIES = 5` → `3`
- chunk loop 内 `withRetry({ maxRetries, baseMs: 50 })` → `withRetry({ maxRetries, baseMs: 1000, cap: 32000, jitter: 0.2 })`

### Step D: chunk 進捗更新
- chunk loop 内 upsert 成功直後に進捗 UPDATE 追加:
  ```ts
  await env.DB.prepare(
    "UPDATE sync_job_logs SET processed_offset = ?2 WHERE run_id = ?1 AND processed_offset < ?2"
  ).bind(runId, chunkIndex + 1).run();
  ```
- 1 invocation の wall-clock / CPU budget を超えそうな場合は `maxChunksPerInvocation` または deadline 検知で安全停止し、次回 tick で `processed_offset` から再開する。

### Step E: 再開ロジック（任意）
- `acquireSyncLock` 直後に同一 idempotency_key の最新 failed 行を SELECT し `processed_offset` を取得
- chunk loop の開始 index を `startIndex = recoveredOffset` で skip
- 注意: 「再実行 = 同一 run_id」か「新 run_id」かは UT-09 で別途決定。シンプル実装は新 run_id で別ジョブとして開始し、failed の `processed_offset` は監査専用とする選択肢もある
- Sheets 行削除 / 挿入 / 並べ替えで `total_rows`、header hash、または snapshot hash が前回 failed 行と不一致の場合は chunk index offset を信頼しない。offset invalidation と full backfill、または stable `response_id` high-water 方式への退避を実装判断に含める。

### Step F: 環境変数
- `wrangler.toml` の `SYNC_MAX_RETRIES = "5"` を `"3"` または削除
- `.dev.vars` を `SYNC_MAX_RETRIES=3` に揃える
- production rollout は staging 7 日 dry-run 後（R1）

---

## 3. canUseTool 適用範囲

| ツール | 範囲 |
| --- | --- |
| Edit / Write | `apps/api/src/jobs/`、`apps/api/migrations/`、`apps/api/wrangler.toml`、`apps/api/.dev.vars`、`apps/api/src/utils/with-retry.ts`、`apps/api/src/jobs/__tests__/` |
| Bash | `pnpm --filter api test`、`bash scripts/cf.sh d1 migrations apply` |
| 禁止 | `apps/web/` への変更、`packages/` 横断変更、wrangler 直接実行（必ず `scripts/cf.sh` 経由） |

---

## 4. UT-09 受入条件への申し送り

UT-09 タスク完了は以下を満たすこと:

- [ ] retry max = 3 が適用され、`SYNC_MAX_RETRIES` 上書きが staging で動作
- [ ] backoff curve が base 1s / cap 32s / jitter ±20% に変更
- [ ] `processed_offset` 列が migration で追加され、chunk 完了ごとに更新
- [ ] failed → 再実行時に `processed_offset` を参照する再開ロジック（または新 run_id 戦略のドキュメント化）
- [ ] 1 invocation budget を超える場合の `maxChunksPerInvocation` / deadline 検知 / 次回 resume 条件を実装または明文化
- [ ] Sheets 行削除 / 挿入 / 並べ替え検知時の offset invalidation 条件をテスト化
- [ ] V1-V4 テスト全 PASS
- [ ] staging で 7 日間 failed しきい値再校正

---

## 5. 過渡期運用ルール（R1 対策）

| 期間 | 対象環境 | 運用 |
| --- | --- | --- |
| Day 0-7 | staging のみ | retry=3 + new backoff で試運転、failed 件数を実測 |
| Day 7 | review | アラートしきい値（例: 直近 24h failed 件数 N 以上で通知）を実測中央値 + 2σ で再校正 |
| Day 8+ | production | 段階適用（cron だけ → 手動 endpoint も）|

---

## 6. 実行手順（UT-09 implementor 向け）

1. Phase 2 / Phase 4 を読み確定値とテストスイートを把握
2. Step A → B → C → D → E → F の順で実装
3. ローカル `pnpm test` 全 PASS
4. staging migration apply + 1 sync run 確認
5. 7 日 dry-run 後 production rollout

---

## 7. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 失敗ケースが Step A-F のどこで検出 / 対処されるか wire-in |
| Phase 7 | AC マトリクスの「実装側追跡」列に Step ID 記載 |
| Phase 12 | `unassigned-task-detection.md` で UT-09 サブタスクと境界整合 |

---

## 8. 完了条件チェック

- [x] 反映対象 6 ファイル列挙
- [x] Step A-F の順序定義
- [x] canUseTool 範囲明記
- [x] UT-09 受入条件チェックボックス化
- [x] 過渡期 7 日運用ルール（R1）記載
- [x] 本タスクではコード変更なし
