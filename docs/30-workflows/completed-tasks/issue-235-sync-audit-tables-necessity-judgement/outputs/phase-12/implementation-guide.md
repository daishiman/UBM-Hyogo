# Phase 12 Output: 実装ガイド（implementation-guide）

> 本タスクは **docs-only / 設計判定** であり「実装」は判定の確定そのもの。判定結論は「新設不要＝コード変更なし」。
> **UI/UX変更なしのため Phase 11 スクリーンショット不要**。

## Part 1: 中学生にもわかる説明

### なぜこの判断が必要だったの？

学校で「同期（データの取り込み）」を毎日実行する係がいると想像してください。係は記録ノートを持っています。

- いまの記録ノート（`sync_jobs`）には「いつ始めて」「いつ終わって」「成功か失敗か」「何件取り込んだか」が書けます。
- もう 1 冊、もっと細かい専用ノート（`sync_audit_logs`）を増やすべき？
- さらに、書き損じたときの貼り紙（`sync_audit_outbox`）も増やすべき？

昔の設計図（UT-21）は「3 冊持とう」と言っていました。でも 3 冊あると毎回 3 回書く手間が増えて、机が散らかります。

### 何を調べて、どう決めたの？

最新のプログラムを実際に見て調べました。

- いまの記録ノート（`sync_jobs`）と、もう 1 つの集計ノート（`sync_job_logs`）で、「何件取り込んだ」「何件失敗した」「どこまで進んだ」がちゃんと書けていました。
- 取り込みは「同じものを何度やっても結果が同じ（冪等）」なので、途中で失敗しても次の回が続きから再開できます。だから「書き損じの貼り紙」は要りませんでした。
- 「1 行ずつの細かい記録」が法律やルールで必要、ということもありませんでした。

だから結論は「**新しいノートは増やさない（新設不要）**」です。増やす必要が出てきたときのための条件（T-1〜T-3）だけ、メモに残しました。

### たとえ話のまとめ

- いまのノート 2 冊で足りているのに 3 冊目を増やすのは、使わない筆箱を買い足すようなもの。
- でも将来「どうしても 1 行ずつ記録が要る」状況になったら、そのときに増やせばいい。条件だけ先に書いておきました。

### 専門用語セルフチェック

| 用語 | かんたんな意味 | このタスクでの意味 |
| --- | --- | --- |
| ledger | 記録ノート | `sync_jobs` / `sync_job_logs` の実行記録 |
| metrics_json | 数字をまとめたメモ欄 | 同期件数・失敗数・cursor などの構造化 JSON |
| outbox | 後で送るための一時箱 | `sync_audit_outbox` は現時点で不要 |
| 冪等 | 何度やっても同じ結果になること | 失敗後に cursor から再開できる性質 |
| DDL | データベースの形を作る命令 | 新テーブル migration は作らない |
| docs-only | 文書だけで完了する作業 | コード変更ゼロを証跡で示す判定タスク |

## Part 2: 技術者向け詳細

### 判定対象と結論

| 項目 | 値 |
| --- | --- |
| 判定対象 | `sync_audit_logs`（毎実行詳細）/ `sync_audit_outbox`（書込失敗 best-effort 退避） |
| 結論 | **新設不要（NO NEW TABLE REQUIRED）** |
| 充足手段 | `sync_jobs` ledger + `sync_job_logs` 補助台帳 + zod 構造化 `metrics_json` |

### 確定判定の実測根拠（本サイクルで現行コードに対して再検証済み）

| 観点 | 実測コマンド | 結果 |
| --- | --- | --- |
| `sync_jobs` 正本 ledger の実在 | `grep -n 'CREATE TABLE IF NOT EXISTS sync_jobs' apps/api/migrations/*.sql` | `0003_auth_support.sql:22` で CREATE（実在） |
| 運用ログ ledger の実在 | `grep -n 'CREATE TABLE' apps/api/migrations/0002_sync_logs_locks.sql` | `sync_locks`(:6) / `sync_job_logs`(:14) を CREATE（実在） |
| `sync_audit_logs` の新設有無 | `grep -ci 'create table[^;]*sync_audit_logs' apps/api/migrations/*.sql` | **0 件** |
| `sync_audit_outbox` の新設有無 | `grep -ci 'create table[^;]*sync_audit_outbox' apps/api/migrations/*.sql` | **0 件** |
| `sync_audit` 言及 | `grep -rni 'sync_audit' apps/api/migrations/` | 1 件のみ＝`0002_sync_logs_locks.sql:4` の**コメント** |
| src 参照 | `rg -n -e 'sync_audit_logs' -e 'sync_audit_outbox' apps/api/src/` | **0 件**（no output / exit 1） |

### API シグネチャ / 使用例

本タスクは新規 API / 新規 repository 関数 / 新規 D1 table を追加しないため、追加シグネチャは **N/A**。参照する既存契約は次の通り。

| 既存契約 | 用途 | 使用例 |
| --- | --- | --- |
| `syncJobs.start(input)` | 同期 job 開始 | schema / response sync が `job_type` ごとに running job を作る |
| `syncJobs.succeed(jobId, metrics)` | 成功 metrics 記録 | `metrics_json` に processed / writes / cursor を保存 |
| `syncJobs.fail(jobId, error)` | 失敗詳細記録 | `error_json` と failed status を保存 |

新設しないもの:

```ts
// N/A: この判定では追加しない
// createSyncAuditLog(...)
// enqueueSyncAuditOutbox(...)
```

### 現行 ledger 契約（正本）

```
-- apps/api/migrations/0003_auth_support.sql
CREATE TABLE IF NOT EXISTS sync_jobs (
  job_id        TEXT PRIMARY KEY,
  job_type      TEXT NOT NULL,            -- schema_sync / response_sync
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  status        TEXT NOT NULL DEFAULT 'running',  -- running -> succeeded/failed（一方向）
  error_json    TEXT,
  metrics_json  TEXT NOT NULL DEFAULT '{}'
);
```

```ts
// apps/api/src/jobs/_shared/sync-jobs-schema.ts（抜粋）
export const metricsJsonBaseSchema = z
  .object({
    cursor: z.string().nullable().optional(),
    processed: z.number().int().nonnegative().optional(),
    writes: z.number().int().nonnegative().optional(),
    error_count: z.number().int().nonnegative().optional(),
    skipped: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
    writeCapHit: z.boolean().optional(),
    reason: z.string().optional(),
    lock_acquired_at: z.string().datetime().nullable().optional(),
  })
  .passthrough()           // 任意キー拡張は DDL 変更なしで可能
  .superRefine(/* assertNoPii: PII_FORBIDDEN_KEYS を遮断 */);
```

- `sync_job_logs`（`0002_sync_logs_locks.sql`）: `fetched_count` / `upserted_count` / `failed_count` / `retry_count` / `duration_ms` / `error_reason` の run 単位カウント列。
- lifecycle（`apps/api/src/repository/syncJobs.ts`）: `start` → `succeed(metrics)` / `fail(error)`。`ALLOWED_TRANSITIONS` で状態遷移を一方向に強制。

### ギャップ分析（UT-21 audit 観点 × 現行）

| 観点 | 現行カバー | 手段 |
| --- | --- | --- |
| O-1 実行ごと詳細 | ◯ | `metrics_json`（zod 構造化）+ `sync_job_logs` |
| O-2 書込失敗 outbox | ◯ | D1 retry / backoff + 冪等 cursor 再開。`error_json` / `error_reason` に記録 |
| O-3 後追い清書 | ◯（不要） | outbox を持たないため flush 不要 |
| O-4 行単位差分 | △（集計代替） | `metrics_json` 集計 + count 列。行単位 audit は MVP 監査要件外 |

### 判定基準 4.3（3 条件すべて非該当）

1. 行単位差分が必須要件 → 非該当（仕様に要件なし）。
2. `sync_jobs` 書込失敗の別経路記録が必要 → 非該当（D1 retry + 冪等再開で吸収）。
3. 外部監査・コンプラの分離要請 → 非該当（インシデント / エスカレーション 0 件）。

### 設定可能パラメータ / 既存定数

| 名称 | 場所 | 役割 |
| --- | --- | --- |
| `SYNC_LOCK_TTL_MINUTES` | sync-jobs-schema.ts | ロック TTL（10 分） |
| `PII_FORBIDDEN_KEYS` | sync-jobs-schema.ts | metrics_json の PII 遮断キー |
| `ALLOWED_TRANSITIONS` | syncJobs.ts | status 一方向遷移 |

### エラーハンドリング / エッジケース

- `metrics_json` は `.passthrough()` のため将来 metric 追加で新設不要の結論は不変。
- `sync_audit`（単数）コメント文字列（`0002:4`）は判定対象（`_logs` / `_outbox`）と別物。誤検知に注意。

### 解除条件（将来コード化が必要になる場合）

T-1（行単位差分が監査要件化）/ T-2（書込失敗の恒久別経路が必要なインシデント）/ T-3（集計で追跡不能かつ列拡張で吸収困難）のいずれか発生時のみ、別タスクの **実装仕様書**（新規テーブル DDL + `apps/api` audit writer + flush job + test）を起票する。本サイクルでは該当 0 件のため起票しない。

### 実コード変更（本サイクル）

**なし（docs-only）。** 完了条件 #4 のとおり `git status --short apps packages` = 0 件で実証する。判定確定を回帰固定するガードテストの追加も検討したが、完了条件 #4（apps/packages 0 件）と衝突するため採用せず、回帰防止意図は本ガイド・verdict-runbook・解除条件で担保する。コード変更がないため `typecheck` / `lint` は本判定の必須検証ではなく、Phase 11 の read-only 再現コマンドを一次証跡とする。
