// audit_log repository（append-only）
// AC-6: append-only。UPDATE / DELETE API は提供しない（型で阻止）。
// DDL: audit_log(audit_id PK, actor_id, actor_email, action, target_type, target_id,
//                 before_json, after_json, created_at)
import type { DbCtx } from "./_shared/db";
import type { AdminEmail, AdminId, AuditAction } from "./_shared/brand";

export type AuditTargetType =
  | "member"
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

// NOTE: append-only を構造で守るため、UPDATE / DELETE 関数はこのモジュールから export しない。
//       この不在自体が AC-6 を satisfy する（type test で `// @ts-expect-error` 検証）。
