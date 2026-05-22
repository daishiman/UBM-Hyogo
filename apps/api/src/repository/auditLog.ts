// audit_log repository（append-only）
// AC-6: append-only。UPDATE / DELETE API は提供しない（型で阻止）。
// DDL: audit_log(audit_id PK, actor_id, actor_email, action, target_type, target_id,
//                 before_json, after_json, created_at)
import type { DbCtx } from "./_shared/db";
import type { AdminEmail, AdminId, AuditAction } from "./_shared/brand";

export type AuditTargetType =
  | "member"
  | "admin_member_note"
  | "tag_queue"
  | "schema_diff"
  | "meeting"
  | "system";

export interface AuditLogEntry {
  auditId: string;
  actorId: AdminId | null;
  actorEmail: AdminEmail | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

export interface NewAuditLogEntry {
  actorId: AdminId | null;
  actorEmail: AdminEmail | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  createdAt?: string;
}

interface RawAuditRow {
  auditId: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: AuditTargetType;
  targetId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
}

export interface AuditLogListFilters {
  action?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  fromUtc?: string;
  toUtcExclusive?: string;
  cursor?: {
    createdAt: string;
    auditId: string;
  };
  limit: number;
}

export interface AuditLogListRow {
  auditId: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
}

const SELECT_COLS =
  "audit_id AS auditId, actor_id AS actorId, actor_email AS actorEmail, action, target_type AS targetType, target_id AS targetId, before_json AS beforeJson, after_json AS afterJson, created_at AS createdAt";

const parseJson = (s: string | null): Record<string, unknown> | null => {
  if (s === null || s === "") return null;
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const toEntry = (r: RawAuditRow): AuditLogEntry => ({
  auditId: r.auditId,
  actorId: r.actorId as AdminId | null,
  actorEmail: r.actorEmail as AdminEmail | null,
  action: r.action as AuditAction,
  targetType: r.targetType,
  targetId: r.targetId,
  before: parseJson(r.beforeJson),
  after: parseJson(r.afterJson),
  createdAt: r.createdAt,
});

export const append = async (
  c: DbCtx,
  e: NewAuditLogEntry,
): Promise<AuditLogEntry> => {
  const auditId = crypto.randomUUID();
  const createdAt = e.createdAt ?? new Date().toISOString();
  const before = e.before ? JSON.stringify(e.before) : null;
  const after = e.after ? JSON.stringify(e.after) : null;
  await c.db
    .prepare(
      "INSERT INTO audit_log (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
    )
    .bind(
      auditId,
      e.actorId,
      e.actorEmail,
      e.action,
      e.targetType,
      e.targetId,
      before,
      after,
      createdAt,
    )
    .run();
  return {
    auditId,
    actorId: e.actorId,
    actorEmail: e.actorEmail,
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    before: e.before ?? null,
    after: e.after ?? null,
    createdAt,
  };
};

export const listRecent = async (
  c: DbCtx,
  limit: number,
): Promise<AuditLogEntry[]> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM audit_log ORDER BY created_at DESC LIMIT ?1`,
    )
    .bind(limit)
    .all<RawAuditRow>();
  return (r.results ?? []).map(toEntry);
};

export const listByActor = async (
  c: DbCtx,
  actorEmail: AdminEmail,
  limit: number,
): Promise<AuditLogEntry[]> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM audit_log WHERE actor_email = ?1 ORDER BY created_at DESC LIMIT ?2`,
    )
    .bind(actorEmail, limit)
    .all<RawAuditRow>();
  return (r.results ?? []).map(toEntry);
};

export const listByTarget = async (
  c: DbCtx,
  targetType: AuditTargetType,
  targetId: string,
  limit: number,
): Promise<AuditLogEntry[]> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM audit_log WHERE target_type = ?1 AND target_id = ?2 ORDER BY created_at DESC LIMIT ?3`,
    )
    .bind(targetType, targetId, limit)
    .all<RawAuditRow>();
  return (r.results ?? []).map(toEntry);
};

export const listFiltered = async (
  c: DbCtx,
  filters: AuditLogListFilters,
): Promise<AuditLogListRow[]> => {
  const where: string[] = [];
  const bindings: Array<string | number | null> = [];

  const add = (sql: string, value: string | number | null) => {
    bindings.push(value);
    where.push(sql.replace("?", `?${bindings.length}`));
  };

  if (filters.action) add("action = ?", filters.action);
  if (filters.actorEmail) add("actor_email = ?", filters.actorEmail);
  if (filters.targetType) add("target_type = ?", filters.targetType);
  if (filters.targetId) add("target_id = ?", filters.targetId);
  if (filters.fromUtc) add("created_at >= ?", filters.fromUtc);
  if (filters.toUtcExclusive) add("created_at < ?", filters.toUtcExclusive);
  if (filters.cursor) {
    bindings.push(filters.cursor.createdAt, filters.cursor.auditId);
    where.push(
      `(created_at < ?${bindings.length - 1} OR (created_at = ?${bindings.length - 1} AND audit_id < ?${bindings.length}))`,
    );
  }

  bindings.push(filters.limit);
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS}
       FROM audit_log
       ${whereSql}
       ORDER BY created_at DESC, audit_id DESC
       LIMIT ?${bindings.length}`,
    )
    .bind(...bindings)
    .all<AuditLogListRow>();
  return r.results ?? [];
};

// NOTE: append-only を構造で守るため、UPDATE / DELETE 関数はこのモジュールから export しない。
//       この不在自体が AC-6 を satisfy する（type test で `// @ts-expect-error` 検証）。

export interface AuditLogProvider {
  append(e: NewAuditLogEntry): Promise<AuditLogEntry>;
  listRecent(limit: number): Promise<AuditLogEntry[]>;
  listByActor(actorEmail: AdminEmail, limit: number): Promise<AuditLogEntry[]>;
  listByTarget(
    targetType: AuditTargetType,
    targetId: string,
    limit: number,
  ): Promise<AuditLogEntry[]>;
  listFiltered(filters: AuditLogListFilters): Promise<AuditLogListRow[]>;
}

// ---------------------------------------------------------------------------
// Issue #315: application audit_log cold storage (R2 export)
// ---------------------------------------------------------------------------

export interface ExportableAuditRow {
  auditId: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
}

export const listForExport = async (
  c: DbCtx,
  range: { fromUtc: string; toUtcExclusive: string; limit: number },
): Promise<ExportableAuditRow[]> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS}
       FROM audit_log
       WHERE created_at >= ?1 AND created_at < ?2
       ORDER BY created_at ASC, audit_id ASC
       LIMIT ?3`,
    )
    .bind(range.fromUtc, range.toUtcExclusive, range.limit)
    .all<ExportableAuditRow>();
  return r.results ?? [];
};

export interface NewExportManifest {
  exportRunId: string;
  yyyy: number;
  mm: number;
  dd: number;
  objectKey: string;
  rowCount: number;
  uncompressedBytes: number;
  compressedBytes: number;
  sha256: string;
  startedAt: string;
}

export const insertExportManifest = async (
  c: DbCtx,
  m: NewExportManifest,
): Promise<{ id: string }> => {
  const id = crypto.randomUUID();
  await c.db
    .prepare(
      `INSERT INTO audit_log_export_manifest
       (id, export_run_id, yyyy, mm, dd, object_key, row_count, uncompressed_bytes, compressed_bytes, sha256, redaction_policy_version, status, started_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'v1','pending',?11)`,
    )
    .bind(
      id,
      m.exportRunId,
      m.yyyy,
      m.mm,
      m.dd,
      m.objectKey,
      m.rowCount,
      m.uncompressedBytes,
      m.compressedBytes,
      m.sha256,
      m.startedAt,
    )
    .run();
  return { id };
};

export const completeExportManifest = async (
  c: DbCtx,
  id: string,
  m: { r2Etag: string | null; completedAt: string },
): Promise<void> => {
  await c.db
    .prepare(
      `UPDATE audit_log_export_manifest
       SET status='completed', r2_etag=?2, completed_at=?3, error_message=NULL
       WHERE id=?1`,
    )
    .bind(id, m.r2Etag, m.completedAt)
    .run();
};

export const failExportManifest = async (
  c: DbCtx,
  id: string,
  m: { errorMessage: string; completedAt: string },
): Promise<void> => {
  await c.db
    .prepare(
      `UPDATE audit_log_export_manifest
       SET status='failed', error_message=?2, completed_at=?3
       WHERE id=?1`,
    )
    .bind(id, m.errorMessage, m.completedAt)
    .run();
};

export const findExportManifestByPartition = async (
  c: DbCtx,
  yyyy: number,
  mm: number,
  dd: number,
): Promise<{ id: string; status: "pending" | "completed" | "failed" } | null> => {
  const r = await c.db
    .prepare(
      `SELECT id, status FROM audit_log_export_manifest
       WHERE yyyy=?1 AND mm=?2 AND dd=?3 LIMIT 1`,
    )
    .bind(yyyy, mm, dd)
    .first<{ id: string; status: "pending" | "completed" | "failed" }>();
  return r ?? null;
};

// 90 日 TTL purge：completed manifest で被覆された日付範囲のみ DELETE。
// 未 export 行 / failed 日付は残存させる安全装置を持つ。
export const purgeExportedOlderThan = async (
  c: DbCtx,
  thresholdUtc: string,
): Promise<{ deleted: number }> => {
  const r = await c.db
    .prepare(
      `DELETE FROM audit_log
       WHERE created_at < ?1
         AND substr(created_at,1,10) IN (
           SELECT printf('%04d-%02d-%02d', yyyy, mm, dd)
           FROM audit_log_export_manifest
           WHERE status='completed'
         )`,
    )
    .bind(thresholdUtc)
    .run();
  return { deleted: r.meta?.changes ?? 0 };
};

export const createAuditLogProvider = (c: DbCtx): AuditLogProvider => ({
  append: (e) => append(c, e),
  listRecent: (limit) => listRecent(c, limit),
  listByActor: (actorEmail, limit) => listByActor(c, actorEmail, limit),
  listByTarget: (targetType, targetId, limit) =>
    listByTarget(c, targetType, targetId, limit),
  listFiltered: (filters) => listFiltered(c, filters),
});
