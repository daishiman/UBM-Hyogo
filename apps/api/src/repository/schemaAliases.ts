import type { DbCtx } from "./_shared/db";
import type { StableKey } from "./_shared/brand";
import { asStableKey } from "./_shared/brand";

export type SchemaAliasSource = "manual" | "auto" | "migration";

export interface SchemaAliasRow {
  id: string;
  stableKey: StableKey;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: SchemaAliasSource;
  createdAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface NewSchemaAliasRow {
  id: string;
  stableKey: StableKey;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: SchemaAliasSource;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface SchemaAliasPatch {
  stableKey?: StableKey;
  aliasLabel?: string | null;
  source?: SchemaAliasSource;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
}

interface DbRow {
  id: string;
  stable_key: string;
  alias_question_id: string;
  alias_label: string | null;
  source: SchemaAliasSource;
  created_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
}

const SELECT_COLS =
  "SELECT id, stable_key, alias_question_id, alias_label, source, created_at, resolved_by, resolved_at FROM schema_aliases";

const map = (r: DbRow): SchemaAliasRow => ({
  id: r.id,
  stableKey: asStableKey(r.stable_key),
  aliasQuestionId: r.alias_question_id,
  aliasLabel: r.alias_label,
  source: r.source,
  createdAt: r.created_at,
  resolvedBy: r.resolved_by,
  resolvedAt: r.resolved_at,
});

export async function lookup(
  c: DbCtx,
  questionId: string,
): Promise<SchemaAliasRow | null> {
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE alias_question_id = ? LIMIT 1`)
    .bind(questionId)
    .first<DbRow>();
  return r ? map(r) : null;
}

export async function insert(
  c: DbCtx,
  row: NewSchemaAliasRow,
): Promise<SchemaAliasRow> {
  await c.db
    .prepare(
      "INSERT INTO schema_aliases (id, stable_key, alias_question_id, alias_label, source, resolved_by, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      row.id,
      row.stableKey,
      row.aliasQuestionId,
      row.aliasLabel,
      row.source,
      row.resolvedBy,
      row.resolvedAt,
    )
    .run();
  const found = await lookup(c, row.aliasQuestionId);
  if (!found) throw new Error(`schema alias insert failed for ${row.aliasQuestionId}`);
  return found;
}

export async function update(
  c: DbCtx,
  id: string,
  patch: SchemaAliasPatch,
): Promise<SchemaAliasRow> {
  const current = await c.db
    .prepare(`${SELECT_COLS} WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<DbRow>();
  if (!current) throw new Error(`schema alias ${id} not found`);

  await c.db
    .prepare(
      "UPDATE schema_aliases SET stable_key = ?, alias_label = ?, source = ?, resolved_by = ?, resolved_at = ? WHERE id = ?",
    )
    .bind(
      patch.stableKey ?? current.stable_key,
      patch.aliasLabel === undefined ? current.alias_label : patch.aliasLabel,
      patch.source ?? current.source,
      patch.resolvedBy === undefined ? current.resolved_by : patch.resolvedBy,
      patch.resolvedAt === undefined ? current.resolved_at : patch.resolvedAt,
      id,
    )
    .run();

  const updated = await c.db
    .prepare(`${SELECT_COLS} WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<DbRow>();
  if (!updated) throw new Error(`schema alias ${id} disappeared`);
  return map(updated);
}
