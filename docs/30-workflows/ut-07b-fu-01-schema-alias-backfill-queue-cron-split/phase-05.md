# Phase 5: 仕様 runbook 作成（binding 追加 / Queue/Cron 設定 / response contract / migration）

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | Schema alias back-fill queue/cron split (UT-07B-FU-01) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 仕様 runbook 作成 |
| 作成日 | 2026-05-05 |
| 前 Phase | 4（検証戦略） |
| 次 Phase | 6（異常系） |
| 状態 | spec_created |
| タスク分類 | implementation（runbook / 実装仕様 中核） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |

## 目的

本 Phase は UT-07B-FU-01 の **実装仕様書としての中核** であり、CONST_005 必須項目（変更対象ファイル / 関数シグネチャ / 入出力 / テスト方針 / ローカル実行コマンド / DoD）をすべて埋める。Phase 2 で確定した Queue / Cron 設計判断を、Cloudflare binding 設定 / TypeScript シグネチャ / D1 migration / API contract migration / 検証コマンドの 5 軸で運用可能な実装仕様として正本化する。

実 binding apply / 実 migration apply / 実コード commit は Phase 8〜13 で行う。本 Phase は「実装に着手すれば一意にコードが書ける粒度」までを確定する。

## 完了条件チェックリスト

- [ ] 変更対象ファイル一覧（パス × 新規/編集/削除 × 役割）が表で確定している
- [ ] 主要関数・型シグネチャ（TypeScript）が CONST_005 粒度で記述されている
- [ ] 入力・出力・副作用テーブルが関数ごとに整備されている
- [ ] migration runbook（適用順序 / rollback / staging dry-run）が記述されている
- [ ] Cloudflare binding 設定（`wrangler.toml` の queue producer / consumer / cron / staging-production 同期 / CI variables）が `[[queues.producers]]` / `[[queues.consumers]]` / `[triggers].crons` の TOML スニペットとして記述されている
- [ ] API contract migration（旧 HTTP 202 + `error: 'backfill_cpu_budget_exhausted'` → 新 HTTP 200 + `confirmed: true, backfill.status: 'pending'`）の breaking change 影響範囲が記述されている
- [ ] ローカル実行・検証コマンドが `mise exec` / `scripts/cf.sh` 経由で列挙されている
- [ ] DoD（ビルド / typecheck / lint / 全テスト PASS / staging 10K+ rows after evidence で `backfill.status: completed`）が記述されている
- [ ] 「本タスクでは手順書化のみ。実 binding apply / 実 migration apply は Phase 8 以降」の明示

## 実行タスク

1. 変更対象ファイル一覧を表化する。
2. 主要関数・型シグネチャを TypeScript で記述する（`enqueueBackfillJob` / `processBackfillBatch` / `getBackfillStatus` / `AliasApplyResponse`）。
3. 入力 / 出力 / 副作用テーブルを関数ごとに整備する。
4. migration runbook（dedupe_key / failed_items_json / retry_count / last_error カラム追加）を起草する。
5. Cloudflare binding 設定（queue producer / consumer / cron / staging / production 同期 / CI variables）を起草する。
6. API contract migration（breaking change）の移行手順を起草する。
7. ローカル実行・検証コマンドと DoD を起草する。

---

## 1. 変更対象ファイル一覧

| パス | 区分 | 役割 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 編集 | `[[queues.producers]]` / `[[queues.consumers]]` / `[triggers].crons` に back-fill 用 binding を追加。staging / production 双方に同期 |
| `apps/api/src/workflows/schemaAliasAssign.ts` | 編集 | alias 確定 (Stage 1) 後、Stage 2 同期 back-fill を撤廃し、`enqueueBackfillJob` 呼び出しに置換 |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | 新規 | queue consumer entry（`processBackfillBatch`）。1 batch = 1 D1 transaction、idempotent UPDATE、retry/dead-letter |
| `apps/api/src/index.ts` | 編集 | Cloudflare Queue `queue()` handler。message ごとに `runBackfillBatch` を呼び、必要時だけ再 enqueue |
| `apps/api/src/routes/admin/schema.ts` | 編集 | `POST /admin/schema/aliases` の response 形状を新 contract（`confirmed` / `backfill.status`）に変更。`GET /admin/schema/aliases/:id/backfill-status` を追加 |
| `apps/api/src/repository/schemaAliases.ts` | 編集 | alias 確定後の戻り値型を AliasApplyResponse に整合 |
| `apps/api/src/repository/schemaDiffQueue.ts` | 編集 | dedupe key 列追加、`enqueueIfAbsent` / `loadByAliasId` / `markProcessed` / `incrementRetry` ヘルパ追加 |
| `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | 新規 | `schema_diff_queue` に `dedupe_key`, `failed_items_json`, `retry_count`, `last_error` カラム追加 + UNIQUE INDEX。`processed_offset` は採用せず remaining-scan を正本とする |
| `apps/api/src/index.ts` | 編集 | Hono fetch handler に加え `queue` / `scheduled` exports を Cloudflare Workers entry として追加 |
| `apps/api/src/routes/admin/schema.test.ts` | 編集 | 新 contract の T-R-* テストへ更新 |
| `apps/api/src/workflows/schemaAliasBackfillBatch.test.ts` | 新規 | T-W-* 系（partial failure / idempotent / dedupe） |
| `apps/api/src/repository/schemaDiffQueue.test.ts` | 編集 | T-Q-* 系（dedupe / failed_items_json / retry_count / remaining-scan） |

---

## 2. 主要関数・型シグネチャ（TypeScript）

```ts
// apps/api/src/workflows/schemaAliasBackfillBatch.ts

export interface BackfillJobMessage {
  aliasId: string;
  revisionId: string;
  stableKey: string;
  questionId: string;
  /** at-least-once 再配送下での idempotent 検証用。既に処理済みなら no-op */
  enqueuedAt: number;
}

export interface EnqueueResult {
  /** Cloudflare Queue の messageId（dedupe で skip された場合は null） */
  messageId: string | null;
  /** 既存 dedupe key が存在し新規 enqueue を抑止した場合 true */
  deduped: boolean;
}

export interface BatchProcessResult {
  /** この batch で UPDATE した response_fields 件数 */
  processed: number;
  /** 残件 (remaining-scan による対象行数) */
  remaining: number;
  /** 'completed' = 残 0, 'pending' = 続行可能, 'exhausted' = budget 枯渇 / cron 待ち */
  status: BackfillStatus;
}

export type BackfillStatus = 'pending' | 'running' | 'exhausted' | 'completed';

export interface BackfillStatusView {
  status: BackfillStatus;
  /** 残件推定（remaining-scan 結果） */
  remaining: number;
  /** 直近 batch 完了 ISO8601 / 未処理なら null */
  lastProcessedAt: string | null;
  /** retry 回数 / dead-letter 判定用 */
  retryCount: number;
}

/**
 * alias 確定後に back-fill job を queue にエンキューする。
 * dedupe key が既存なら再 enqueue せず deduped:true を返す（idempotent）。
 */
export function enqueueBackfillJob(
  env: Env,
  input: { aliasId: string; revisionId: string; stableKey: string; questionId: string },
): Promise<EnqueueResult>;

/**
 * queue consumer entry。1 batch = 1 D1 transaction で remaining-scan + idempotent UPDATE を実行。
 * 完了時は status='completed'、残件あり + budget 余りなら同 message を再 enqueue（pending）、
 * budget 枯渇なら status='exhausted'（cron handler で再駆動される）。
 */
export function processBackfillBatch(
  env: Env,
  message: BackfillJobMessage,
): Promise<BatchProcessResult>;

/**
 * apply API response の `backfill` フィールドに埋める View モデルを返す。
 */
export function getBackfillStatus(
  env: Env,
  input: { aliasId: string },
): Promise<BackfillStatusView>;

// apps/api/src/routes/admin/schema.ts

export interface AliasApplyResponse {
  /** alias 確定が DB に commit 済みなら true。false は 409/422 のみ */
  confirmed: boolean;
  alias: AliasRecord;
  backfill: {
    status: BackfillStatus;
    remaining: number;
    lastProcessedAt: string | null;
  };
}
```

---

## 3. 入力 / 出力 / 副作用テーブル

### `enqueueBackfillJob`

| 項目 | 内容 |
| --- | --- |
| 入力 | `{ aliasId, revisionId, stableKey, questionId }` |
| 出力 | `{ messageId, deduped }` |
| 副作用 | (1) `schema_diff_queue` に `dedupe_key = ${aliasId}:${revisionId}:${stableKey}` で INSERT OR IGNORE、(2) UNIQUE 制約で skip された場合は queue に send しない、(3) 新規行のみ `env.SCHEMA_BACKFILL_QUEUE.send(message)` |
| 例外 | Queue API の一時障害は throw（compensation: alias 確定はそのまま、`backfill.status:'pending'` で残し cron で recover） |

### `processBackfillBatch`

| 項目 | 内容 |
| --- | --- |
| 入力 | `BackfillJobMessage`（at-least-once 配送） |
| 出力 | `{ processed, remaining, status }` |
| 副作用 | (1) `schema_diff_queue` の remaining-scan 状態再評価、(2) `response_fields` の UPDATE（remaining-scan model）、(3) status='pending' なら同 message を再 enqueue、(4) 例外時 retry_count++, max 超過で internal failed 相当 + public `backfill.status='exhausted'` |
| 例外 | partial failure（N 件中 M 件失敗）は tx 内で成功分のみ commit、失敗分は次 batch へ持ち越し（retry_count++）|

### `getBackfillStatus`

| 項目 | 内容 |
| --- | --- |
| 入力 | `{ aliasId }` |
| 出力 | `BackfillStatusView`（status + remaining + lastProcessedAt + retryCount） |
| 副作用 | read-only |

### `POST /admin/schema/aliases`（新 contract）

| 項目 | 内容 |
| --- | --- |
| 入力 | `{ revisionId, questionId, stableKey, dryRun? }` |
| 出力 | 200 = `AliasApplyResponse` / 409 = collision / 422 = validation |
| 副作用 | (1) Stage 1 で `schema_questions` 更新 + `schema_aliases` 追加（既存どおり）、(2) Stage 2 を `enqueueBackfillJob` 呼び出しに置換（同期 back-fill 撤廃）、(3) response の `backfill` は enqueue 直後の `getBackfillStatus` 結果 |

---

## 4. Migration runbook

### Step 0: 既存 `schema_diff_queue` の dedupe 整合確認

```sql
-- 既存に同 alias_id × revision_id × stable_key の重複が無いか確認
SELECT alias_id, revision_id, stable_key, COUNT(*) AS dup
FROM schema_diff_queue
GROUP BY alias_id, revision_id, stable_key
HAVING COUNT(*) > 1;
```

- 0 件 → Step 1 へ。
- ≥ 1 件 → 古い row を `processed_at IS NOT NULL` 条件で物理削除し、再実行で 0 件確認。

### Step 1: カラム追加 migration

`apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql`

```sql
ALTER TABLE schema_diff_queue ADD COLUMN dedupe_key TEXT NULL;
ALTER TABLE schema_diff_queue ADD COLUMN failed_items_json TEXT NULL;
ALTER TABLE schema_diff_queue ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schema_diff_queue ADD COLUMN last_error TEXT NULL;

-- 既存行の dedupe_key を埋める（後続 INSERT OR IGNORE のため）
UPDATE schema_diff_queue
   SET dedupe_key = alias_id || ':' || revision_id || ':' || stable_key
 WHERE dedupe_key IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_diff_queue_dedupe_key
  ON schema_diff_queue (dedupe_key)
  WHERE dedupe_key IS NOT NULL;
```

### Step 2: 適用コマンド

```bash
# staging dry-run
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# production
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

### Step 3: rollback

```sql
DROP INDEX IF EXISTS idx_schema_diff_queue_dedupe_key;
-- ALTER TABLE DROP COLUMN は D1 で限定的。失敗時はテーブル再作成。
BEGIN;
CREATE TABLE schema_diff_queue_new AS
  SELECT id, alias_id, revision_id, stable_key, question_id, processed_at, created_at
  FROM schema_diff_queue;
DROP TABLE schema_diff_queue;
ALTER TABLE schema_diff_queue_new RENAME TO schema_diff_queue;
COMMIT;
```

`audit_log` に `action='backfill_split_migration_rollback'` を記録すること。

---

## 5. Cloudflare binding 設定（`wrangler.toml`）

### 5.1 producer / consumer / cron 追加スニペット（base 設定）

```toml
# Schema alias back-fill 専用 queue
[[queues.producers]]
queue = "schema-backfill"
binding = "SCHEMA_BACKFILL_QUEUE"

[[queues.consumers]]
queue = "schema-backfill"
max_batch_size = 10
max_batch_timeout = 5
max_retries = 5
dead_letter_queue = "schema-backfill-dlq"

[[queues.producers]]
queue = "schema-backfill-dlq"
binding = "SCHEMA_BACKFILL_DLQ"

# Cron: 5 分間隔で stale な exhausted/running を再 enqueue
[triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *", "*/5 * * * *"]
```

### 5.2 staging / production 同期方針

| ブロック | 適用範囲 | 備考 |
| --- | --- | --- |
| `[[queues.producers]]` / `[[queues.consumers]]` (top-level) | base + staging + production すべて | binding 名と queue 名を 3 環境で完全一致 |
| `[env.staging.queues]` / `[env.production.queues]` | env 個別 | base 設定を上書きする際に明示 |
| `[triggers].crons` | base + staging + production | production は free plan account cron 上限を考慮し、`*/5 * * * *` を `*/15 * * * *` 1 本に集約する選択肢を Phase 2 trade-off 表で記録 |
| Queue 作成 | manual | `bash scripts/cf.sh queues create schema-backfill` を staging/production 双方で実行（rollback 時は `queues delete`） |

### 5.3 CI variables / runbook 同期

- GitHub Actions（CI）: `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` は既存の Variables / Secrets を再利用。queue 名は `wrangler.toml` の正本に従い code 側に持たせない。
- runbook: `docs/01-infrastructure-setup/` 配下に `cloudflare-queues-schema-backfill.md` を新規追加し、queue 作成 / DLQ 作成 / cron 上限の運用を記録（Phase 12 で同期）。

---

## 6. API contract migration（breaking change）

### 6.1 旧 → 新 対応表

| シナリオ | 旧 contract（撤廃） | 新 contract |
| --- | --- | --- |
| apply 完全成功（小規模） | 200 / `{ alias, backfill: { status: 'completed', updated } }` | 200 / `{ confirmed: true, alias, backfill: { status: 'completed', remaining: 0, lastProcessedAt } }` |
| apply alias 確定 + 継続 | 202 / `{ backfill: { status: 'in_progress', cursor } }` | 200 / `{ confirmed: true, alias, backfill: { status: 'pending' \| 'running', remaining, lastProcessedAt } }` |
| apply alias 確定 + CPU 枯渇 | 202 / `{ backfill: { status: 'exhausted', code: 'backfill_cpu_budget_exhausted', retryable: true } }` | 200 / `{ confirmed: true, alias, backfill: { status: 'exhausted', remaining, lastProcessedAt } }` |
| collision | 409 | 同（変更なし） |
| validation | 422 | 同（変更なし） |

### 6.2 影響範囲と移行手順

- 影響範囲: admin UI client（`apps/web` の admin schema 画面）/ `aiworkflow-requirements/references/api-endpoints.md` / 親タスク UT-07B の test fixture
- 移行手順:
  1. 新 contract を route に実装し、旧 202 形式を撤廃
  2. admin UI client は `confirmed` / `backfill.status` のみを参照するよう更新
  3. UT-07B 親タスクで使用した「旧 202 retryable」前提の test を archive
  4. `aiworkflow-requirements/references/api-endpoints.md` の `POST /admin/schema/aliases` セクションを Phase 12 で書き換え
- Backward compatibility: 移行は同一 PR で完結（admin UI と route を同期更新）。external API consumer は admin UI のみのため breaking change の外部影響なし。

### 6.3 GET `/admin/schema/aliases/:id/backfill-status`（新規）

| 項目 | 内容 |
| --- | --- |
| 認可 | admin only |
| 出力 | 200 / `BackfillStatusView` |
| 用途 | admin UI が apply 後 polling で `backfill.status` を再取得（UT-07B-FU-02 で UI 化） |

---

## 7. ローカル実行・検証コマンド

```bash
# 依存（Node 24 / pnpm 10 を mise で固定）
mise install
mise exec -- pnpm install

# 静的検査
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint

# テスト
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api test src/workflows/schemaAliasBackfillBatch.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test src/repository/schemaDiffQueue.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test src/routes/admin/schema.test.ts

# ビルド
mise exec -- pnpm --filter @ubm-hyogo/api build

# staging deploy（実 binding apply は Phase 11 着手 gate 成立後）
bash scripts/cf.sh queues create schema-backfill
bash scripts/cf.sh queues create schema-backfill-dlq
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

> CLAUDE.md 規約に従い `wrangler` 直接実行は禁止。すべて `scripts/cf.sh` 経由（op + esbuild 解決込み）。

---

## 8. DoD（Definition of Done）

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` 成功
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api lint` 成功
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` 全件 PASS（T-U / T-R / T-W / T-Q）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api build` 成功
- [ ] staging に migration apply / queue 作成 / deploy 完了
- [ ] staging 10,000 rows fixture で apply 直後 `backfill.status:'pending'` を返し、queue/cron 駆動で `backfill.status:'completed'` に収束（after evidence）
- [ ] `aiworkflow-requirements/references/api-endpoints.md` / `database-schema.md` 差分が Phase 12 で同期適用される予約
- [ ] PR レビュー（solo dev: branch protection の `required_status_checks` PASS のみで足りる）

---

## 注意事項

- 本 Phase は **手順書化のみ**。実 binding apply / 実 migration apply / 実コード commit は Phase 8〜13 で実行する。
- Phase 11 着手 gate（staging 10K+ rows で `backfill_cpu_budget_exhausted` が持続再現）が不成立の場合、本 Phase の仕様は spec_created のまま据え置き、再現時に再起動する。
- Cloudflare Queue の使用には **Workers Paid plan** が必要な可能性がある。free plan のみで運用する場合は Phase 2 trade-off 表に従い Cron Trigger 単独構成（queue 不使用 / cron が `schema_diff_queue` を直接走査）にフォールバックする。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-02.md` | Queue vs Cron 設計判断 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-04.md` | テストケース連結 |
| 必須 | `apps/api/wrangler.toml` | binding 編集対象 |
| 必須 | `apps/api/src/workflows/schemaAliasAssign.ts` | Stage 2 撤廃対象 |
| 必須 | `apps/api/src/routes/admin/schema.ts` | response 形状変更対象 |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | dedupe / failed_items_json / retry_count / remaining-scan 拡張対象 |
| 必須 | `apps/api/migrations/0013_meeting_sessions_soft_delete.sql` | 次番号 0014 の連番起点 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | API contract 同期更新対象 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | D1 schema 同期更新対象 |
| 参考 | CLAUDE.md § Cloudflare CLI 実行ルール | `scripts/cf.sh` 経由必須 |

## 苦戦箇所【記入必須】

- 旧 contract（HTTP 202 + `error: 'backfill_cpu_budget_exhausted'`）の撤廃は breaking change だが、admin UI のみの consumer のため同一 PR で同期更新可能。これを誤って external consumer 想定のまま deprecation period を設けると Phase 13 PR の scope が肥大化する。
- Cloudflare Queue は Workers Paid plan の制約があり、free plan 運用継続なら Cron Trigger 単独構成にフォールバックする。Phase 2 trade-off 表でどちらに倒したかを Phase 11 着手 gate 判定時に再確認する必要がある。
- `ALTER TABLE ADD COLUMN` の D1 制約上、`DEFAULT` 付きで NOT NULL 列を追加できない場合があるため、`retry_count` は `DEFAULT 0` を明示し、`failed_items_json` / `last_error` は nullable とする。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | breaking change の影響範囲が admin UI 内に閉じ、external consumer に影響しない（apps/web の admin schema 画面のみ）|
| 実現性 | PASS | wrangler.toml の `[[queues.*]]` / `[triggers]` は既存記述パターン（`*/15 * * * *` cron）を踏襲。migration は `ALTER TABLE ADD COLUMN` のみ |
| 整合性 | PASS | 不変条件 #5（D1 直接アクセスは apps/api 限定）を queue consumer / cron handler すべて apps/api 内で完結させることで維持 |
| 運用性 | PASS | `scripts/cf.sh` 経由で 1 コマンドずつ実行可能。free plan フォールバック（Cron 単独）も明記 |

## 受入条件（AC）

本 Phase は **AC-3 / AC-4 / AC-5 / AC-6 / AC-9** の根拠成果物を作成する責務を担う。

- AC-3（責務分離）: §2 関数シグネチャ + §3 副作用テーブルで Stage 1 / Stage 2 の責務分離を契約化
- AC-4（response contract）: §6 で旧 → 新 contract 移行を表化
- AC-5（remaining-scan + idempotent）: §2 `processBackfillBatch` シグネチャ + §3 副作用テーブル
- AC-6（binding が staging/production/CI で一致）: §5 同期方針
- AC-9（D1 直接アクセスは apps/api 限定）: §1 変更対象ファイル一覧で apps/web 配下が含まれないことを明示

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-spec.md | §1〜§8（変更対象 / 関数シグネチャ / 入出力 / migration / binding / contract migration / コマンド / DoD） |
| ドキュメント | outputs/phase-05/migration-runbook.md | §4 を独立成果物化（Step 0〜3） |
| ドキュメント | outputs/phase-05/api-contract-update.md | §6 を独立成果物化（旧→新対応表 + breaking change 影響） |
| メタ | artifacts.json | Phase 5 状態の更新 |

## 多角的チェック観点

- **CONST_005 必須項目網羅**: 変更対象ファイル / 関数シグネチャ / 入出力 / テスト方針 / ローカル実行コマンド / DoD の 6 項目すべてが本 Phase 内で解決しているか。
- **不変条件 #5**: §1 の変更対象ファイル一覧に `apps/web/**` が含まれていないか。queue consumer / cron handler が apps/api 内に閉じているか。
- **breaking change の閉じ込め**: §6 移行手順が同一 PR 内で admin UI / route / docs を同期更新する形になっているか。
- **binding 同期**: §5 で base / staging / production / CI variables の 4 箇所すべてに同一 queue 名 / binding 名 / cron が記述されているか。
- **rollback 可能性**: §4 Step 3 が D1 の `ALTER TABLE DROP COLUMN` 制限を踏まえた手順になっているか。
- **`scripts/cf.sh` ガード**: §7 の全コマンドが `wrangler` 直接実行を含まないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 変更対象ファイル一覧 | 5 | pending | 12 ファイル |
| 2 | 関数 / 型シグネチャ | 5 | pending | 4 関数 + 3 type |
| 3 | 入出力 / 副作用テーブル | 5 | pending | 4 関数分 |
| 4 | migration runbook | 5 | pending | Step 0〜3 |
| 5 | binding 設定スニペット | 5 | pending | producer / consumer / cron / DLQ |
| 6 | API contract migration | 5 | pending | 旧→新対応表 + 移行手順 |
| 7 | ローカル実行コマンド | 5 | pending | mise + scripts/cf.sh |
| 8 | DoD | 5 | pending | typecheck / lint / test / build / staging after evidence |

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created` へ遷移
- §1〜§8 のすべての節が必要項目で埋まっている
- CONST_005 必須項目（変更対象 / 関数シグネチャ / 入出力 / テスト方針 / ローカル実行 / DoD）が全て本 Phase 内に存在
- 旧 → 新 contract 移行表が breaking change の影響範囲込みで記述
- 「本タスクでは手順書化のみ」明示が含まれる
- artifacts.json の `phases[4].status` が `spec_created`

## 実行手順

1. §1 変更対象ファイル一覧を起草（apps/api 配下に閉じることを確認）。
2. §2 関数シグネチャを TypeScript で記述（`enqueueBackfillJob` / `processBackfillBatch` / `getBackfillStatus`）。
3. §3 副作用テーブルを関数ごとに整備。
4. §4 migration runbook（dedupe_key / failed_items_json / retry_count / last_error）を SQL レベルで記述。
5. §5 wrangler.toml の binding 設定 TOML スニペットを起草。
6. §6 API contract 移行を旧 → 新対応表で起草。
7. §7 ローカル実行コマンドを `mise exec` / `scripts/cf.sh` 経由のみで列挙。
8. §8 DoD を typecheck / lint / test / build / staging after evidence の 5 項目で起草。

## 次 Phase への引き渡し

- 次 Phase: 6（異常系 / duplicate enqueue / partial failure / batch boundary）
- 引き継ぎ事項:
  - 関数シグネチャ（§2）/ 副作用テーブル（§3）
  - migration 適用順序（§4）
  - binding 同期方針（§5）
  - 旧→新 contract 移行表（§6）
  - DoD 5 項目（§8）
- ブロック条件:
  - CONST_005 必須項目のいずれかが欠落
  - binding が staging / production / base / CI の 4 箇所で不一致
  - rollback 手順が D1 制約を踏まえていない
  - breaking change 影響範囲が admin UI 同一 PR 完結で記述されていない

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow / repository test に接続する。
- queue producer / consumer / cron handler / migration / response contract / DoD は Phase 9 品質保証、Phase 11 staging 実測（着手 gate 成立後）、Phase 12 ドキュメント同期へ連結する。
