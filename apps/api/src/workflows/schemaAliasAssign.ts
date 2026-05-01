// 07b: schema alias 確定 workflow
// AC-1〜10:
//   apply mode で schema_aliases INSERT + schema_diff_queue resolved
//   + response_fields の back-fill + audit_log 記録
//   dryRun mode では DB を一切更新しない（影響件数のみ算出）。
//
// 不変条件 #1: stable_key はコードに固定しない（schema_questions row 経由）。
// 不変条件 #5: D1 アクセスは apps/api 内のみ。
// 不変条件 #14: schema 変更は /admin/schema 経由のみ → 本 workflow が単独 path。
import type { DbCtx } from "../repository/_shared/db";
import { asStableKey, auditAction } from "../repository/_shared/brand";
import type { AdminEmail, AdminId } from "../repository/_shared/brand";
import { findById as findDiffById, resolve as resolveDiff } from "../repository/schemaDiffQueue";
import { lookup as lookupSchemaAlias } from "../repository/schemaAliases";
import { append as auditAppend } from "../repository/auditLog";

export interface SchemaAliasAssignInput {
  questionId: string;
  stableKey: string;
  diffId?: string;
  dryRun: boolean;
  actorId: AdminId | null;
  actorEmail: AdminEmail | null;
}

export type SchemaAliasAssignResult =
  | {
      mode: "dryRun";
      questionId: string;
      currentStableKey: string | null;
      proposedStableKey: string;
      affectedResponseFields: number;
      currentStableKeyCount: number;
      conflictExists: boolean;
    }
  | {
      mode: "apply";
      questionId: string;
      oldStableKey: string | null;
      newStableKey: string;
      affectedResponseFields: number;
      queueStatus: "resolved";
    };

export type SchemaAliasAssignError =
  | { kind: "question_not_found" }
  | { kind: "diff_not_found" }
  | { kind: "diff_question_mismatch" }
  | { kind: "manual_actor_required" }
  | { kind: "alias_conflict"; existingStableKey: string }
  | { kind: "collision"; existingQuestionIds: string[] };

export class SchemaAliasAssignFailure extends Error {
  readonly detail: SchemaAliasAssignError;
  constructor(detail: SchemaAliasAssignError) {
    super(detail.kind);
    this.detail = detail;
  }
}

export const BACKFILL_BATCH_SIZE = 100;
export const BACKFILL_CPU_BUDGET_MS = 25_000; // Workers 30s 制限の安全マージン

interface QuestionRow {
  question_id: string;
  revision_id: string;
  stable_key: string;
  label: string;
}

const fetchQuestion = async (
  c: DbCtx,
  questionId: string,
): Promise<QuestionRow | null> =>
  await c.db
    .prepare(
      "SELECT question_id, revision_id, stable_key, label FROM schema_questions WHERE question_id = ? ORDER BY revision_id DESC LIMIT 1",
    )
    .bind(questionId)
    .first<QuestionRow>();

/**
 * 同 revision_id 内で同 stable_key を持つ別 questionId を列挙する。
 */
const findCollisions = async (
  c: DbCtx,
  revisionId: string,
  stableKey: string,
  excludeQuestionId: string,
): Promise<string[]> => {
  const r = await c.db
    .prepare(
      "SELECT question_id FROM schema_questions WHERE revision_id = ? AND stable_key = ? AND question_id != ?",
    )
    .bind(revisionId, stableKey, excludeQuestionId)
    .all<{ question_id: string }>();
  return (r.results ?? []).map((x) => x.question_id);
};

const newAliasId = (): string => {
  const fn = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID;
  if (typeof fn === "function") return fn.call(globalThis.crypto);
  return `schema_alias_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
};

const insertAliasAndResolveDiff = async (
  c: DbCtx,
  input: {
    id: string;
    stableKey: string;
    aliasQuestionId: string;
    aliasLabel: string | null;
    resolvedBy: string;
    resolvedAt: string;
    diffId?: string;
  },
): Promise<void> => {
  const insertStmt = c.db
    .prepare(
      "INSERT INTO schema_aliases (id, stable_key, alias_question_id, alias_label, source, resolved_by, resolved_at) VALUES (?, ?, ?, ?, 'manual', ?, ?)",
    )
    .bind(
      input.id,
      input.stableKey,
      input.aliasQuestionId,
      input.aliasLabel,
      input.resolvedBy,
      input.resolvedAt,
    );
  if (!input.diffId) {
    await insertStmt.run();
    return;
  }

  const resolveStmt = c.db
    .prepare(
      "UPDATE schema_diff_queue SET status = ?, resolved_by = ?, resolved_at = ? WHERE diff_id = ? AND status = ?",
    )
    .bind("resolved", input.resolvedBy, input.resolvedAt, input.diffId, "queued");
  const batch = (c.db as unknown as {
    batch?: (statements: unknown[]) => Promise<unknown[]>;
  }).batch;
  if (typeof batch === "function") {
    await batch.call(c.db, [insertStmt, resolveStmt]);
    return;
  }

  throw new Error("d1_batch_required_for_schema_alias_diff_resolve");
};

/**
 * back-fill 対象の件数（既存 extra field + 既に新 stable_key として存在する行）を返す。
 * 削除済 (deleted_members 経由の member_identities.current_response_id) は除外。
 */
const countBackfillTargets = async (
  c: DbCtx,
  questionId: string,
  newStableKey: string,
): Promise<number> => {
  const extraKey = `__extra__:${questionId}`;
  const r = await c.db
    .prepare(
      `SELECT count(*) AS c FROM response_fields
       WHERE (stable_key = ?1 OR stable_key = ?2)
         AND response_id NOT IN (
           SELECT mi.current_response_id FROM member_identities mi
           INNER JOIN deleted_members dm ON dm.member_id = mi.member_id
         )`,
    )
    .bind(extraKey, newStableKey)
    .first<{ c: number }>();
  return r?.c ?? 0;
};

/**
 * back-fill: extra field stable_key を newStableKey に書き換える。
 * 削除済 response は skip。idempotent（再 apply で重複なく続行可能）。
 * batch 単位の UPDATE をループする。SQLite UPDATE LIMIT は標準でないため、
 * 対象 response_id を SELECT で先に取得して IN 句で UPDATE する。
 */
export const backfillResponseFields = async (
  c: DbCtx,
  questionId: string,
  newStableKey: string,
  batchSize: number = BACKFILL_BATCH_SIZE,
  cpuBudgetMs: number = BACKFILL_CPU_BUDGET_MS,
): Promise<number> => {
  const extraKey = `__extra__:${questionId}`;
  // newStableKey が extraKey と同じ場合は no-op で抜ける
  if (extraKey === newStableKey) return 0;
  const start = Date.now();
  let total = 0;

  while (true) {
    if (Date.now() - start > cpuBudgetMs) {
      throw new Error("backfill_cpu_budget_exhausted");
    }
    const sel = await c.db
      .prepare(
        `SELECT response_id FROM response_fields
         WHERE stable_key = ?1
           AND response_id NOT IN (
             SELECT mi.current_response_id FROM member_identities mi
             INNER JOIN deleted_members dm ON dm.member_id = mi.member_id
           )
         LIMIT ?2`,
      )
      .bind(extraKey, batchSize)
      .all<{ response_id: string }>();
    const ids = (sel.results ?? []).map((r) => r.response_id);
    if (ids.length === 0) break;

    // 1 行ずつ UPDATE する（D1 の prepared statement で IN 句の動的長を扱うため）
    for (const rid of ids) {
      // 衝突回避: 既に newStableKey の行が存在する場合、INSERT OR REPLACE 的振る舞いとして
      // 既存 newStableKey 行を残しつつ extra 行を DELETE する。
      const existing = await c.db
        .prepare(
          "SELECT 1 AS found FROM response_fields WHERE response_id = ?1 AND stable_key = ?2",
        )
        .bind(rid, newStableKey)
        .first<{ found: number }>();
      if (existing) {
        await c.db
          .prepare(
            "DELETE FROM response_fields WHERE response_id = ?1 AND stable_key = ?2",
          )
          .bind(rid, extraKey)
          .run();
      } else {
        await c.db
          .prepare(
            "UPDATE response_fields SET stable_key = ?1 WHERE response_id = ?2 AND stable_key = ?3",
          )
          .bind(newStableKey, rid, extraKey)
          .run();
      }
      total += 1;
    }
    if (ids.length < batchSize) break;
  }
  return total;
};

/**
 * dryRun mode 用に「もし apply したら何件影響するか」を算出する。
 */
const countDryRunAffected = async (
  c: DbCtx,
  questionId: string,
  newStableKey: string,
): Promise<number> => {
  const extraKey = `__extra__:${questionId}`;
  const r = await c.db
    .prepare(
      `SELECT count(*) AS c FROM response_fields
       WHERE stable_key = ?1
         AND response_id NOT IN (
           SELECT mi.current_response_id FROM member_identities mi
           INNER JOIN deleted_members dm ON dm.member_id = mi.member_id
         )`,
    )
    .bind(extraKey)
    .first<{ c: number }>();
  // newStableKey === extraKey は実質 no-op
  if (extraKey === newStableKey) return 0;
  return r?.c ?? 0;
};

const countCurrentStableKey = async (
  c: DbCtx,
  revisionId: string,
  stableKey: string,
): Promise<number> => {
  const r = await c.db
    .prepare(
      "SELECT count(*) AS c FROM schema_questions WHERE revision_id = ? AND stable_key = ?",
    )
    .bind(revisionId, stableKey)
    .first<{ c: number }>();
  return r?.c ?? 0;
};

export const schemaAliasAssign = async (
  c: DbCtx,
  input: SchemaAliasAssignInput,
): Promise<SchemaAliasAssignResult> => {
  const question = await fetchQuestion(c, input.questionId);
  if (!question) {
    throw new SchemaAliasAssignFailure({ kind: "question_not_found" });
  }
  if (input.diffId) {
    const diff = await findDiffById(c, input.diffId);
    if (!diff) {
      throw new SchemaAliasAssignFailure({ kind: "diff_not_found" });
    }
    if (diff.questionId !== input.questionId) {
      throw new SchemaAliasAssignFailure({ kind: "diff_question_mismatch" });
    }
  }

  const oldStableKey =
    question.stable_key === "unknown" ? null : question.stable_key;
  const existingAlias = await lookupSchemaAlias(c, input.questionId);
  if (existingAlias && existingAlias.stableKey !== input.stableKey) {
    throw new SchemaAliasAssignFailure({
      kind: "alias_conflict",
      existingStableKey: existingAlias.stableKey,
    });
  }
  const isIdempotent = existingAlias?.stableKey === input.stableKey;

  // collision: 同 revision で別 questionId が同 stable_key を持つか
  const collisionIds = isIdempotent
    ? []
    : await findCollisions(c, question.revision_id, input.stableKey, input.questionId);
  const conflictExists = collisionIds.length > 0;

  if (input.dryRun) {
    const affected = await countDryRunAffected(c, input.questionId, input.stableKey);
    const currentCount = await countCurrentStableKey(
      c,
      question.revision_id,
      input.stableKey,
    );
    return {
      mode: "dryRun",
      questionId: input.questionId,
      currentStableKey: oldStableKey,
      proposedStableKey: input.stableKey,
      affectedResponseFields: affected,
      currentStableKeyCount: currentCount,
      conflictExists,
    };
  }

  if (conflictExists) {
    throw new SchemaAliasAssignFailure({
      kind: "collision",
      existingQuestionIds: collisionIds,
    });
  }
  if (!input.actorEmail) {
    throw new SchemaAliasAssignFailure({ kind: "manual_actor_required" });
  }

  // idempotent: stable_key が既に同値でも、未完了 back-fill と queued diff resolve は続行する。
  // 途中失敗後の再 apply で recovery できるようにする。
  if (isIdempotent) {
    const affected = await backfillResponseFields(
      c,
      input.questionId,
      input.stableKey,
    );
    if (input.diffId) {
      await resolveDiff(c, input.diffId, input.actorEmail ?? "system");
    }
    return {
      mode: "apply",
      questionId: input.questionId,
      oldStableKey,
      newStableKey: input.stableKey,
      affectedResponseFields: affected,
      queueStatus: "resolved",
    };
  }

  // apply
  const resolvedAt = new Date().toISOString();
  await insertAliasAndResolveDiff(c, {
    id: newAliasId(),
    stableKey: asStableKey(input.stableKey),
    aliasQuestionId: input.questionId,
    aliasLabel: question.label,
    resolvedBy: input.actorEmail,
    resolvedAt,
    ...(input.diffId ? { diffId: input.diffId } : {}),
  });
  const backfilled = await backfillResponseFields(
    c,
    input.questionId,
    input.stableKey,
  );
  await auditAppend(c, {
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    action: auditAction("schema_diff.alias_assigned"),
    targetType: "schema_diff",
    targetId: input.questionId,
    before: { stableKey: oldStableKey },
    after: {
      stableKey: input.stableKey,
      questionId: input.questionId,
      diffId: input.diffId ?? null,
      affectedResponseFields: backfilled,
    },
  });

  return {
    mode: "apply",
    questionId: input.questionId,
    oldStableKey,
    newStableKey: input.stableKey,
    affectedResponseFields: backfilled,
    queueStatus: "resolved",
  };
};
