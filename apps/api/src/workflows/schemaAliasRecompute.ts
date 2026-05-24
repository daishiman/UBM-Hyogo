// Issue #836: schema alias rollback 後の再集計（recompute）workflow
// 経路: POST /admin/schema/aliases/:aliasId/recompute（admin 明示操作・rollback 自動連動なし）
// recompute = response_fields の reverse-backfill: alias.stableKey -> __extra__:{aliasQuestionId}
//   （backfillResponseFields の逆操作。schemaAliasAssign.ts:192-277 の対称コピー）
// idempotency: (alias_id, stable_key, trigger_key) UNIQUE job + SQL レベル冪等の二重防御。
import type { DbCtx } from "../repository/_shared/db";
import { getById } from "../repository/schemaAliases";
import {
  claimJob,
  createOrGetJob,
  getById as getJobById,
  updateJobStatus,
  type RecomputeJobRow,
} from "../repository/schemaAliasRecomputeJobs";
import { BACKFILL_BATCH_SIZE, BACKFILL_CPU_BUDGET_MS } from "./schemaAliasAssign";

export type SchemaAliasRecomputeFailureKind =
  | "not_found"
  | "not_rolled_back"
  | "batch_failed";

export class SchemaAliasRecomputeFailure extends Error {
  readonly kind: SchemaAliasRecomputeFailureKind;
  constructor(kind: SchemaAliasRecomputeFailureKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "SchemaAliasRecomputeFailure";
  }
}

export interface SchemaAliasRecomputeInput {
  aliasId: string;
  actor: string;
  reason?: string | null;
  // テスト / 運用調整用の seam（endpoint は既定値を使う）。schemaAliasAssign の
  // backfillCpuBudgetMs と対称。CPU budget 跨ぎ継続の検証に使う。
  cpuBudgetMs?: number;
  batchSize?: number;
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

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `aud_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

/** 元 rollback の audit_id（最新）を返す。triggerKey 導出に使う。 */
async function findRollbackAuditId(
  c: DbCtx,
  aliasId: string,
): Promise<string | null> {
  const row = await c.db
    .prepare(
      `SELECT audit_id FROM audit_log
       WHERE action = 'schema_alias.rollback'
         AND target_type = 'schema_alias'
         AND target_id = ?1
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(aliasId)
    .first<{ audit_id: string }>();
  return row?.audit_id ?? null;
}

/** reverse-backfill 対象（stable_key = stableKey、削除済 member 除外）の件数。 */
async function countReverseTargets(
  c: DbCtx,
  stableKey: string,
): Promise<number> {
  try {
    const r = await c.db
      .prepare(
        `SELECT COUNT(*) AS c FROM response_fields
         WHERE stable_key = ?1
           AND response_id NOT IN (
             SELECT mi.current_response_id FROM member_identities mi
             INNER JOIN deleted_members dm ON dm.member_id = mi.member_id
           )`,
      )
      .bind(stableKey)
      .first<{ c: number }>();
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/**
 * reverse-backfill: stable_key=stableKey の行を __extra__:{questionId} に書き戻す。
 * backfillResponseFields の逆操作。削除済 response は skip。idempotent。
 * extraKey === stableKey は no-op。CPU budget 超過で exhausted + cursor を返す。
 */
export const reverseBackfillResponseFields = async (
  c: DbCtx,
  questionId: string,
  stableKey: string,
  cursor: string | null = null,
  batchSize: number = BACKFILL_BATCH_SIZE,
  cpuBudgetMs: number = BACKFILL_CPU_BUDGET_MS,
): Promise<ReverseBackfillResult> => {
  const extraKey = `__extra__:${questionId}`;
  if (extraKey === stableKey) {
    return {
      status: "completed",
      processed: 0,
      updated: 0,
      deletedCollision: 0,
      cursor: null,
      retryable: false,
    };
  }
  const start = Date.now();
  let processed = 0;
  let updated = 0;
  let deletedCollision = 0;
  let lastResponseId = cursor;

  while (true) {
    const sel = await c.db
      .prepare(
        `SELECT response_id FROM response_fields
         WHERE stable_key = ?1
           AND (?3 IS NULL OR response_id > ?3)
           AND response_id NOT IN (
             SELECT mi.current_response_id FROM member_identities mi
             INNER JOIN deleted_members dm ON dm.member_id = mi.member_id
           )
         ORDER BY response_id ASC
         LIMIT ?2`,
      )
      .bind(stableKey, batchSize, lastResponseId)
      .all<{ response_id: string }>();
    const ids = (sel.results ?? []).map((r) => r.response_id);
    if (ids.length === 0) break;
    const idPlaceholders = ids.map((_, i) => `?${i + 3}`).join(", ");

    // 衝突回避: 既に extraKey 行が存在する response は stableKey 行を DELETE する。
    const del = await c.db
      .prepare(
        `DELETE FROM response_fields
         WHERE stable_key = ?1
           AND response_id IN (${idPlaceholders})
           AND EXISTS (
             SELECT 1 FROM response_fields existing
             WHERE existing.response_id = response_fields.response_id
               AND existing.stable_key = ?2
           )`,
      )
      .bind(stableKey, extraKey, ...ids)
      .run();

    // UPDATE: stableKey -> extraKey
    const upd = await c.db
      .prepare(
        `UPDATE response_fields
         SET stable_key = ?1
         WHERE stable_key = ?2
           AND response_id IN (${idPlaceholders})`,
      )
      .bind(extraKey, stableKey, ...ids)
      .run();

    processed += ids.length;
    deletedCollision += del.meta?.changes ?? 0;
    updated += upd.meta?.changes ?? 0;
    lastResponseId = ids[ids.length - 1] ?? lastResponseId;
    if (ids.length < batchSize) break;
    // budget は 1 batch 処理後に判定する。これにより 1 invocation あたり最低 1 batch の
    // 前進を保証し、exhausted 時の cursor が必ず非 null（last processed response_id）になる。
    if (Date.now() - start > cpuBudgetMs) {
      return {
        status: "exhausted",
        processed,
        updated,
        deletedCollision,
        cursor: lastResponseId,
        code: "recompute_cpu_budget_exhausted",
        retryable: true,
      };
    }
  }
  return {
    status: "completed",
    processed,
    updated,
    deletedCollision,
    cursor: null,
    retryable: false,
  };
};

const toResult = (
  job: RecomputeJobRow,
  relatedRollbackAuditId: string | null,
  recomputeAuditId: string,
): SchemaAliasRecomputeResult => ({
  jobId: job.jobId,
  aliasId: job.aliasId,
  status: job.status === "completed" ? "completed" : "running",
  affectedCount: job.affectedCount,
  processedCount: job.processedCount,
  updatedCount: job.updatedCount,
  deletedCollisionCount: job.deletedCollisionCount,
  recomputeAuditId,
  relatedRollbackAuditId,
});

export async function schemaAliasRecompute(
  c: DbCtx,
  input: SchemaAliasRecomputeInput,
): Promise<SchemaAliasRecomputeResult> {
  const alias = await getById(c, input.aliasId, { includeDeleted: true });
  if (!alias) {
    throw new SchemaAliasRecomputeFailure(
      "not_found",
      `schema_alias ${input.aliasId} not found`,
    );
  }
  // recompute は rollback 後（soft-deleted）の alias のみ対象。
  if (alias.deletedAt === null) {
    throw new SchemaAliasRecomputeFailure(
      "not_rolled_back",
      `schema_alias ${input.aliasId} is not rolled back`,
    );
  }

  const relatedRollbackAuditId = await findRollbackAuditId(c, alias.id);
  const triggerKey = relatedRollbackAuditId ?? `${alias.id}:${alias.version}`;

  let job = await createOrGetJob(c, {
    aliasId: alias.id,
    stableKey: alias.stableKey,
    questionId: alias.aliasQuestionId,
    triggerKey,
    createdBy: input.actor,
  });

  // 既存 completed → reverse-backfill / audit を再実行せず冪等返却。
  if (job.status === "completed" && job.recomputeAuditId) {
    return toResult(job, relatedRollbackAuditId, job.recomputeAuditId);
  }

  const now = new Date().toISOString();
  const runToken = newId();
  const claimed = await claimJob(c, {
    jobId: job.jobId,
    runToken,
    lockedBy: input.actor,
    now,
  });
  if (!claimed) {
    // 別 runner が処理中（lease 未期限切れ）。current status を返す。
    const fresh = (await getJobById(c, job.jobId)) ?? job;
    return toResult(
      fresh,
      relatedRollbackAuditId,
      fresh.recomputeAuditId ?? job.recomputeAuditId ?? newId(),
    );
  }

  // claim 成功 → 最新 job（running / cursor / counts）を読み直す。
  job = (await getJobById(c, job.jobId)) ?? job;

  const affected =
    job.affectedCount > 0
      ? job.affectedCount
      : await countReverseTargets(c, alias.stableKey);

  let rb: ReverseBackfillResult;
  try {
    rb = await reverseBackfillResponseFields(
      c,
      alias.aliasQuestionId,
      alias.stableKey,
      job.cursor,
      input.batchSize ?? BACKFILL_BATCH_SIZE,
      input.cpuBudgetMs ?? BACKFILL_CPU_BUDGET_MS,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "reverse backfill failed";
    await updateJobStatus(c, {
      jobId: job.jobId,
      runToken,
      status: "failed",
      lastError: message,
      cursor: job.cursor,
    });
    throw new SchemaAliasRecomputeFailure("batch_failed", message);
  }

  const status: "completed" | "running" =
    rb.status === "completed" ? "completed" : "running";
  const processedCount = job.processedCount + rb.processed;
  const updatedCount = job.updatedCount + rb.updated;
  const deletedCollisionCount = job.deletedCollisionCount + rb.deletedCollision;
  const recomputeAuditId = job.recomputeAuditId ?? newId();
  const isFirstAudit = !job.recomputeAuditId;

  const afterJson = JSON.stringify({
    jobId: job.jobId,
    affectedCount: affected,
    processedCount,
    updatedCount,
    deletedCollisionCount,
    relatedRollbackAuditId,
    triggerKey,
    reason: input.reason ?? null,
  });

  if (isFirstAudit && typeof c.db.batch === "function") {
    // 初回のみ job update + audit insert を 1 batch（rollback と対称）。
    // 同期スライス終端なので status を問わず lease を解放（running 継続を即許可）。
    const releaseLease = 1;
    const jobUpdate = c.db
      .prepare(
        `UPDATE schema_alias_recompute_jobs
         SET status = ?2, affected_count = ?3, processed_count = ?4,
             updated_count = ?5, deleted_collision_count = ?6, cursor = ?7,
             recompute_audit_id = ?8, last_error = NULL,
             run_token = CASE WHEN ?9 = 1 THEN NULL ELSE run_token END,
             locked_at = CASE WHEN ?9 = 1 THEN NULL ELSE locked_at END,
             locked_by = CASE WHEN ?9 = 1 THEN NULL ELSE locked_by END,
             updated_at = ?10
         WHERE job_id = ?1 AND run_token = ?11`,
      )
      .bind(
        job.jobId,
        status,
        affected,
        processedCount,
        updatedCount,
        deletedCollisionCount,
        rb.cursor,
        recomputeAuditId,
        releaseLease,
        new Date().toISOString(),
        runToken,
      );
    const auditInsert = c.db
      .prepare(
        `INSERT INTO audit_log
         (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)
         SELECT ?1, ?2, 'schema_alias.recompute', 'schema_alias', ?3, NULL, ?4, ?5
         WHERE EXISTS (
           SELECT 1 FROM schema_alias_recompute_jobs
           WHERE job_id = ?6 AND recompute_audit_id = ?1
         )`,
      )
      .bind(
        recomputeAuditId,
        input.actor,
        alias.id,
        afterJson,
        new Date().toISOString(),
        job.jobId,
      );
    try {
      await c.db.batch([jobUpdate, auditInsert]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "audit batch failed";
      await updateJobStatus(c, {
        jobId: job.jobId,
        runToken,
        status: "failed",
        lastError: message,
        cursor: job.cursor,
      });
      throw new SchemaAliasRecomputeFailure("batch_failed", message);
    }
  } else {
    // 継続実行（cursor 跨ぎ）: audit は初回で記録済み。job status のみ更新。
    await updateJobStatus(c, {
      jobId: job.jobId,
      runToken,
      status,
      affectedCount: affected,
      processedCount,
      updatedCount,
      deletedCollisionCount,
      cursor: rb.cursor,
      recomputeAuditId,
    });
  }

  const finalJob = (await getJobById(c, job.jobId)) ?? job;
  return toResult(finalJob, relatedRollbackAuditId, recomputeAuditId);
}
