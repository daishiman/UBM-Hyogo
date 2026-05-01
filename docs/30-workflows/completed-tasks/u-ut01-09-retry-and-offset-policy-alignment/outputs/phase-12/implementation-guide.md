# Phase 12 (1/7): Implementation Guide

> ステータス: spec_created / docs-only / NON_VISUAL
> 対象読者: UT-09 implementor、新規 onboarding メンバー

## Part 1: 中学生レベル概念説明

### なぜ必要か

Google スプレッドシートからデータベースへ会員情報をコピーする仕組みでは、失敗したときの「やり直す回数」「待つ時間」「どこから再開するか」を全員で同じルールにしておく必要がある。ルールがばらばらだと、ある人は「もう失敗」と判断し、別の仕組みはまだ自動でやり直している、というズレが起きる。

たとえば、1000 行のドリルを解いていて 600 行目で電池が切れたとする。しおりを挟んでいれば次は 600 行目から再開できるが、しおりがなければ毎回 1 行目からやり直しになる。今回の `processed_offset` は、このしおりにあたる。

### 何をするか

今回の設計では、失敗時のルールを次のように統一した。

| 項目 | やさしい説明 |
| --- | --- |
| retry | 失敗したら最大 3 回までやり直す |
| backoff | すぐ連打せず、1 秒、2 秒、4 秒のように待ち時間を伸ばす |
| jitter | みんなが同じ瞬間に再挑戦しないように、少しだけ待ち時間をずらす |
| processed_offset | どこまで終わったかを chunk 単位で覚える |

### 今回作ったもの

| 成果物 | 内容 |
| --- | --- |
| canonical decision | retry=3 / backoff 1s〜32s / jitter ±20% / chunk index offset の設計判断 |
| UT-09 handover | 実装担当が変更すべきファイルと順番 |
| NON_VISUAL evidence | スクリーンショットの代わりに、仕様 walkthrough とリンク確認を残した証跡 |
| 正本仕様同期 | aiworkflow-requirements の quick-reference / resource-map / database-schema への導線 |

## Part 2: 技術者向け実装ガイド

### 型定義

```ts
export interface RetryOffsetPolicy {
  maxRetries: number;
  baseDelayMs: number;
  factor: number;
  capDelayMs: number;
  jitterRatio: number;
  chunkSize: number;
  offsetUnit: "chunk_index";
}

export interface SyncResumeState {
  runId: string;
  processedOffset: number;
  totalRows: number;
  headerHash: string | null;
  snapshotHash: string | null;
}
```

### APIシグネチャ

```ts
async function runSheetsToD1Sync(env: SyncEnv): Promise<SyncSummary>;

async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseMs: number;
    capMs: number;
    jitterRatio: number;
  },
): Promise<T>;
```

### 使用例

```ts
const policy: RetryOffsetPolicy = {
  maxRetries: Number(env.SYNC_MAX_RETRIES ?? 3),
  baseDelayMs: 1000,
  factor: 2,
  capDelayMs: 32000,
  jitterRatio: 0.2,
  chunkSize: 100,
  offsetUnit: "chunk_index",
};

await withRetry(() => upsertChunk(chunk), {
  maxRetries: policy.maxRetries,
  baseMs: policy.baseDelayMs,
  capMs: policy.capDelayMs,
  jitterRatio: policy.jitterRatio,
});
```

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| retry max | 3（既定） |
| `SYNC_MAX_RETRIES` | 存続、staging override 可 |
| backoff base | 1000ms |
| backoff factor | 2 |
| backoff cap | 32000ms |
| jitter | ±20% |
| chunk size | 100 行 |
| `processed_offset` | `INTEGER NOT NULL DEFAULT 0` |
| offset unit | chunk index |

### エラーハンドリング

- 429 / 5xx / transient network error は retry 対象にする。
- retry を使い切ったら `sync_job_logs.status='failed'` とし、`processed_offset` を残す。
- `total_rows`、header hash、snapshot hash が前回 failed 時と一致しない場合、chunk index offset を信頼せず full backfill または stable response high-water 方式へ退避する。
- 1 invocation の wall-clock / CPU budget を超えそうな場合は安全停止し、次回 tick で resume する。

### エッジケース

| ケース | 扱い |
| --- | --- |
| Sheets 行削除 / 挿入 / 並べ替え | offset invalidation。full backfill または stable ID 基準へ退避 |
| failed 行の `processed_offset=0` | 未開始または最初の chunk 失敗として扱う |
| 手動同期と cron の衝突 | `sync_locks` で排他。quota worst case には重複実行を含めない |
| 既存 `DEFAULT_MAX_RETRIES=5` | UT-09 で 3 へ変更 |
| `processed_offset` 列不在 | UT-09 / U-UT01-07 で migration 追加 |

### テスト構成

| Test | 内容 |
| --- | --- |
| V1 retry boundary | maxRetries=3、cap 32s、jitter 範囲を検証 |
| V2 offset resume | 600 行完了後 failed → chunk index 6 から再開 |
| V3 quota worst case | 2 req / 100s = 0.4% を再計算 |
| V4 migration impact | `processed_offset` DEFAULT 0 / rollback を机上検証 |
| V5 offset invalidation | row count / hash drift 時に resume しない |

### NON_VISUAL evidence

本タスクは UI / UX 変更を含まないため、スクリーンショットは作成しない。Phase 11 の代替証跡は以下を参照する。

| 証跡 | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | docs-only / NON_VISUAL の縮約判定 |
| `outputs/phase-11/manual-smoke-log.md` | spec walkthrough / link 検証 / canonical cross-reference ログ |
| `outputs/phase-11/link-checklist.md` | 参照リンク到達性 |

### 実装ステップ

1. `apps/api/migrations/0003_processed_offset.sql` を追加する。
2. `withRetry` を base 1s / cap 32s / jitter ±20% に対応させる。
3. `DEFAULT_MAX_RETRIES = 5` を `3` へ変更する。
4. chunk loop 成功後に `processed_offset` を更新する。
5. failed 再開または新 run_id 戦略を実装し、offset invalidation 条件をテスト化する。
6. `wrangler.toml` / `.dev.vars` の `SYNC_MAX_RETRIES` を 3 に揃える。
