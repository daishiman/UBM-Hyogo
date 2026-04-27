import type { DbCtx } from "./_shared/db";

export interface TagDefinitionRow {
  tagId: string;
  code: string;
  label: string;
  category: string;
  sourceStableKeysJson: string;
  active: boolean;
}

interface DbRow {
  tag_id: string;
  code: string;
  label: string;
  category: string;
  source_stable_keys_json: string;
  active: number;
}

const map = (r: DbRow): TagDefinitionRow => ({
  tagId: r.tag_id,
  code: r.code,
  label: r.label,
  category: r.category,
  sourceStableKeysJson: r.source_stable_keys_json,
  active: r.active === 1,
});

const SELECT_COLS =
  "SELECT tag_id, code, label, category, source_stable_keys_json, active FROM tag_definitions";

export async function listAllTagDefinitions(c: DbCtx): Promise<TagDefinitionRow[]> {
  const r = await c.db.prepare(`${SELECT_COLS} WHERE active = 1`).all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function listByCategory(c: DbCtx, category: string): Promise<TagDefinitionRow[]> {
  const r = await c.db.prepare(`${SELECT_COLS} WHERE category = ? AND active = 1`).bind(category).all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function findByCode(c: DbCtx, code: string): Promise<TagDefinitionRow | null> {
  const r = await c.db.prepare(`${SELECT_COLS} WHERE code = ?`).bind(code).first<DbRow>();
  return r ? map(r) : null;
}

// 不変条件 #13: write API は提供しない。seed は 01a で投入済み。
