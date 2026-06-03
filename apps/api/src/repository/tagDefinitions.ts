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

// 不変条件 #13（2026-06 再々定義 / issue-1035）:
// tag master (tag_definitions) の write は管理者 tag master CRUD 経路に限定する。
// create/update/deactivate/reactivate/physical delete は /admin/tags から audit 付きで呼ぶ。
// code は immutable。論理削除は active=0 とし、member_tags の既存 row は保持する。
// 物理削除は member_tags 参照が 0 件の tag_definitions row にだけ許可する。

export interface CreateTagDefinitionInput {
  code: string;
  label: string;
  category: string;
}

export interface UpdateTagDefinitionInput {
  label?: string;
  category?: string;
}

export type CreateTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }
  | { ok: false; reason: "code_conflict" };

export interface PagedTagDefinitions {
  total: number;
  items: TagDefinitionRow[];
}

const isUniqueError = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err);
  return /unique/i.test(message);
};

export async function getTagDefinitionByIdRaw(
  c: DbCtx,
  tagId: string,
): Promise<TagDefinitionRow | null> {
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE tag_id = ?1`)
    .bind(tagId)
    .first<DbRow>();
  return r ? map(r) : null;
}

export async function createTagDefinition(
  c: DbCtx,
  input: CreateTagDefinitionInput,
): Promise<CreateTagDefinitionResult> {
  const tagId = crypto.randomUUID();
  try {
    await c.db
      .prepare(
        "INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active) VALUES (?1, ?2, ?3, ?4, '[]', 1)",
      )
      .bind(tagId, input.code, input.label, input.category)
      .run();
  } catch (err) {
    if (isUniqueError(err)) return { ok: false, reason: "code_conflict" };
    throw err;
  }
  const row = await getTagDefinitionByIdRaw(c, tagId);
  if (!row) throw new Error("created tag definition was not found");
  return { ok: true, row };
}

export async function updateTagDefinition(
  c: DbCtx,
  tagId: string,
  input: UpdateTagDefinitionInput,
): Promise<TagDefinitionRow | null> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return null;

  const sets: string[] = [];
  const values: Array<string> = [];
  if (input.label !== undefined) {
    values.push(input.label);
    sets.push(`label = ?${values.length}`);
  }
  if (input.category !== undefined) {
    values.push(input.category);
    sets.push(`category = ?${values.length}`);
  }

  if (sets.length === 0) return current;

  values.push(tagId);
  await c.db
    .prepare(`UPDATE tag_definitions SET ${sets.join(", ")} WHERE tag_id = ?${values.length}`)
    .bind(...values)
    .run();
  return getTagDefinitionByIdRaw(c, tagId);
}

export async function deactivateTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<{ row: TagDefinitionRow; changed: boolean } | null> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return null;
  if (!current.active) return { row: current, changed: false };

  const result = await c.db
    .prepare("UPDATE tag_definitions SET active = 0 WHERE tag_id = ?1 AND active = 1")
    .bind(tagId)
    .run();
  const row = await getTagDefinitionByIdRaw(c, tagId);
  if (!row) throw new Error("deactivated tag definition was not found");
  return { row, changed: (result.meta.changes ?? 0) > 0 };
}

export async function reactivateTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<{ row: TagDefinitionRow; changed: boolean } | null> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return null;
  if (current.active) return { row: current, changed: false };

  const result = await c.db
    .prepare("UPDATE tag_definitions SET active = 1 WHERE tag_id = ?1 AND active = 0")
    .bind(tagId)
    .run();
  const row = await getTagDefinitionByIdRaw(c, tagId);
  if (!row) throw new Error("reactivated tag definition was not found");
  return { row, changed: (result.meta.changes ?? 0) > 0 };
}

export async function countMemberTagReferences(c: DbCtx, tagId: string): Promise<number> {
  const row = await c.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = ?1")
    .bind(tagId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export type PhysicalDeleteTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "has_references"; referenceCount: number };

export async function physicalDeleteTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<PhysicalDeleteTagDefinitionResult> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return { ok: false, reason: "not_found" };

  const referenceCount = await countMemberTagReferences(c, tagId);
  if (referenceCount > 0) {
    return { ok: false, reason: "has_references", referenceCount };
  }

  await c.db.prepare("DELETE FROM tag_definitions WHERE tag_id = ?1").bind(tagId).run();
  return { ok: true, row: current };
}

export async function listTagDefinitionsPaged(
  c: DbCtx,
  opts: { q?: string; page: number; pageSize: number },
): Promise<PagedTagDefinitions> {
  const q = opts.q?.trim().toLowerCase();
  const pattern = q && q.length > 0 ? `%${q}%` : null;
  const offset = (opts.page - 1) * opts.pageSize;
  const where = "(?1 IS NULL OR LOWER(code) LIKE ?1 OR LOWER(label) LIKE ?1)";
  const count = await c.db
    .prepare(`SELECT COUNT(*) AS total FROM tag_definitions WHERE ${where}`)
    .bind(pattern)
    .first<{ total: number }>();
  const rows = await c.db
    .prepare(`${SELECT_COLS} WHERE ${where} ORDER BY code ASC LIMIT ?2 OFFSET ?3`)
    .bind(pattern, opts.pageSize, offset)
    .all<DbRow>();
  return {
    total: count?.total ?? 0,
    items: (rows.results ?? []).map(map),
  };
}

export interface TagDefinitionsProvider {
  listAllTagDefinitions(): Promise<TagDefinitionRow[]>;
  listByCategory(category: string): Promise<TagDefinitionRow[]>;
  findByCode(code: string): Promise<TagDefinitionRow | null>;
}

export const createTagDefinitionsProvider = (c: DbCtx): TagDefinitionsProvider => ({
  listAllTagDefinitions: () => listAllTagDefinitions(c),
  listByCategory: (category) => listByCategory(c, category),
  findByCode: (code) => findByCode(c, code),
});
