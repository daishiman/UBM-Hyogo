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
  resolvedAt: string;
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
  resolved_at: string;
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
