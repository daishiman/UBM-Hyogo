# Phase 2: 設計（Queue vs Cron / batch contract / remaining-scan model）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（Queue vs Cron / batch contract / remaining-scan model） |
| 作成日 | 2026-05-05 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビューゲート） |
| 状態 | spec_created |
| 実装区分 | 実装仕様書 |
| タスク分類 | implementation（条件付き：着手 gate は Phase 11） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #361（CLOSED 維持） |

## 目的

Phase 1 で固定した「条件付き着手 gate の客観化 + 責務分離 boundary 設計」を、(1) **Queue vs Cron trade-off + 採用判断**、(2) **batch contract**（max batch size / interval / cursor / idempotent UPDATE pattern）、(3) **API response contract**（`confirmed` / `backfill.status`）、(4) **duplicate enqueue 防止 + partial failure recovery**、(5) **4 層責務図 + Cloudflare binding 設計**、(6) **migration 必要可否** の 6 成果物に分解する。Phase 3 が代替案比較で MAJOR / MINOR / PASS を出せる粒度の設計入力を作成する。

CONST_005 必須項目（変更対象ファイル一覧 / 関数シグネチャ案 / 入出力 / テスト方針 / ローカル実行コマンド / DoD）の骨格を本 Phase で提示し、深掘りは Phase 5 / 6 / 9 に委譲する。

---

## Write Target Decision（正本優先）

**採択: 既存 `schema_aliases` INSERT 主経路 + `schema_diff_queue` cursor / status の継承を維持**

親タスク UT-07B が確定した Stage 1（`schema_aliases` INSERT + `audit_log` + `schema_diff_queue.status='resolved'`）と Stage 2（`response_fields` の `__extra__:<questionId>` UPDATE + cursor）を踏襲する。本タスクは **Stage 2 の駆動主体を「単発 API request 内」から「Queue consumer or Cron handler 駆動」に振り替える** のみで、write target そのものは変更しない。

| 層 | 採用方針 |
| --- | --- |
| alias 確定（Stage 1） | API request 内で同期実行・即時 commit。`confirmed: true` 即時返却 |
| Stage 2 駆動 | base case = Cloudflare Queues。fallback case = Cron Trigger。Phase 11 evidence で最終確定 |
| dedupe 防御 | base case = `schema_diff_queue.dedupe_key` 列追加 + UNIQUE。fallback case = KV `SYNC_ALERTS` namespace に in-flight marker |
| failed_items 退避 | `schema_diff_queue` に `failed_items_json TEXT NULL` + `retry_count INTEGER DEFAULT 0` を追加。retry counter で無限ループ防止 |
| response 契約 | `confirmed: boolean` + `backfill: { status, remaining, lastProcessedAt }` に拡張。HTTP 200（`completed`）/ 202（`pending` / `running` / `exhausted`）境界を維持 |

---

## 設計判断（base case）

### 判断 1: Queue vs Cron trade-off + 採用判断（base case）

| 観点 | Cloudflare Queues | Cron Trigger（追加 1 本） |
| --- | --- | --- |
| latency | 低（producer→consumer は秒オーダー） | 中〜高（次 cron interval まで遅延。最短 `*/1` でも分単位） |
| batch size | producer 側で柔軟。consumer 1 fetch あたり最大 100 メッセージ | 1 fire 1 batch。size は handler 内で制御 |
| retry semantics | 自動再試行 + dead-letter queue（DLQ） | 手動実装。失敗時は `schema_diff_queue` 側に retry counter 必須 |
| dead-letter | 標準サポート（DLQ binding） | なし（自前で `failed_items_json` 退避） |
| 運用 visibility | Cloudflare dashboard で queue depth / DLQ 件数が可視 | `audit_log` + `schema_diff_queue.backfill_status` を読むしかない |
| cost | Workers Paid 推奨（Free でも 100k msg/day まで利用可） | Free プラン内で運用可（既存 cron 上限 5 本に制約） |
| Free プラン適合 | 100k msg/day 上限内なら可。production cron 上限 (Free 5 本) との二重制約あり | 既存 production cron が 2 本（u-04 sheets sync + 15 分間隔の何か）。追加 1 本で 3 本。Free 上限 5 本以内 |
| 実装規模 | producer + consumer + DLQ binding + wrangler 設定 | cron schedule 追加 + `scheduled()` handler 1 関数 + 既存 schedule 干渉確認 |
| 既存スタック整合 | `wrangler.toml` 既存に Queue 設定なし（新規導入） | 既存 cron 3 本（staging）/ 2 本（production）あり。運用ノウハウ蓄積済 |

**採択理由（base case = Queue 第一候補）**:

- back-fill 残件処理は **可視性 + DLQ + 自動 retry** が運用上強く効く。staging 10,000+ rows で recurring exhaustion が出る場合、queue depth で進捗を即可視化できる Queues が運用昇格に直結する。
- Cron は latency が cron interval に固定されるため、UI 起動 retry より遅く UX が劣化する（UT-07B-FU-02 の polling 実装と相性が悪い）。
- ただし **Free プラン制約** により Queues 採用が困難な場合（Workers Paid 未契約 / 100k msg/day 超過）は Cron に fallback する。Phase 11 evidence + 運用要件で最終確定する。

**最終決定の Phase 11 移譲ルール**:

- staging 持続再現 evidence の頻度が「1 日 100 件以上の `__extra__:<questionId>` 残件発生」を超える場合 → **Queues 必須**（Cron interval では追いつかない）。
- 「1 日 10 件未満」かつ「latency 許容 = 5 分以上」 → **Cron で十分**。
- 中間域 → **base case の Queues を採用** し、Workers Paid 切替を運用判断にエスカレーション。

### 判断 2: batch contract（remaining-scan model + idempotent UPDATE）

```typescript
// apps/api/src/workflows/schemaAliasBackfillBatch.ts（新規）
export interface BackfillBatchInput {
  diffId: string;
  questionId: string;
  newStableKey: string;
  maxBatchRows: number;       // base case: 500
  cpuBudgetMs: number;        // base case: 25_000（Workers Paid CPU limit 50s の半分）
}

export interface BackfillBatchResult {
  status: "running" | "exhausted" | "completed";
  processed: number;
  failedItems: Array<{ responseId: string; error: string }>;
  remaining: number;          // batch 終了時点の COUNT(*) WHERE key = '__extra__:<questionId>'
  lastProcessedAt: string;    // ISO 8601
}
```

**remaining-scan SQL pattern（idempotent UPDATE）**:

```sql
-- 残件の存在確認（毎 batch の冒頭で実行）
SELECT COUNT(*) AS remaining
  FROM response_fields rf
  WHERE rf.key = '__extra__:' || :questionId
    AND rf.response_id IN (
      SELECT r.id FROM responses r
      WHERE r.member_id NOT IN (SELECT id FROM deleted_members)
    );

-- batch UPDATE（id 順で LIMIT 適用）
UPDATE response_fields
   SET key = :newStableKey
 WHERE key = '__extra__:' || :questionId
   AND id IN (
     SELECT id FROM response_fields
      WHERE key = '__extra__:' || :questionId
        AND response_id IN (
          SELECT r.id FROM responses r
          WHERE r.member_id NOT IN (SELECT id FROM deleted_members)
        )
      ORDER BY id ASC
      LIMIT :maxBatchRows
   );
```

**idempotent 性証明**:
- batch UPDATE は WHERE 条件 `key = '__extra__:<questionId>'` で対象を絞るため、既に新 stableKey に置換された行は 2 度目以降の UPDATE でヒットしない。
- cursor を保持せず remaining-scan（毎 batch で残件 COUNT 再評価）により、failed_items を skip しても残件数は単調減少する（ただし failed_items 自体が `key = '__extra__'` のままなら remaining にカウントされ続けるため、retry counter 上限到達で `failed_items_json` に退避する）。
- 同一 batch を二重 enqueue しても、UPDATE は同じ行を 2 度更新するだけで結果は同一（key 値の冪等性）。

**batch parameters base case**:

| パラメータ | 値 | 根拠 |
| --- | --- | --- |
| `maxBatchRows` | 500 | 親タスク phase-02 large-scale-measurement-plan 既定。Phase 11 で動的調整余地 |
| `cpuBudgetMs` | 25,000 | Workers Paid 50s の半分。Cron handler でも同値 |
| Queue interval | producer 即時 enqueue | Cron 採用時 fallback: `*/5 * * * *`（5 分間隔） |
| `retry_count` 上限 | 5 | これを超えたら `failed_items_json` 退避し `backfill_status='failed'` |

### 判断 3: API response contract（`confirmed` / `backfill.status` 分離）

```typescript
// apps/api/src/routes/admin/schema.ts apply 応答
export interface ApplyAliasResponseV2 {
  ok: true;
  alias: { id: string; stableKey: string; questionId: string };
  confirmed: boolean;                          // Stage 1 結果（schema_aliases INSERT 成功）
  backfill: {
    status: "pending" | "running" | "exhausted" | "completed";
    remaining: number;                         // batch 終了時点の COUNT(*)
    lastProcessedAt: string | null;            // ISO 8601 / 未着手は null
  };
}
```

| 状態 | HTTP status | `confirmed` | `backfill.status` | 意味 |
| --- | --- | --- | --- | --- |
| Stage 1 成功 + Queue/Cron に enqueue 完了 | 202 | `true` | `pending` | 後続 batch を非同期で待つ |
| Stage 2 進行中（GET ステータス問い合わせ時） | 202 | `true` | `running` | consumer 動作中 |
| Stage 2 CPU budget 枯渇で次回継続 | 202 | `true` | `exhausted` | retry counter < 5 の間は自動再 enqueue |
| Stage 2 全件完了 | 200 | `true` | `completed` | 最終状態 |
| Stage 1 collision | 409 | `false` | `pending` | 既存 contract 維持（FU-01 では変更しない） |

**aiworkflow-requirements 同期更新点**:

- `references/api-endpoints.md`: `POST /admin/schema/aliases?dryRun=false` 応答に `confirmed` / `backfill.status: pending|running|exhausted|completed` / `remaining` / `lastProcessedAt` を追加。`code: backfill_cpu_budget_exhausted` / `retryable: true` は `backfill.status='exhausted'` の意味論として吸収（後方互換のため body に残置可）。
- `references/database-schema.md`: `schema_diff_queue` への `dedupe_key` / `failed_items_json` / `retry_count` カラム追加。
- `references/task-workflow-active.md`: `schemaAliasBackfillBatch` workflow を追加登録。

### 判断 4: duplicate enqueue 防止（base case = `dedupe_key` 列）

| 案 | 設計 | 利点 | 欠点 |
| --- | --- | --- | --- |
| **D-1: `schema_diff_queue.dedupe_key` 列追加 + UNIQUE（base case）** | `dedupe_key = sha256(diffId + questionId + newStableKey)`。enqueue 時 INSERT OR IGNORE | DB 単一 source of truth。re-enqueue は no-op | migration 1 段階増 |
| D-2: KV `SYNC_ALERTS` に in-flight marker（TTL 60s） | KV `SET` の atomic flag | migration 不要 | KV eventual consistency。同一 region で並列 enqueue 時にすり抜け得る |
| D-3: D1 row lock（既存 `schema_diff_queue.status` 遷移で代替） | 既存 schema 維持 | 追加なし | 並列 producer に対して race。`status='resolved'` 確認後の他 producer enqueue を弾けない |

**base case = D-1**。MAJOR を避け migration コストは 1 本許容。

### 判断 5: partial failure recovery（base case = `failed_items_json` + `retry_count`）

```sql
-- migration: schema_diff_queue カラム追加
ALTER TABLE schema_diff_queue ADD COLUMN dedupe_key TEXT;
ALTER TABLE schema_diff_queue ADD COLUMN failed_items_json TEXT;
ALTER TABLE schema_diff_queue ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_diff_queue_dedupe_key
  ON schema_diff_queue(dedupe_key) WHERE dedupe_key IS NOT NULL;
```

- batch 内で N 件 UPDATE 失敗 → `failed_items_json` に append し `retry_count++`
- `retry_count >= 5` で `backfill_status='failed'` に遷移、enqueue 停止
- 残件 scan は failed_items を含めず remaining だけ走査するため無限ループ不発生

### 判断 6: 4 層責務図 + Cloudflare binding 設計

```
┌─────────────────────────────────────────────────────────────────┐
│ route layer: apps/api/src/routes/admin/schema.ts                 │
│   - apply API: Stage 1 同期 + Queue/Cron enqueue + 202 返却      │
│   - GET status API（新設）: backfill.status / remaining 取得      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│ workflow layer: apps/api/src/workflows/                          │
│   - schemaAliasAssign.ts: Stage 1 のみに縮約 + enqueue 関数追加  │
│   - schemaAliasBackfillBatch.ts（新規）: 1 batch 処理関数         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│ queue consumer / cron handler layer:                             │
│   - apps/api/src/index.ts: queue() / scheduled() handler 拡張    │
│   - 共通: schemaAliasBackfillBatch を呼び、結果で再 enqueue 判断  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│ repository layer: apps/api/src/repository/                       │
│   - schemaDiffQueue.ts: dedupe_key / failed_items_json /         │
│       retry_count / lastProcessedAt の read/write                │
│   - responseFields.ts: remaining-scan / batch UPDATE             │
└─────────────────────────────────────────────────────────────────┘
```

**Cloudflare binding 設計（`wrangler.toml` 追加項目）**:

```toml
# base case: Queues 採用時
[[queues.producers]]
binding = "SCHEMA_ALIAS_BACKFILL_QUEUE"
queue = "schema-alias-backfill"

[[queues.consumers]]
queue = "schema-alias-backfill"
max_batch_size = 1            # 1 message per fetch（cursor は不要、remaining-scan で判断）
max_batch_timeout = 5
max_retries = 3
dead_letter_queue = "schema-alias-backfill-dlq"

# 同一の binding を [env.staging] / [env.production] に複製（drift 防止）
```

```toml
# fallback case: Cron Trigger 採用時
[triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *", "*/5 * * * *"]
# 4 本目を追加。Free 5 本以内
```

### 判断 7: migration 必要可否

| migration | 必要性 | 内容 |
| --- | --- | --- |
| `00NN_schema_diff_queue_dedupe_key.sql` | **必須**（D-1 採用） | `dedupe_key` / `failed_items_json` / `retry_count` カラム追加 + UNIQUE index |
| Queue binding の wrangler 適用 | 必須（base case） | `scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（その後 production） |
| 親タスクで追加された `backfill_cursor` / `backfill_status` カラム | 既存（変更なし） | 親 UT-07B で適用済 |

---

## CONST_005 必須項目（骨格）

### 変更対象ファイル一覧

| ファイル | 種別 | 変更概要 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 設定 | Queue producer/consumer + DLQ binding 追加（または cron schedule 追加） |
| `apps/api/migrations/00NN_schema_diff_queue_dedupe_key.sql` | 新規 migration | `dedupe_key` / `failed_items_json` / `retry_count` 追加 |
| `apps/api/src/workflows/schemaAliasAssign.ts` | 更新 | Stage 1 のみに縮約。Stage 2 を `enqueueBackfill` に分離 |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | 新規 | 1 batch 処理関数（remaining-scan + idempotent UPDATE） |
| `apps/api/src/routes/admin/schema.ts` | 更新 | `confirmed` / `backfill.status` response 契約。GET status エンドポイント追加 |
| `apps/api/src/repository/schemaDiffQueue.ts` | 更新 | dedupe_key / failed_items_json / retry_count の read/write |
| `apps/api/src/index.ts` | 更新 | `queue()` / `scheduled()` handler 拡張 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 同期更新 | `confirmed` / `backfill.status` 反映 |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 同期更新 | `schema_diff_queue` 列追加反映 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 同期更新 | `schemaAliasBackfillBatch` 登録 |

### 関数シグネチャ案

```typescript
// schemaAliasAssign.ts
export const enqueueBackfill = async (
  c: AppContext,
  input: { diffId: string; questionId: string; newStableKey: string }
): Promise<{ dedupeKey: string; alreadyEnqueued: boolean }>;

// schemaAliasBackfillBatch.ts
export const runBackfillBatch = async (
  c: AppContext,
  input: BackfillBatchInput
): Promise<BackfillBatchResult>;

// routes/admin/schema.ts
export const getBackfillStatus = (c: AppContext) => Promise<Response>; // GET /admin/schema/aliases/:diffId/backfill
```

### テスト方針

| 層 | テスト内容 |
| --- | --- |
| repository | `schemaDiffQueue.test.ts`: dedupe_key UNIQUE 衝突 / failed_items_json append / retry_count++ |
| workflow | `schemaAliasBackfillBatch.test.ts`（新規）: 1 batch / 2 batch / N 件 failed / remaining=0 |
| route | `schema.test.ts`: 202 + `confirmed:true, backfill.status:pending` / 200 + `completed` / GET status |
| integration | `queue() / scheduled()` を triggered させ DLQ 経路 / retry counter 上限到達 |
| staging | 10,000 / 50,000 / 100,000 行 fixture で持続再現性測定（Phase 11） |

### ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm/api test schemaAliasBackfillBatch
mise exec -- pnpm --filter @ubm/api typecheck
mise exec -- pnpm --filter @ubm/api lint

# 統合: wrangler dev で queue trigger を local 検証
mise exec -- pnpm --filter @ubm/api dev
```

### DoD（Definition of Done）骨格

- すべての `apps/api` test PASS
- staging 10,000+ rows after evidence で `backfill.status='completed'` 到達
- aiworkflow-requirements 3 ファイル同期 PR 同 wave
- runbook（Phase 5）に binding drift 検証手順記述
- Phase 9 で深掘り

---

## 成果物別の中身詳細

### outputs/phase-02/queue-vs-cron-tradeoff.md

- 上記 trade-off 表 + Free プラン制約 + Phase 11 移譲ルール
- 採用判断フロー図

### outputs/phase-02/batch-contract-design.md

- `BackfillBatchInput` / `BackfillBatchResult` 型定義
- remaining-scan SQL pattern + idempotent UPDATE 証明
- batch parameters 表（`maxBatchRows` / `cpuBudgetMs` / `retry_count` 上限）

### outputs/phase-02/response-contract-design.md

- `ApplyAliasResponseV2` 完全定義
- HTTP status × `backfill.status` マトリクス（5 ケース）
- aiworkflow-requirements 差分スニペット

### outputs/phase-02/dedupe-and-failure-recovery.md

- D-1 / D-2 / D-3 比較
- `failed_items_json` schema + retry counter 上限ルール
- migration DDL（`dedupe_key` / `failed_items_json` / `retry_count` + UNIQUE index）

### outputs/phase-02/binding-and-layer-design.md

- 4 層責務図
- `wrangler.toml` 追加項目（Queues 案 / Cron 案）
- staging / production / CI variables / runbook 同期手順骨格

### outputs/phase-02/migration-impact.md

- migration 1 本（`00NN_schema_diff_queue_dedupe_key.sql`）の前後関係
- 親タスク `backfill_cursor` / `backfill_status` 列との重複なし確認

---

## Schema / 共有コード Ownership 宣言

| 物理位置 | ownership | reader | writer |
| --- | --- | --- | --- |
| `apps/api/wrangler.toml` Queue/Cron セクション | UT-07B-FU-01 | apps/api runtime | UT-07B-FU-01 |
| `apps/api/migrations/00NN_schema_diff_queue_dedupe_key.sql`（新規） | UT-07B-FU-01 | apps/api（runner） | UT-07B-FU-01 のみ |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts`（新規） | UT-07B-FU-01 | apps/api queue/cron handler | UT-07B-FU-01 のみ |
| `apps/api/src/workflows/schemaAliasAssign.ts`（更新） | UT-07B-FU-01（Stage 1 縮約） | apps/api route | UT-07B-FU-01 |
| `apps/api/src/routes/admin/schema.ts`（更新） | UT-07B-FU-01（response 契約 + GET status） | admin UI client（FU-02） | UT-07B-FU-01 |
| `apps/api/src/repository/schemaDiffQueue.ts`（更新） | UT-07B-FU-01（dedupe / failed_items / retry） | apps/api workflow | UT-07B-FU-01 |
| aiworkflow-requirements 3 ファイル | aiworkflow-requirements（同期更新） | 全 task spec | 同期 PR で本タスクが更新 |

---

## 仕様語 ↔ 実装語対応表

| 仕様語 | TS 実装語 | SQL リテラル |
| --- | --- | --- |
| backfill.status: pending | `'pending'` | `'pending'` |
| backfill.status: running | `'running'` | `'running'` |
| backfill.status: exhausted | `'exhausted'` | `'exhausted'` |
| backfill.status: completed | `'completed'` | `'completed'` |
| internal backfill_status: failed | public `backfill.status='exhausted'` + `internalStatus:'failed'` | `'failed'` |
| confirmed | `confirmed: true` | -（Stage 1 commit 成功で導出） |
| dedupe_key | `dedupeKey` | `schema_diff_queue.dedupe_key` |
| failed_items | `failedItems[]` | `schema_diff_queue.failed_items_json` (TEXT JSON) |
| retry_count | `retryCount` | `schema_diff_queue.retry_count` |
| remaining | `remaining` | `SELECT COUNT(*) ...` 結果 |

---

## 実行タスク

1. `outputs/phase-02/queue-vs-cron-tradeoff.md` 起草（trade-off 表 + Phase 11 移譲ルール、完了条件: Queue / Cron どちらも採用条件が明示）。
2. `outputs/phase-02/batch-contract-design.md` 起草（型 + SQL pattern + idempotent 証明、完了条件: 二重 UPDATE 不発生証明含む）。
3. `outputs/phase-02/response-contract-design.md` 起草（5 ケースマトリクス + aiworkflow-requirements 差分、完了条件: 既存 `retryable: true` 後方互換明示）。
4. `outputs/phase-02/dedupe-and-failure-recovery.md` 起草（D-1/D-2/D-3 比較 + retry counter 上限、完了条件: 無限ループ防止証明）。
5. `outputs/phase-02/binding-and-layer-design.md` 起草（4 層図 + `wrangler.toml` 追加項目、完了条件: staging / production drift 防止手順骨格）。
6. `outputs/phase-02/migration-impact.md` 起草（migration 1 本の前後関係、完了条件: 親タスク列との重複なし確認）。
7. CONST_005 骨格（変更対象ファイル一覧 / 関数シグネチャ / 入出力 / テスト方針 / ローカル実行コマンド / DoD）を `outputs/phase-02/main.md` に集約。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-01.md` | 真の論点 / 苦戦箇所 / 既存差分 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md` | AC / metadata |
| 必須 | Issue #361 body | 起票仕様 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md` | 親タスク完了状態 |
| 必須 | `apps/api/src/workflows/schemaAliasAssign.ts` | Stage 1 / Stage 2 縮約対象 |
| 必須 | `apps/api/src/routes/admin/schema.ts` | response 契約拡張対象 |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | dedupe / failed / retry 列追加対象 |
| 必須 | `apps/api/wrangler.toml` | binding 追加対象 |
| 参考 | Cloudflare Queues 公式ドキュメント | Queue producer/consumer + DLQ semantics |
| 参考 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 同期更新対象 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 同期更新対象 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 同期更新対象 |

---

## 完了条件チェックリスト

- [ ] Queue vs Cron trade-off 表が `queue-vs-cron-tradeoff.md` に存在し、Phase 11 移譲ルールが明示
- [ ] `BackfillBatchInput` / `BackfillBatchResult` 型と remaining-scan SQL pattern が `batch-contract-design.md` に存在
- [ ] idempotent UPDATE の二重実行不発生証明が含まれる
- [ ] `ApplyAliasResponseV2` と HTTP 5 ケースマトリクスが `response-contract-design.md` に存在
- [ ] dedupe 案 D-1/D-2/D-3 比較が `dedupe-and-failure-recovery.md` に存在
- [ ] `failed_items_json` + `retry_count` 上限による無限ループ防止証明が含まれる
- [ ] 4 層責務図と `wrangler.toml` 追加項目（Queues + Cron 両案）が `binding-and-layer-design.md` に存在
- [ ] migration 1 本の DDL と親タスク列との重複なし確認が `migration-impact.md` に存在
- [ ] CONST_005 骨格（変更対象ファイル / 関数シグネチャ / 入出力 / テスト方針 / ローカル実行 / DoD）が `main.md` に存在
- [ ] Schema / 共有コード Ownership 宣言が含まれる
- [ ] 仕様語 ↔ 実装語対応表が含まれる
- [ ] 不変条件 #5 への影響方針が明示
- [ ] 各軸（Queue vs Cron / dedupe / response contract）で代替案 2 案以上比較

---

## 多角的チェック観点

- **代替案網羅**: Queue vs Cron は base case + fallback の 2 案に加え「両方採用」案も代替検討。dedupe は 3 案比較。response contract は「既存 `retryable: true` のみ維持」案を代替に含める。
- **不変条件 #5**: Queue consumer / Cron handler / migration / repository / workflow / route すべて apps/api 内で完結する設計。
- **migration 順序**: 親タスク `backfill_cursor` / `backfill_status` 列追加 → 本 migration（dedupe_key + failed_items_json + retry_count）の順序。逆転禁止。
- **idempotent 性**: remaining-scan 方式が cursor 方式と異なる点を明示し、failed_items skip 時の単調減少を証明。
- **後方互換**: 既存 `code: backfill_cpu_budget_exhausted` / `retryable: true` を `backfill.status='exhausted'` で吸収する移行戦略。
- **Free プラン適合**: Queues 採用時の 100k msg/day 制約と Workers Paid 切替の運用判断を明示。
- **dedupe key の安定性**: `sha256(diffId + questionId + newStableKey)` が同一 apply 試行で同値になることを保証。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `queue-vs-cron-tradeoff.md` 起草 | 2 | pending | trade-off + Phase 11 移譲 |
| 2 | `batch-contract-design.md` 起草 | 2 | pending | 型 + SQL + idempotent 証明 |
| 3 | `response-contract-design.md` 起草 | 2 | pending | 5 ケースマトリクス |
| 4 | `dedupe-and-failure-recovery.md` 起草 | 2 | pending | D-1/D-2/D-3 比較 |
| 5 | `binding-and-layer-design.md` 起草 | 2 | pending | 4 層図 + wrangler 追加 |
| 6 | `migration-impact.md` 起草 | 2 | pending | 親タスク列との重複なし |
| 7 | CONST_005 骨格集約 | 2 | pending | main.md |
| 8 | 代替案 2 案以上の比較完了 | 2 | pending | 各軸 |
| 9 | aiworkflow-requirements 差分スニペット作成 | 2 | pending | api-endpoints / database-schema / task-workflow-active |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | CONST_005 骨格 + 全成果物索引 |
| ドキュメント | outputs/phase-02/queue-vs-cron-tradeoff.md | trade-off 表 + 採用判断フロー |
| ドキュメント | outputs/phase-02/batch-contract-design.md | 型 + remaining-scan SQL + idempotent 証明 |
| ドキュメント | outputs/phase-02/response-contract-design.md | `confirmed` / `backfill.status` 契約 + 5 ケース |
| ドキュメント | outputs/phase-02/dedupe-and-failure-recovery.md | dedupe 3 案比較 + retry counter 上限 |
| ドキュメント | outputs/phase-02/binding-and-layer-design.md | 4 層図 + wrangler.toml 追加項目 |
| ドキュメント | outputs/phase-02/migration-impact.md | migration 1 本 DDL + 順序 |
| メタ | artifacts.json | Phase 2 状態の更新 |

---

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）と全サブタスク（9 件）が `spec_created` へ遷移
- 全成果物 7 ファイルが `outputs/phase-02/` 配下に配置済み
- 代替案比較が Queue vs Cron / dedupe / response contract 各軸で 2 案以上
- 不変条件 #5 を侵さない設計
- `artifacts.json` の `phases[1].status` が `spec_created`

---

## 次 Phase への引き渡し

- 次 Phase: 3（設計レビューゲート）
- 引き継ぎ事項:
  - Queue vs Cron base case = Queues + Phase 11 evidence 移譲ルール
  - batch contract base case = remaining-scan + idempotent UPDATE + `maxBatchRows=500` / `cpuBudgetMs=25_000`
  - response contract base case = `confirmed` + `backfill.status` 4 値 + HTTP 200/202/409
  - dedupe base case = `dedupe_key` 列 + UNIQUE index
  - partial failure recovery = `failed_items_json` + `retry_count <= 5`
  - 4 層責務 + `wrangler.toml` Queues / Cron 追加項目
  - migration 1 本（`00NN_schema_diff_queue_dedupe_key.sql`）
  - CONST_005 骨格（深掘りは Phase 5 / 6 / 9）
- ブロック条件:
  - 代替案比較が 2 案未満の軸が存在
  - idempotent 証明が remaining-scan 方式で示されていない
  - 後方互換（`retryable: true`）戦略が欠如
  - Free プラン適合性の明示が欠如
  - migration 順序が親タスク列と矛盾

---

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow / queue consumer / cron handler integration test に接続する。
- `dedupe_key` UNIQUE / `failed_items_json` / `retry_count`、remaining-scan idempotent UPDATE、`confirmed` / `backfill.status` response 契約、Queue producer/consumer、Cron handler、staging 10,000+ rows evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
