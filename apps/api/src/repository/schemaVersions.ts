import type { DbCtx } from "./_shared/db";

export type SchemaState = "active" | "superseded" | "pending_review";

export interface FormManifestRow {
  formId: string;
  revisionId: string;
  schemaHash: string;
  state: SchemaState;
  syncedAt: string;
  sourceUrl: string;
  fieldCount: number;
  unknownFieldCount: number;
}

export interface NewFormManifestRow {
  formId: string;
  revisionId: string;
  schemaHash: string;
  state: SchemaState;
  sourceUrl: string;
  fieldCount: number;
  unknownFieldCount: number;
}

interface DbRow {
  form_id: string;
  revision_id: string;
  schema_hash: string;
  state: SchemaState;
  synced_at: string;
  source_url: string;
  field_count: number;
  unknown_field_count: number;
}

const map = (r: DbRow): FormManifestRow => ({
  formId: r.form_id,
  revisionId: r.revision_id,
  schemaHash: r.schema_hash,
  state: r.state,
  syncedAt: r.synced_at,
  sourceUrl: r.source_url,
  fieldCount: r.field_count,
  unknownFieldCount: r.unknown_field_count,
});

const SELECT_COLS =
  "SELECT form_id, revision_id, schema_hash, state, synced_at, source_url, field_count, unknown_field_count FROM schema_versions";

export async function getLatestVersion(c: DbCtx, formId: string): Promise<FormManifestRow | null> {
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE form_id = ? AND state = 'active' ORDER BY synced_at DESC LIMIT 1`)
    .bind(formId)
    .first<DbRow>();
  return r ? map(r) : null;
}

export async function listVersions(c: DbCtx, formId: string): Promise<FormManifestRow[]> {
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE form_id = ? ORDER BY synced_at DESC`)
    .bind(formId)
    .all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function upsertManifest(c: DbCtx, row: NewFormManifestRow): Promise<FormManifestRow> {
  await c.db
    .prepare(
      "INSERT OR REPLACE INTO schema_versions (revision_id, form_id, schema_hash, state, source_url, field_count, unknown_field_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      row.revisionId,
      row.formId,
      row.schemaHash,
      row.state,
      row.sourceUrl,
      row.fieldCount,
      row.unknownFieldCount,
    )
    .run();
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE revision_id = ?`)
    .bind(row.revisionId)
    .first<DbRow>();
  if (!r) throw new Error(`upsertManifest failed for ${row.revisionId}`);
  return map(r);
}

export async function supersede(c: DbCtx, formId: string, oldRevisionId: string): Promise<void> {
  await c.db
    .prepare("UPDATE schema_versions SET state = 'superseded' WHERE form_id = ? AND revision_id = ?")
    .bind(formId, oldRevisionId)
    .run();
}
