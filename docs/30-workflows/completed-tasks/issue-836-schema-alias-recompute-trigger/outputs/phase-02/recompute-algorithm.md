# recompute algorithm 設計 — reverse-backfill / idempotency

対象: `apps/api/src/workflows/schemaAliasRecompute.ts`（新規）。
対称元: `apps/api/src/workflows/schemaAliasAssign.ts:192-277` の `backfillResponseFields`。

## 核心: backfill の逆操作

| | backfill（resolve 時 / 既存） | reverse-backfill（recompute / 新規） |
| --- | --- | --- |
| from | `__extra__:{questionId}` | `alias.stableKey` |
| to | `newStableKey`（= alias.stableKey） | `__extra__:{aliasQuestionId}` |
| 衝突回避 | to が既存なら from 行を DELETE | to（`__extra__`）が既存なら from（stableKey）行を DELETE |
| 単位 | chunk（BACKFILL_BATCH_SIZE）+ CPU budget | 同一定数を再利用 |
| idempotent | newStableKey == extraKey なら no-op | extraKey == stableKey なら no-op |

> `backfillResponseFields` の `if (extraKey === newStableKey) return no-op` と対称に、reverse でも `extraKey === stableKey` を no-op 判定する。

## 型定義

```ts
export type SchemaAliasRecomputeFailureKind =
  | "not_found"
  | "not_rolled_back"
  | "batch_failed";

export class SchemaAliasRecomputeFailure extends Error {
  readonly kind: SchemaAliasRecomputeFailureKind;
  constructor(kind: SchemaAliasRecomputeFailureKind, message: string) {
    super(message); this.kind = kind; this.name = "SchemaAliasRecomputeFailure";
  }
}

export interface SchemaAliasRecomputeInput {
  aliasId: string;
  actor: string;
  reason?: string | null;
}

export interface SchemaAliasRecomputeResult {
  jobId: string;
  aliasId: string;
  status: "completed" | "running";
  affectedCount: number;
  processedCount: number;
  updatedCount: number;
  deletedCollisionCount: number;
  recomputeAuditId: string;
  relatedRollbackAuditId: string | null;
}

export interface ReverseBackfillResult {
  status: "completed" | "exhausted";
  processed: number;
  updated: number;
  deletedCollision: number;
  cursor: string | null;
  retryable: boolean;
  code?: string;
}
```

## メイン関数フロー

```
schemaAliasRecompute(c, input):
  1. alias = getById(c, input.aliasId, { includeDeleted: true })
     - 不在 → throw not_found
     - alias.deletedAt == null → throw not_rolled_back（rollback 後のみ recompute 可）
  2. relatedRollbackAuditId = findRollbackAuditId(c, alias.id)
       audit_log で action='schema_alias.rollback' AND target_id=aliasId の最新 audit_id
  3. triggerKey = relatedRollbackAuditId ?? `${alias.id}:${alias.version}`
  4. job = createOrGetJob(c, {
       aliasId: alias.id, stableKey: alias.stableKey,
       questionId: alias.aliasQuestionId, triggerKey, createdBy: input.actor,
     })
     - 既存 completed → job.recomputeAuditId を含めてそのまま return（reverse-backfill / audit を再実行しない）
     - 既存 running で lease 未期限切れ → current job status を return（同時処理しない）
     - 既存 running / pending / failed で lease 取得可 → 同 job を running へ更新して継続
  5. claimJob(job.jobId, { runToken, lockedAt: now, lockedBy: actor }) を conditional update で実行
     - `WHERE status IN ('pending','failed') OR locked_at < leaseExpiry`。変更 0 件なら 409 相当ではなく current status を 200 返却
  6. affected = job.affectedCount ?? countReverseTargets(c, alias.stableKey)  // 初回値を固定。再実行で減らさない
  7. try:
        rb = reverseBackfillResponseFields(c, alias.aliasQuestionId, alias.stableKey, job.cursor)
     catch e:
        updateJobStatus(job.jobId, { status: 'failed', lastError: e.message })
        throw SchemaAliasRecomputeFailure('batch_failed', e.message)
  8. status = rb.status === 'completed' ? 'completed' : 'running'
     updateJobStatus(job.jobId, {
       status, affectedCount: affected,
       processedCount: job.processedCount + rb.processed,
       updatedCount: job.updatedCount + rb.updated,
       deletedCollisionCount: job.deletedCollisionCount + rb.deletedCollision,
       cursor: rb.cursor, updatedAt: now,
     })
  9. recomputeAuditId = job.recomputeAuditId ?? newId()
     audit insert: action='schema_alias.recompute', target_type='schema_alias', target_id=aliasId,
       after_json = { jobId, affectedCount, processedCount, updatedCount, deletedCollisionCount, relatedRollbackAuditId, triggerKey, reason }
     job.recomputeAuditId が既存なら audit insert は再実行しない。初回のみ job update + audit insert を db.batch で 1 transaction 化する
  10. return { jobId, aliasId, status, affectedCount, processedCount, updatedCount, deletedCollisionCount, recomputeAuditId, relatedRollbackAuditId }
```

## reverseBackfillResponseFields（backfill 対称コピー）

```ts
export const reverseBackfillResponseFields = async (
  c: DbCtx,
  questionId: string,
  stableKey: string,             // recompute 元（alias.stableKey）
  cursor: string | null = null,  // last processed response_id
  batchSize = BACKFILL_BATCH_SIZE,
  cpuBudgetMs = BACKFILL_CPU_BUDGET_MS,
): Promise<ReverseBackfillResult> => {
  const extraKey = `__extra__:${questionId}`;   // recompute 先
  if (extraKey === stableKey) {
    return { status: "completed", processed: 0, updated: 0, deletedCollision: 0, cursor: null, retryable: false };
  }
  const start = Date.now();
  let processed = 0;
  let updated = 0;
  let deletedCollision = 0;
  let lastResponseId = cursor;
  while (true) {
    if (Date.now() - start > cpuBudgetMs) {
      return { status: "exhausted", processed, updated, deletedCollision, cursor: lastResponseId,
               code: "recompute_cpu_budget_exhausted", retryable: true };
    }
    // 対象: stable_key = stableKey の行（削除済 member は skip：backfill と同じ除外条件）
    const sel = await c.db.prepare(
      `SELECT response_id FROM response_fields
        WHERE stable_key = ?1
          AND (?3 IS NULL OR response_id > ?3)
          AND response_id NOT IN (
            SELECT mi.current_response_id FROM member_identities mi
            INNER JOIN deleted_members dm ON dm.member_id = mi.member_id
          )
        ORDER BY response_id ASC
        LIMIT ?2`
    ).bind(stableKey, batchSize, lastResponseId).all<{ response_id: string }>();
    const ids = (sel.results ?? []).map((r) => r.response_id);
    if (ids.length === 0) break;

    // 衝突回避: 既に extraKey 行が存在する response は stableKey 行を DELETE
    const del = await c.db.prepare(
      `DELETE FROM response_fields
        WHERE stable_key = ?1
          AND response_id IN (
            SELECT rf.response_id FROM response_fields rf
            WHERE rf.stable_key = ?1
              AND rf.response_id NOT IN (
                SELECT mi.current_response_id FROM member_identities mi
                INNER JOIN deleted_members dm ON dm.member_id = mi.member_id)
              AND EXISTS (SELECT 1 FROM response_fields existing
                WHERE existing.response_id = rf.response_id AND existing.stable_key = ?2)
            LIMIT ?3)`
    ).bind(stableKey, extraKey, batchSize).run();

    // UPDATE: stableKey -> extraKey
    const upd = await c.db.prepare(
      `UPDATE response_fields SET stable_key = ?1
        WHERE stable_key = ?2
          AND response_id IN (
            SELECT rf.response_id FROM response_fields rf
            WHERE rf.stable_key = ?2
              AND rf.response_id NOT IN (
                SELECT mi.current_response_id FROM member_identities mi
                INNER JOIN deleted_members dm ON dm.member_id = mi.member_id)
            LIMIT ?3)`
    ).bind(extraKey, stableKey, batchSize).run();
    processed += ids.length;
    deletedCollision += del.meta.changes ?? 0;
    updated += upd.meta.changes ?? 0;
    lastResponseId = ids[ids.length - 1] ?? lastResponseId;
    if (ids.length < batchSize) break;
  }
  return { status: "completed", processed, updated, deletedCollision, cursor: null, retryable: false };
};
```

> `BACKFILL_BATCH_SIZE` / `BACKFILL_CPU_BUDGET_MS` は `schemaAliasAssign.ts` の export 定数を import して再利用する（drift 防止）。export されていない場合は Phase 5 で export 化する。

## idempotency の二重防御

1. **job レベル**: `createOrGetJob` が `(alias_id, stable_key, trigger_key)` UNIQUE で既存 completed job を検出し reverse-backfill をスキップ。
2. **SQL レベル**: reverse-backfill は `WHERE stable_key = stableKey` 対象が再実行時に既に 0 件（extraKey へ移動済み）→ UPDATE 0 件。どちらの経路でも `response_fields` は二重変動しない（AC-2）。

## CPU budget exhausted 時の継続（AC-8）

- `reverseBackfillResponseFields` が `exhausted` を返すと job は `running` のまま `cursor` を残す。
- admin が再度 POST recompute を呼ぶ（server-derived triggerKey）→ lease が空くと `claimJob` が running job を取得し、`cursor`（last processed response_id）以降を処理する。
- 全件処理し切ると `completed`。
- 同期 endpoint 内で CPU budget 内に収まる小規模ケースは 1 回で `completed`。

## audit_log 記録（AC-3）

```
action = 'schema_alias.recompute'
target_type = 'schema_alias'
target_id = aliasId
before_json = null（または job 開始時 snapshot）
after_json = JSON.stringify({ jobId, affectedCount, processedCount, updatedCount, deletedCollisionCount, relatedRollbackAuditId, triggerKey, reason })
```

- 初回 recompute job に `recompute_audit_id` を保存し、completed 冪等返却時は同じ audit id を返す。completed job で新しい audit row は作らない。
- `auditLog.ts` の `append()` を使うか、rollback と同じ inline INSERT を db.batch でまとめる（Phase 5 で決定。rollback と対称にするなら batch）。

## AC トレース

| AC | 担保 |
| --- | --- |
| AC-1 | reverseBackfillResponseFields の UPDATE |
| AC-2 | job UNIQUE + SQL レベル冪等 |
| AC-3 | audit insert |
| AC-8 | exhausted → running 継続 + cursor |
