import type { DbCtx, D1Stmt } from "./_shared/db";
import type { AdminId, StableKey } from "./_shared/brand";
import { asStableKey } from "./_shared/brand";

export interface SchemaAliasRow {
  id: string;
  revisionId: string;
  stableKey: StableKey;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: "manual" | "auto" | "migration";
  createdAt: string;
  resolvedBy: AdminId | null;
  resolvedAt: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  version: number;
}

export interface ResolvedSchemaAliasHistoryRow extends SchemaAliasRow {
  affectedResponseCount: number;
}

export interface NewSchemaAliasRow {
  id: string;
  revisionId?: string;
  stableKey: StableKey;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: "manual" | "auto" | "migration";
  resolvedBy: AdminId | string | null;
  resolvedAt: string | null;
}

export interface SchemaAliasPatch {
  stableKey?: StableKey;
  aliasLabel?: string | null;
  source?: "manual" | "auto" | "migration";
  resolvedBy?: AdminId | string | null;
  resolvedAt?: string | null;
}

interface DbRow {
  id: string;
  revision_id: string;
  stable_key: string;
  alias_question_id: string;
  alias_label: string | null;
  source: "manual" | "auto" | "migration";
  created_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  version: number;
}

const SELECT_COLS =
  "id, revision_id, stable_key, alias_question_id, alias_label, source, created_at, resolved_by, resolved_at, deleted_at, deleted_by, version";

const map = (r: DbRow): SchemaAliasRow => ({
  id: r.id,
  revisionId: r.revision_id,
  stableKey: asStableKey(r.stable_key),
  aliasQuestionId: r.alias_question_id,
  aliasLabel: r.alias_label,
  source: r.source,
  createdAt: r.created_at,
  resolvedBy: r.resolved_by as AdminId | null,
  resolvedAt: r.resolved_at,
  deletedAt: r.deleted_at,
  deletedBy: r.deleted_by,
  version: typeof r.version === "number" ? r.version : Number(r.version ?? 1),
});

export async function findAliasByQuestionId(
  c: DbCtx,
  questionId: string,
  revisionId?: string,
): Promise<SchemaAliasRow | null> {
  const sql = revisionId
    ? `${SELECT_COLS} FROM schema_aliases WHERE alias_question_id = ?1 AND revision_id = ?2 AND deleted_at IS NULL ORDER BY resolved_at DESC LIMIT 1`
    : `${SELECT_COLS} FROM schema_aliases WHERE alias_question_id = ?1 AND deleted_at IS NULL ORDER BY resolved_at DESC LIMIT 1`;
  const stmt = c.db.prepare(`SELECT ${sql}`);
  const r = revisionId
    ? await stmt.bind(questionId, revisionId).first<DbRow>()
    : await stmt.bind(questionId).first<DbRow>();
  return r ? map(r) : null;
}

export async function lookup(
  c: DbCtx,
  questionId: string,
): Promise<SchemaAliasRow | null> {
  return await findAliasByQuestionId(c, questionId);
}

export async function getById(
  c: DbCtx,
  id: string,
  options: { includeDeleted?: boolean } = {},
): Promise<SchemaAliasRow | null> {
  // 既定は active 行のみ。includeDeleted=true のときは soft-deleted を含めて取得する。
  const sql = options.includeDeleted
    ? `SELECT ${SELECT_COLS} FROM schema_aliases WHERE id = ?1 LIMIT 1 /* includeDeleted=true: deleted_at filter skipped */`
    : `SELECT ${SELECT_COLS} FROM schema_aliases WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`;
  const r = await c.db.prepare(sql).bind(id).first<DbRow>();
  return r ? map(r) : null;
}

export async function findActiveByStableKey(
  c: DbCtx,
  stableKey: string,
): Promise<SchemaAliasRow[]> {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM schema_aliases WHERE stable_key = ?1 AND deleted_at IS NULL ORDER BY resolved_at DESC`,
    )
    .bind(stableKey)
    .all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function listRecentResolvedAliases(
  c: DbCtx,
  limit = 10,
): Promise<ResolvedSchemaAliasHistoryRow[]> {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS},
              (
                SELECT COUNT(*)
                  FROM response_fields rf
                 WHERE rf.stable_key = schema_aliases.stable_key
              ) AS affected_response_count
         FROM schema_aliases
        WHERE schema_aliases.deleted_at IS NULL
          AND schema_aliases.resolved_at IS NOT NULL
        ORDER BY schema_aliases.resolved_at DESC
        LIMIT ?1`,
    )
    .bind(limit)
    .all<DbRow & { affected_response_count: number }>();
  return (r.results ?? []).map((row) => ({
    ...map(row),
    affectedResponseCount: Number(row.affected_response_count ?? 0),
  }));
}

export async function findRevisionStableKeyCollisions(
  c: DbCtx,
  revisionId: string,
  stableKey: string,
  excludeQuestionId: string,
): Promise<string[]> {
  const r = await c.db
    .prepare(
      `SELECT alias_question_id FROM schema_aliases WHERE revision_id = ?1 AND stable_key = ?2 AND alias_question_id != ?3 AND deleted_at IS NULL`,
    )
    .bind(revisionId, stableKey, excludeQuestionId)
    .all<{ alias_question_id: string }>();
  return (r.results ?? []).map((x) => x.alias_question_id);
}

export interface BuildSoftDeleteInput {
  id: string;
  expectedVersion: number;
  actor: string;
  now: string;
}

/**
 * 楽観ロック付き soft delete statement を返す。実 batch 実行は呼び出し側で行う。
 * 更新行数 0 (meta.changes === 0) は version_mismatch / not_found として呼び出し側で判定する。
 */
export function buildSoftDeleteStatement(
  c: DbCtx,
  input: BuildSoftDeleteInput,
): D1Stmt {
  return c.db
    .prepare(
      `UPDATE schema_aliases
       SET deleted_at = ?1, deleted_by = ?2, version = version + 1
       WHERE id = ?3 AND version = ?4 AND deleted_at IS NULL`,
    )
    .bind(input.now, input.actor, input.id, input.expectedVersion);
}

export async function insertManualAlias(c: DbCtx, row: {
  revisionId: string;
  stableKey: StableKey;
  aliasQuestionId: string;
  aliasLabel: string | null;
  resolvedBy: AdminId | null;
}): Promise<SchemaAliasRow> {
  const existing = await findAliasByQuestionId(c, row.aliasQuestionId, row.revisionId);
  if (existing) {
    if (existing.stableKey === row.stableKey) return existing;
    throw new Error("stable_key_collision");
  }

  const id = crypto.randomUUID();
  const resolvedAt = new Date().toISOString();
  await c.db
    .prepare(
      `INSERT INTO schema_aliases
       (id, revision_id, stable_key, alias_question_id, alias_label, source, resolved_by, resolved_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 'manual', ?6, ?7)`,
    )
    .bind(
      id,
      row.revisionId,
      row.stableKey,
      row.aliasQuestionId,
      row.aliasLabel,
      row.resolvedBy,
      resolvedAt,
    )
    .run();
  const found = await findAliasByQuestionId(c, row.aliasQuestionId, row.revisionId);
  if (!found) throw new Error(`schema alias insert failed for ${row.aliasQuestionId}`);
  return found;
}

export async function insert(
  c: DbCtx,
  row: NewSchemaAliasRow,
): Promise<SchemaAliasRow> {
  await c.db
    .prepare(
      `INSERT INTO schema_aliases
       (id, revision_id, stable_key, alias_question_id, alias_label, source, resolved_by, resolved_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
    .bind(
      row.id,
      row.revisionId ?? "legacy",
      row.stableKey,
      row.aliasQuestionId,
      row.aliasLabel,
      row.source,
      row.resolvedBy,
      row.resolvedAt ?? new Date().toISOString(),
    )
    .run();
  const found = await findAliasByQuestionId(c, row.aliasQuestionId, row.revisionId ?? "legacy");
  if (!found) throw new Error(`schema alias insert failed for ${row.aliasQuestionId}`);
  return found;
}

export async function update(
  c: DbCtx,
  id: string,
  patch: SchemaAliasPatch,
): Promise<SchemaAliasRow> {
  const current = await c.db
    .prepare(`SELECT ${SELECT_COLS} FROM schema_aliases WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`)
    .bind(id)
    .first<DbRow>();
  if (!current) throw new Error(`schema alias ${id} not found`);

  await c.db
    .prepare(
      `UPDATE schema_aliases
       SET stable_key = ?1, alias_label = ?2, source = ?3, resolved_by = ?4, resolved_at = ?5
       WHERE id = ?6 AND deleted_at IS NULL`,
    )
    .bind(
      patch.stableKey ?? current.stable_key,
      patch.aliasLabel === undefined ? current.alias_label : patch.aliasLabel,
      patch.source ?? current.source,
      patch.resolvedBy === undefined ? current.resolved_by : patch.resolvedBy,
      patch.resolvedAt === undefined || patch.resolvedAt === null
        ? current.resolved_at
        : patch.resolvedAt,
      id,
    )
    .run();

  const updated = await c.db
    .prepare(`SELECT ${SELECT_COLS} FROM schema_aliases WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`)
    .bind(id)
    .first<DbRow>();
  if (!updated) throw new Error(`schema alias ${id} disappeared`);
  return map(updated);
}
