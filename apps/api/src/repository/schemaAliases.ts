import type { DbCtx } from "./_shared/db";
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
}

const SELECT_COLS =
  "id, revision_id, stable_key, alias_question_id, alias_label, source, created_at, resolved_by, resolved_at";

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
});

export async function findAliasByQuestionId(
  c: DbCtx,
  questionId: string,
  revisionId?: string,
): Promise<SchemaAliasRow | null> {
  const sql = revisionId
    ? `${SELECT_COLS} FROM schema_aliases WHERE alias_question_id = ?1 AND revision_id = ?2 ORDER BY resolved_at DESC LIMIT 1`
    : `${SELECT_COLS} FROM schema_aliases WHERE alias_question_id = ?1 ORDER BY resolved_at DESC LIMIT 1`;
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

export async function findRevisionStableKeyCollisions(
  c: DbCtx,
  revisionId: string,
  stableKey: string,
  excludeQuestionId: string,
): Promise<string[]> {
  const r = await c.db
    .prepare(
      `SELECT alias_question_id FROM schema_aliases
       WHERE revision_id = ?1 AND stable_key = ?2 AND alias_question_id != ?3`,
    )
    .bind(revisionId, stableKey, excludeQuestionId)
    .all<{ alias_question_id: string }>();
  return (r.results ?? []).map((x) => x.alias_question_id);
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
    .prepare(`SELECT ${SELECT_COLS} FROM schema_aliases WHERE id = ?1 LIMIT 1`)
    .bind(id)
    .first<DbRow>();
  if (!current) throw new Error(`schema alias ${id} not found`);

  await c.db
    .prepare(
      `UPDATE schema_aliases
       SET stable_key = ?1, alias_label = ?2, source = ?3, resolved_by = ?4, resolved_at = ?5
       WHERE id = ?6`,
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
    .prepare(`SELECT ${SELECT_COLS} FROM schema_aliases WHERE id = ?1 LIMIT 1`)
    .bind(id)
    .first<DbRow>();
  if (!updated) throw new Error(`schema alias ${id} disappeared`);
  return map(updated);
}
