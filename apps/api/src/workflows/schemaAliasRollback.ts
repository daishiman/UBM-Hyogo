// Issue #778: schema alias rollback / undo workflow
// 経路: POST /admin/schema/aliases/:aliasId/rollback
// - soft delete (deleted_at / deleted_by 設定 + version++)
// - schema_diff_queue を resolved → queued に巻き戻し
// - audit_log に schema_alias.rollback 記録（after_json.relatedAuditId に元 resolve audit_id）
// - 影響件数（responses.stable_key COUNT）を返す
import type { DbCtx } from "../repository/_shared/db";
import {
  buildSoftDeleteStatement,
  getById,
  type SchemaAliasRow,
} from "../repository/schemaAliases";

export type SchemaAliasRollbackFailureKind =
  | "not_found"
  | "already_deleted"
  | "version_mismatch"
  | "batch_failed";

export class SchemaAliasRollbackFailure extends Error {
  readonly kind: SchemaAliasRollbackFailureKind;
  constructor(kind: SchemaAliasRollbackFailureKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "SchemaAliasRollbackFailure";
  }
}

export interface SchemaAliasRollbackInput {
  aliasId: string;
  expectedVersion: number;
  actor: string;
  reason?: string | null;
}

export interface SchemaAliasRollbackImpact {
  affectedResponseCount: number;
  recomputeRequired: boolean;
}

export interface SchemaAliasRollbackResult {
  aliasId: string;
  rolledBackAt: string;
  relatedAuditId: string | null;
  newVersion: number;
  impact: SchemaAliasRollbackImpact;
}

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `aud_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

async function findResolveAuditId(
  c: DbCtx,
  aliasId: string,
): Promise<string | null> {
  const row = await c.db
    .prepare(
      `SELECT audit_id FROM audit_log
       WHERE (
           target_type = 'schema_alias' AND target_id = ?1
           AND action IN ('schema_alias.resolve', 'schema_alias.apply', 'schema_alias.assign')
         )
         OR (
           action = 'schema_diff.alias_assigned'
           AND after_json LIKE ?2
         )
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(aliasId, `%"aliasId":"${aliasId}"%`)
    .first<{ audit_id: string }>();
  return row?.audit_id ?? null;
}

async function computeImpact(
  c: DbCtx,
  stableKey: string,
): Promise<SchemaAliasRollbackImpact> {
  let count = 0;
  try {
    const r = await c.db
      .prepare(`SELECT COUNT(*) AS c FROM response_fields WHERE stable_key = ?1`)
      .bind(stableKey)
      .first<{ c: number }>();
    count = Number(r?.c ?? 0);
  } catch {
    // response_fields が無い環境では 0 件扱い
    count = 0;
  }
  return { affectedResponseCount: count, recomputeRequired: count > 0 };
}

export async function schemaAliasRollback(
  c: DbCtx,
  input: SchemaAliasRollbackInput,
): Promise<SchemaAliasRollbackResult> {
  const now = new Date().toISOString();

  // 削除済みも含めて存在確認し、状態に応じてエラー種別を切り分ける
  const targetIncludingDeleted = await getById(c, input.aliasId, {
    includeDeleted: true,
  });
  if (!targetIncludingDeleted) {
    throw new SchemaAliasRollbackFailure(
      "not_found",
      `schema_alias ${input.aliasId} not found`,
    );
  }
  if (targetIncludingDeleted.deletedAt) {
    throw new SchemaAliasRollbackFailure(
      "already_deleted",
      `schema_alias ${input.aliasId} already deleted at ${targetIncludingDeleted.deletedAt}`,
    );
  }
  if (targetIncludingDeleted.version !== input.expectedVersion) {
    throw new SchemaAliasRollbackFailure(
      "version_mismatch",
      `expected version ${input.expectedVersion} but current is ${targetIncludingDeleted.version}`,
    );
  }

  const target: SchemaAliasRow = targetIncludingDeleted;
  const auditId = newId();
  const relatedAuditId = await findResolveAuditId(c, target.id);

  const softDelete = buildSoftDeleteStatement(c, {
    id: target.id,
    expectedVersion: input.expectedVersion,
    actor: input.actor,
    now,
  });
  const queueRestore = c.db
    .prepare(
      `UPDATE schema_diff_queue SET status = 'queued'
       WHERE question_id = ?1 AND status = 'resolved'
         AND EXISTS (
           SELECT 1 FROM schema_aliases
            WHERE id = ?2 AND deleted_at = ?3 AND version = ?4
         )`,
    )
    .bind(target.aliasQuestionId, target.id, now, input.expectedVersion + 1);
  const beforeJson = JSON.stringify(target);
  const afterJson = JSON.stringify({
    relatedAuditId,
    reason: input.reason ?? null,
    rolledBackAt: now,
  });
  const auditInsert = c.db
    .prepare(
      `INSERT INTO audit_log
       (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)
       SELECT ?1, ?2, 'schema_alias.rollback', 'schema_alias', ?3, ?4, ?5, ?6
        WHERE EXISTS (
          SELECT 1 FROM schema_aliases
           WHERE id = ?3 AND deleted_at = ?6 AND version = ?7
        )`,
    )
    .bind(auditId, input.actor, target.id, beforeJson, afterJson, now, input.expectedVersion + 1);

  if (typeof c.db.batch !== "function") {
    throw new SchemaAliasRollbackFailure(
      "batch_failed",
      "D1 batch transaction is required for schema alias rollback",
    );
  }
  let results: unknown[];
  try {
    results = await c.db.batch([softDelete, queueRestore, auditInsert]);
  } catch (e) {
    throw new SchemaAliasRollbackFailure(
      "batch_failed",
      e instanceof Error ? e.message : "batch failed",
    );
  }
  const first = results[0] as { meta?: { changes?: number } } | undefined;
  if (!first?.meta || first.meta.changes === 0) {
    throw new SchemaAliasRollbackFailure(
      "version_mismatch",
      "race detected: optimistic lock update affected 0 rows",
    );
  }

  const impact = await computeImpact(c, target.stableKey);
  return {
    aliasId: target.id,
    rolledBackAt: now,
    relatedAuditId,
    newVersion: target.version + 1,
    impact,
  };
}
