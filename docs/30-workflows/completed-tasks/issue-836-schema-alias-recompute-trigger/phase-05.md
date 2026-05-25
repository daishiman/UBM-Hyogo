# Phase 5: 実装

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 名称 | 実装（migration / workflow / job repository / endpoint 2 本 / web helper 2 本 / SchemaDiffPanel recompute UI） |
| 依存 | phase-04.md（TDD Red 成立） |
| 成果物 | 本ファイル（phase-05.md） |
| 状態 | spec_created |

## 目的

phase-04 の Red テスト（T-01〜T-12 / T-13U〜T-15U）を Green にする最小実装を、phase-02 の設計成果物（`outputs/phase-02/{d1-schema-migration,api-contract,recompute-algorithm,ui-state-machine}.md`）を正本として行う。新規 endpoint 追加・D1 schema 変更（recompute job テーブル追加のみ）は本タスクの認可スコープ内（index.md 採用方針）。

## 新規作成 / 修正ファイル一覧（FB-RT-03 必須）

| パス | 変更種別 | 主成果物 | 対応 AC |
| --- | --- | --- | --- |
| apps/api/migrations/0020_schema_alias_recompute_jobs.sql | 新規 | recompute job テーブル + UNIQUE index | AC-7 |
| apps/api/src/repository/schemaAliasRecomputeJobs.ts | 新規 | `createOrGetJob` / `updateJobStatus` / `getLatestJobByAlias` | AC-2 / AC-4 |
| apps/api/src/workflows/schemaAliasRecompute.ts | 新規 | `schemaAliasRecompute` / `reverseBackfillResponseFields` / `SchemaAliasRecomputeFailure` | AC-1 / AC-2 / AC-3 / AC-8 |
| apps/api/src/workflows/schemaAliasAssign.ts | 編集（必要時） | `BACKFILL_BATCH_SIZE` / `BACKFILL_CPU_BUDGET_MS` の export 確認（既に export 済み・追加不要） | AC-8 |
| apps/api/src/routes/admin/schema.ts | 編集 | recompute endpoint 2 本 + `RecomputeBodyZ` 追加 | AC-1 / AC-4 |
| apps/web/src/lib/admin/api.ts | 編集 | `recomputeSchemaAlias` / `getSchemaAliasRecomputeStatus` / `RecomputeApiError` + 型 | AC-9 / AC-12 |
| apps/web/src/components/admin/SchemaDiffPanel.tsx | 編集 | warning（248-250）→ recompute 実行 UI + status バッジ | AC-5 / AC-6 / AC-10 |

> spec 2 本（`11-admin-management.md` / `01-api-schema.md`）の追記は AC-13。本タスクの正本同期として **Phase 12**（system-spec-update-summary）で実施する。

## phase-03 確定指示（5 項目）の実装制約

| # | phase-03 指示 | 本 Phase での確定実装 |
| --- | --- | --- |
| 1 | reverse-backfill は新規対称関数。`BACKFILL_BATCH_SIZE` / `BACKFILL_CPU_BUDGET_MS` は import 再利用、未 export なら export 化 | 実コード確認済み: `schemaAliasAssign.ts:83-84` で **両定数とも export 済み**。`schemaAliasRecompute.ts` から `import { BACKFILL_BATCH_SIZE, BACKFILL_CPU_BUDGET_MS } from "./schemaAliasAssign"` で再利用。新規 export 追加は不要 |
| 2 | audit は rollback と対称に `db.batch`（job update + audit insert）でまとめる推奨 | rollback（`schemaAliasRollback.ts:149-175`）と対称に、最終 job update + audit insert を `c.db.batch([...])` で 1 transaction 化する。`c.db.batch` 非対応環境は `batch_failed` を throw（rollback と同ガード） |
| 3 | recompute は soft-deleted alias のみ対象。`deleted_at IS NULL` は `not_rolled_back`（409） | `getById(c, aliasId, { includeDeleted: true })` で取得 → 不在は `not_found`、`deletedAt == null` は `not_rolled_back` を throw |
| 4 | triggerKey 既定 = 元 rollback audit_id（不在時 `alias_id:version`） | `findRollbackAuditId(c, aliasId) ?? `${alias.id}:${alias.version}``。client/input からは受け取らない |
| 5 | GET status の job 不在時は 200 + null（404 ではない） | `getLatestJobByAlias` が null を返したら endpoint は `c.json(null, 200)` |

## 各ファイルの実装仕様

### 1. migration 0020（DDL は phase-02 を正本参照）

`apps/api/migrations/0020_schema_alias_recompute_jobs.sql`。DDL は **`outputs/phase-02/d1-schema-migration.md` の DDL ブロックをそのまま正本**とする。要点:

- `schema_alias_recompute_jobs`（`job_id` PK、`alias_id` / `stable_key` / `question_id` / `trigger_key` NOT NULL、`status` DEFAULT `'pending'`、`affected_count` / `processed_count` / `updated_count` / `deleted_collision_count` DEFAULT 0、`cursor` / `recompute_audit_id` / `locked_at` / `locked_by` / `run_token` / `last_error` nullable、`created_by` / `created_at` / `updated_at`）
- `CREATE UNIQUE INDEX idx_schema_alias_recompute_jobs_trigger_unique (alias_id, stable_key, trigger_key)`（idempotency / AC-7）
- `CREATE INDEX idx_schema_alias_recompute_jobs_alias (alias_id, created_at)`（直近 job 取得）
- すべて `IF NOT EXISTS`（再適用安全 / forward-only）

> `setupD1()`（test）が migrations 全件を apply するため、追加と同時に in-memory D1 にもテーブルが反映され phase-04 D1 spec が解決する。

### 2. repository（apps/api/src/repository/schemaAliasRecomputeJobs.ts）

```ts
export interface RecomputeJobRow {
  jobId: string;
  aliasId: string;
  stableKey: string;
  questionId: string;
  triggerKey: string;
  status: "pending" | "running" | "completed" | "failed";
  affectedCount: number;
  processedCount: number;
  updatedCount: number;
  deletedCollisionCount: number;
  recomputeAuditId: string | null;
  cursor: string | null;
  lastError: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrGetJobInput {
  aliasId: string;
  stableKey: string;
  questionId: string;
  triggerKey: string;
  createdBy: string;
}

// (alias_id, stable_key, trigger_key) で既存検索 → 在れば返す / 不在なら pending INSERT
export async function createOrGetJob(c: DbCtx, input: CreateOrGetJobInput): Promise<RecomputeJobRow>;

export interface UpdateJobStatusPatch {
  status?: RecomputeJobRow["status"];
  affectedCount?: number;
  processedCount?: number;
  updatedCount?: number;
  deletedCollisionCount?: number;
  recomputeAuditId?: string | null;
  cursor?: string | null;
  lastError?: string | null;
  updatedAt: string;
}
export async function updateJobStatus(c: DbCtx, jobId: string, patch: UpdateJobStatusPatch): Promise<void>;

// alias_id の直近 job（created_at DESC LIMIT 1）。不在時 null
export async function getLatestJobByAlias(c: DbCtx, aliasId: string): Promise<RecomputeJobRow | null>;
```

SQL 概要:
- `createOrGetJob`: `SELECT ... WHERE alias_id=?1 AND stable_key=?2 AND trigger_key=?3 LIMIT 1` → 在れば row map。不在なら `job_id=newId()`、`status='pending'`、count=0、`created_at=updated_at=now` で `INSERT`。UNIQUE 競合（並行）時は再 SELECT で吸収。
- `updateJobStatus`: 渡された列のみ動的 `UPDATE`（`updated_at` は常に更新）。
- `getLatestJobByAlias`: `SELECT ... WHERE alias_id=?1 ORDER BY created_at DESC LIMIT 1`。
- 行→`RecomputeJobRow` の snake→camel マッピングは module 内 private mapper で行う。

> repository は SQL のみ（状態を持たない / phase-03 責務境界）。`DbCtx` は `repository/_shared/db` 由来（rollback workflow と同型）。

### 3. workflow（apps/api/src/workflows/schemaAliasRecompute.ts）

型・関数フローは **`outputs/phase-02/recompute-algorithm.md` を正本**とする。シグネチャ:

```ts
export type SchemaAliasRecomputeFailureKind = "not_found" | "not_rolled_back" | "batch_failed";
export class SchemaAliasRecomputeFailure extends Error { readonly kind: SchemaAliasRecomputeFailureKind; /* ... */ }

export interface SchemaAliasRecomputeInput {
  aliasId: string; actor: string; reason?: string | null;
}
export interface SchemaAliasRecomputeResult {
  jobId: string; aliasId: string; status: "completed" | "running";
  affectedCount: number; processedCount: number; updatedCount: number; deletedCollisionCount: number;
  recomputeAuditId: string; relatedRollbackAuditId: string | null;
}
export interface ReverseBackfillResult {
  status: "completed" | "exhausted"; processed: number; updated: number; deletedCollision: number; cursor: string | null; retryable: boolean; code?: string;
}

export async function schemaAliasRecompute(c: DbCtx, input: SchemaAliasRecomputeInput): Promise<SchemaAliasRecomputeResult>;

export const reverseBackfillResponseFields = async (
  c: DbCtx, questionId: string, stableKey: string,
  batchSize?: number, cpuBudgetMs?: number,
): Promise<ReverseBackfillResult>;
```

主要ロジック（recompute-algorithm.md メイン関数フロー 1-10 を実装）:
1. `getById(c, aliasId, { includeDeleted: true })` → 不在 `not_found` / `deletedAt==null` `not_rolled_back`
2. `relatedRollbackAuditId = findRollbackAuditId(c, aliasId)`（`audit_log` の `action='schema_alias.rollback' AND target_id=aliasId` 最新 `audit_id`。`schemaAliasRollback.ts:54-74` の `findResolveAuditId` と同型の private helper）
3. `triggerKey`（確定指示 4。server-side derivation）
4. `createOrGetJob(...)` → 既存 `completed` は reverse-backfill / audit insert せず `recomputeAuditId` を含めて即 return（idempotent / AC-2）
5. `claimJob()` で `locked_at` / `run_token` lease を conditional update。変更 0 件なら current job status を返し、同一 running job の二重 runner を防ぐ
6. `affected = job.affectedCount || countReverseTargets(c, stableKey)`（初回値を固定。`SELECT COUNT(*) FROM response_fields WHERE stable_key=?` / 削除 member 除外条件は backfill と同じ）
7. `reverseBackfillResponseFields(c, alias.aliasQuestionId, alias.stableKey, job.cursor)` を呼ぶ。例外は job `failed` 記録 + `batch_failed` throw
8. `rb.status` → job 最終 status（`completed` / `running`）。`processedCount += rb.processed`、`updatedCount += rb.updated`、`deletedCollisionCount += rb.deletedCollision`、`cursor=rb.cursor`
9. 初回のみ `recomputeAuditId=newId()`。job update + audit insert（`action='schema_alias.recompute'`、`after_json={ jobId, affectedCount, processedCount, updatedCount, deletedCollisionCount, relatedRollbackAuditId, triggerKey, reason }`）を `c.db.batch` でまとめる（確定指示 2）
10. result return

`reverseBackfillResponseFields` の本体（SELECT→DELETE 衝突回避→UPDATE のループ、`extraKey===stableKey` の no-op、削除 member 除外、CPU budget exhausted で `cursor` 付き `exhausted` 返却）は **recompute-algorithm.md のコードブロックを正本**とし、`backfillResponseFields`（`schemaAliasAssign.ts:192-277`）の対称実装とする（不変条件6）。`BACKFILL_BATCH_SIZE` / `BACKFILL_CPU_BUDGET_MS` は import 再利用（確定指示 1）。

### 4. endpoint 2 本（apps/api/src/routes/admin/schema.ts）

`outputs/phase-02/api-contract.md` の実装スケッチを正本とする。rollback endpoint（`schema.ts:376-434`）の直後に追加し、既存 resolve / rollback / `backfill/trigger` / `:diffId/backfill` は **touch しない**（path-namespace 分離 / 不変条件3）。

- `RecomputeBodyZ = z.object({ reason: z.string().max(500).optional() })`
- `POST /schema/aliases/:aliasId/recompute`: aliasId 必須（無いと 400 `bad_request`）→ body parse → `authUser.email`（`actor`）→ `schemaAliasRecompute(db, {...})` → 200。`SchemaAliasRecomputeFailure` を `not_found→404` / `not_rolled_back→409` / その他→500 に map。
- `GET /schema/aliases/:aliasId/recompute`: `getLatestJobByAlias(db, aliasId)` → `c.json(job ?? null, 200)`（確定指示 5）。
- `If-Match` は不要（recompute は alias version を変更しない / api-contract.md）。

### 5. web helper 2 本 + RecomputeApiError（apps/web/src/lib/admin/api.ts）

`outputs/phase-02/api-contract.md` の web helper 契約を正本とする。`rollbackSchemaAlias` / `RollbackApiError`（`api.ts:144-195`）と**同パターン**:

- `RecomputeApiError extends Error`（`status` / `code`、`name="RecomputeApiError"`）
- 型: `RecomputeSchemaAliasInput` / `RecomputeSchemaAliasResult` / `RecomputeStatusResult`（api-contract.md の型定義どおり）
- `recomputeSchemaAlias(input)`: `POST /api/admin/schema/aliases/{encodeURIComponent(aliasId)}/recompute`、`content-type: application/json`、body `JSON.stringify({ reason: input.reason })`。`triggerKey` は送らない。`!res.ok` で `RecomputeApiError(status, code, message)`、`fetch` reject で `RecomputeApiError(0, "network_error", ...)`（rollback と同じ error 解釈）
- `getSchemaAliasRecomputeStatus(aliasId)`: `GET /api/admin/schema/aliases/{enc}/recompute`。body が `null` なら `null` を返す。`!res.ok` は `RecomputeApiError`。

### 6. SchemaDiffPanel recompute UI（apps/web/src/components/admin/SchemaDiffPanel.tsx）

`outputs/phase-02/ui-state-machine.md` を正本とする。`248-250` の `data-role="recompute-warning"` 段落（「再集計実行は本タスク外です」）を **撤去**し、rollback 成功後に `result.impact.recomputeRequired` が true の時だけ post-rollback action として recompute 実行 UI を表示する。rollback 前の確認 modal では alias が未 soft-delete のため API の `not_rolled_back` guard に必ず当たるので、recompute ボタンを出さない:

- `data-role="recompute-action"` コンテナ内に `data-role="recompute-trigger"` ボタン（`type="button"`、`disabled={uiStatus === "submitting"}`、ラベルは uiStatus に応じ「再集計を実行 / 続行 / 再試行 / 再集計済み」）、`data-role="recompute-status"`（`role="status"` / `aria-live="polite"` / `data-status={uiStatus}`）、完了後 `data-role="recompute-processed-count"`、failed 時 `data-role="recompute-error"`。
- UI local state `RecomputeUiStatus = "idle" | "submitting" | "completed" | "running" | "failed"`（真実は server / UI は API 応答から導出）。
- mutation 配線は `@/features/admin/hooks/useAdminMutation` 経由（AC-9 / CLAUDE.md #10）。`mutationFn: () => recomputeSchemaAlias({ aliasId: postRollbackRecompute.aliasId })`、`onSuccess` で `completed` / `running` と processedCount、`onError` で `failed`。`handleRecompute` で `submitting` にしてから `mutate()`。legacy `@/lib/useAdminMutation` は import しない。
- status バッジ色は OKLch 既存 token / 既存 utility のみ（HEX 直書き・`bg-[#xxx]` 禁止 / AC-10 / `verify-design-tokens` gate）。具体クラスは `apps/web/src/styles/tokens.css` と既存 SchemaDiffPanel の警告 text が使う token に揃える。

## 実装順序

1. migration `0020`（DDL 確定 → `setupD1()` で D1 spec のテーブルが解決）
2. repository（`schemaAliasRecomputeJobs.ts`）
3. workflow（`schemaAliasRecompute.ts` + `reverseBackfillResponseFields`）→ T-01〜T-05 Green
4. endpoint 2 本（`schema.ts`）→ T-06〜T-11 Green
5. web helper 2 本 + `RecomputeApiError`（`api.ts`）→ T-12 Green
6. UI（`SchemaDiffPanel.tsx`）→ T-13U〜T-15U Green

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# targeted test（phase-04 と同一）
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/workflows/schemaAliasRecompute.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/lib/admin/__tests__/api.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
```

## 完了条件 (DoD)

- [ ] phase-04 の T-01〜T-12 / T-13U〜T-15U が全て Green
- [ ] 新規 4 ファイル（migration / repository / workflow / 既存 2 ファイル編集）が inventory と一致
- [ ] migration `0020` が `UNIQUE(alias_id, stable_key, trigger_key)` を持つ（AC-7）
- [ ] reverse-backfill が `backfillResponseFields` の対称実装で、`BACKFILL_*` 定数を import 再利用（不変条件6 / 確定指示1）
- [ ] recompute は soft-deleted alias のみ・`deleted_at IS NULL` は 409（確定指示3）
- [ ] audit insert + job update を `c.db.batch` でまとめている（確定指示2）
- [ ] GET status の job 不在時 200 + null（確定指示5）
- [ ] web helper は fetch のみ・D1 直接アクセスなし（AC-12）。UI は `@/features/admin/hooks/useAdminMutation` 経由（AC-9）
- [ ] status バッジが OKLch token のみ・HEX 直書きなし（AC-10）
- [ ] 既存 resolve / rollback / backfill endpoint を touch していない（不変条件3）
- [ ] `pnpm typecheck` / `pnpm lint` pass
