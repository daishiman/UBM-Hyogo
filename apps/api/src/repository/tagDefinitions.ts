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
// code rename は optimistic CAS + dedicated audit action 付きでのみ許可する。
// 論理削除は active=0 とし、member_tags の既存 row は保持する。
// 物理削除は member_tags 参照が 0 件の tag_definitions row にだけ許可する。
// 強制移行付き物理削除は、active な移行先 tag へ member_tags を集約し、src 参照 0 件を再確認してから
// 既存 physical delete を呼ぶ issue-1117 専用経路に限定する。

export interface CreateTagDefinitionInput {
  code: string;
  label: string;
  category: string;
}

export interface UpdateTagDefinitionInput {
  code?: string;
  label?: string;
  category?: string;
  expectedCode?: string;
}

export type CreateTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }
  | { ok: false; reason: "code_conflict" };

export type UpdateTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "code_conflict" }
  | { ok: false; reason: "missing_expected_code" }
  | { ok: false; reason: "stale" };

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
): Promise<UpdateTagDefinitionResult> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return { ok: false, reason: "not_found" };
  if (input.code !== undefined && input.expectedCode === undefined) {
    return { ok: false, reason: "missing_expected_code" };
  }
  if (input.expectedCode !== undefined && input.expectedCode !== current.code) {
    return { ok: false, reason: "stale" };
  }

  const sets: string[] = [];
  const values: Array<string> = [];
  if (input.code !== undefined) {
    values.push(input.code);
    sets.push(`code = ?${values.length}`);
  }
  if (input.label !== undefined) {
    values.push(input.label);
    sets.push(`label = ?${values.length}`);
  }
  if (input.category !== undefined) {
    values.push(input.category);
    sets.push(`category = ?${values.length}`);
  }

  if (sets.length === 0) return { ok: true, row: current };

  values.push(tagId);
  const where = ["tag_id = ?" + values.length];
  if (input.code !== undefined) {
    values.push(input.expectedCode as string);
    where.push("code = ?" + values.length);
  }
  try {
    const result = await c.db
      .prepare(`UPDATE tag_definitions SET ${sets.join(", ")} WHERE ${where.join(" AND ")}`)
      .bind(...values)
      .run();
    if (input.code !== undefined && (result.meta.changes ?? 0) === 0) {
      const latest = await getTagDefinitionByIdRaw(c, tagId);
      return latest ? { ok: false, reason: "stale" } : { ok: false, reason: "not_found" };
    }
  } catch (err) {
    if (isUniqueError(err)) return { ok: false, reason: "code_conflict" };
    throw err;
  }
  const row = await getTagDefinitionByIdRaw(c, tagId);
  if (!row) throw new Error("updated tag definition was not found");
  return { ok: true, row };
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

export interface MigrateMemberTagReferencesResult {
  sourceReferenceCount: number;
  migratedCount: number;
}

export type ForceMigrateAndPhysicalDeleteTagResult =
  | { ok: true; row: TagDefinitionRow; sourceReferenceCount: number; migratedCount: number }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "target_not_found" }
  | { ok: false; reason: "target_inactive" }
  | { ok: false; reason: "same_as_source" }
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

export async function migrateMemberTagReferences(
  c: DbCtx,
  sourceTagId: string,
  destinationTagId: string,
): Promise<MigrateMemberTagReferencesResult> {
  const sourceReferenceCount = await countMemberTagReferences(c, sourceTagId);
  if (sourceReferenceCount === 0) {
    return { sourceReferenceCount, migratedCount: 0 };
  }

  const insertDestinationRows = c.db
    .prepare(
      `INSERT OR IGNORE INTO member_tags
        (member_id, tag_id, source, confidence, assigned_at, assigned_by)
       SELECT member_id, ?2, source, confidence, assigned_at, assigned_by
       FROM member_tags
       WHERE tag_id = ?1`,
    )
    .bind(sourceTagId, destinationTagId);
  const deleteSourceRows = c.db
    .prepare("DELETE FROM member_tags WHERE tag_id = ?1")
    .bind(sourceTagId);

  if (c.db.batch) {
    await c.db.batch([insertDestinationRows, deleteSourceRows]);
  } else {
    await insertDestinationRows.run();
    await deleteSourceRows.run();
  }
  return { sourceReferenceCount, migratedCount: sourceReferenceCount };
}

export async function forceMigrateAndPhysicalDeleteTagDefinition(
  c: DbCtx,
  sourceTagId: string,
  destinationTagId: string,
): Promise<ForceMigrateAndPhysicalDeleteTagResult> {
  if (sourceTagId === destinationTagId) return { ok: false, reason: "same_as_source" };

  const source = await getTagDefinitionByIdRaw(c, sourceTagId);
  if (!source) return { ok: false, reason: "not_found" };

  const destination = await getTagDefinitionByIdRaw(c, destinationTagId);
  if (!destination) return { ok: false, reason: "target_not_found" };
  if (!destination.active) return { ok: false, reason: "target_inactive" };

  const migrated = await migrateMemberTagReferences(c, sourceTagId, destinationTagId);
  const remainingReferences = await countMemberTagReferences(c, sourceTagId);
  if (remainingReferences > 0) {
    return { ok: false, reason: "has_references", referenceCount: remainingReferences };
  }

  const deleted = await physicalDeleteTagDefinition(c, sourceTagId);
  if (!deleted.ok) {
    if (deleted.reason === "not_found") return { ok: false, reason: "not_found" };
    return { ok: false, reason: "has_references", referenceCount: deleted.referenceCount };
  }

  return {
    ok: true,
    row: source,
    sourceReferenceCount: migrated.sourceReferenceCount,
    migratedCount: migrated.migratedCount,
  };
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
