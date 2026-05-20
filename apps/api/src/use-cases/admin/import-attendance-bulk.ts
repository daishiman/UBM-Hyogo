// ut-07c-followup-001: meeting attendance CSV bulk import service.
// 不変条件:
//  - dry-run: 副作用なし (write API call 0)
//  - commit:  全行 preflight が ok の場合のみ INSERT に進む
//  - 成功行ごとに audit_log を 1 record (action='attendance.import.add')
import type { DbCtx } from "../../repository/_shared/db";
import {
  asMemberId,
  auditAction,
  type AdminEmail,
  type AdminId,
  type MemberId,
} from "../../repository/_shared/brand";
import {
  ATTENDANCE_BIND_CHUNK_SIZE,
  listExistingAttendanceMemberIds,
} from "../../repository/attendance";
import { normalizeEmail } from "../../lib/email";

export const IMPORT_MAX_ROWS = 500;

export interface AttendanceImportRow {
  memberId?: string | undefined;
  email?: string | undefined;
}

export type ImportRowStatus =
  | "ok"
  | "duplicate"
  | "deleted_member"
  | "unknown_member"
  | "invalid";

export interface ImportRowResult {
  index: number;
  status: ImportRowStatus;
  memberId?: string;
  message?: string;
}

export interface ImportSummary {
  total: number;
  ok: number;
  duplicate: number;
  deletedMember: number;
  unknownMember: number;
  invalid: number;
}

export interface ImportAttendanceBulkOptions {
  commit: boolean;
  actor: { id: AdminId; email: AdminEmail };
}

export interface ImportAttendanceBulkResult {
  summary: ImportSummary;
  rows: ImportRowResult[];
  committed: boolean;
}

export class SessionNotFoundError extends Error {
  constructor(public readonly sessionId: string) {
    super(`session_not_found:${sessionId}`);
    this.name = "SessionNotFoundError";
  }
}

interface LookupEntry {
  memberId: MemberId;
  isDeleted: boolean;
}

interface LookupCtx {
  byMemberId: Map<string, LookupEntry>;
  byEmail: Map<string, LookupEntry>;
}

interface MemberLookupDbRow {
  member_id: string;
  response_email: string | null;
  is_deleted: number | null;
}

const verifySessionExists = async (db: DbCtx, sessionId: string): Promise<void> => {
  const row = await db.db
    .prepare(
      "SELECT session_id FROM meeting_sessions WHERE session_id = ? AND deleted_at IS NULL",
    )
    .bind(sessionId)
    .first<{ session_id: string }>();
  if (!row) throw new SessionNotFoundError(sessionId);
};

const buildLookupCtx = async (db: DbCtx): Promise<LookupCtx> => {
  const rows = await db.db
    .prepare(
      "SELECT mi.member_id AS member_id, mi.response_email AS response_email, COALESCE(ms.is_deleted, 0) AS is_deleted " +
        "FROM member_identities mi LEFT JOIN member_status ms ON ms.member_id = mi.member_id",
    )
    .all<MemberLookupDbRow>();
  const byMemberId = new Map<string, LookupEntry>();
  const byEmail = new Map<string, LookupEntry>();
  for (const r of rows.results ?? []) {
    const entry: LookupEntry = {
      memberId: asMemberId(r.member_id),
      isDeleted: r.is_deleted === 1,
    };
    byMemberId.set(r.member_id, entry);
    if (r.response_email) byEmail.set(normalizeEmail(r.response_email), entry);
  }
  return { byMemberId, byEmail };
};

export function classifyImportRow(
  row: AttendanceImportRow,
  index: number,
  ctx: LookupCtx,
  existing: Set<MemberId>,
): ImportRowResult {
  const rawMemberId = row.memberId?.trim();
  const rawEmail = row.email ? normalizeEmail(row.email) : undefined;

  if (!rawMemberId && !rawEmail) {
    return { index, status: "invalid", message: "memberId_or_email_required" };
  }

  let resolved: LookupEntry | undefined;
  let mismatch = false;

  if (rawMemberId) {
    resolved = ctx.byMemberId.get(rawMemberId);
    if (!resolved) {
      return { index, status: "unknown_member", message: "memberId_not_found" };
    }
    if (rawEmail) {
      const byEmail = ctx.byEmail.get(rawEmail);
      if (byEmail && byEmail.memberId !== resolved.memberId) mismatch = true;
    }
  } else if (rawEmail) {
    resolved = ctx.byEmail.get(rawEmail);
    if (!resolved) {
      return { index, status: "unknown_member", message: "email_not_found" };
    }
  }

  if (mismatch) {
    return { index, status: "invalid", message: "memberId_email_mismatch" };
  }
  if (!resolved) {
    return { index, status: "invalid", message: "memberId_or_email_required" };
  }
  if (resolved.isDeleted) {
    return { index, status: "deleted_member", memberId: resolved.memberId };
  }
  if (existing.has(resolved.memberId)) {
    return { index, status: "duplicate", memberId: resolved.memberId };
  }
  return { index, status: "ok", memberId: resolved.memberId };
}

const emptySummary = (): ImportSummary => ({
  total: 0,
  ok: 0,
  duplicate: 0,
  deletedMember: 0,
  unknownMember: 0,
  invalid: 0,
});

const aggregateSummary = (rows: ImportRowResult[]): ImportSummary => {
  const s = emptySummary();
  s.total = rows.length;
  for (const r of rows) {
    if (r.status === "ok") s.ok++;
    else if (r.status === "duplicate") s.duplicate++;
    else if (r.status === "deleted_member") s.deletedMember++;
    else if (r.status === "unknown_member") s.unknownMember++;
    else s.invalid++;
  }
  return s;
};

const insertChunkWithAudit = async (
  db: DbCtx,
  sessionId: string,
  memberIds: ReadonlyArray<MemberId>,
  by: string,
  actor: { id: AdminId; email: AdminEmail },
): Promise<void> => {
  const createdAt = new Date().toISOString();
  const statements = memberIds.flatMap((memberId) => [
    db.db
      .prepare(
        "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES (?, ?, ?)",
      )
      .bind(memberId, sessionId, by),
    db.db
      .prepare(
        "INSERT INTO audit_log (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
      )
      .bind(
        crypto.randomUUID(),
        actor.id,
        actor.email,
        auditAction("attendance.import.add"),
        "meeting",
        sessionId,
        null,
        JSON.stringify({ memberId }),
        createdAt,
      ),
  ]);
  const batch = db.db.batch;
  if (typeof batch !== "function") {
    throw new Error("d1_batch_unavailable");
  }
  await batch.call(db.db, statements);
};

export async function importAttendanceBulk(
  db: DbCtx,
  sessionId: string,
  rows: AttendanceImportRow[],
  options: ImportAttendanceBulkOptions,
): Promise<ImportAttendanceBulkResult> {
  await verifySessionExists(db, sessionId);
  const lookup = await buildLookupCtx(db);
  const existing = await listExistingAttendanceMemberIds(db, sessionId);

  const seenInPayload = new Set<MemberId>();
  const classified = rows.map((r, i) => {
    const result = classifyImportRow(r, i, lookup, existing);
    if (result.status !== "ok" || !result.memberId) return result;
    const memberId = asMemberId(result.memberId);
    if (seenInPayload.has(memberId)) {
      return {
        ...result,
        status: "duplicate" as const,
        message: "duplicate_in_payload",
      };
    }
    seenInPayload.add(memberId);
    return result;
  });
  const summary = aggregateSummary(classified);

  const canCommit =
    options.commit && classified.length > 0 && classified.every((r) => r.status === "ok");

  if (!canCommit) {
    return { summary, rows: classified, committed: false };
  }

  const okMemberIds: MemberId[] = [];
  for (const r of classified) {
    if (r.status === "ok" && r.memberId) okMemberIds.push(asMemberId(r.memberId));
  }

  for (let i = 0; i < okMemberIds.length; i += ATTENDANCE_BIND_CHUNK_SIZE) {
    const chunk = okMemberIds.slice(i, i + ATTENDANCE_BIND_CHUNK_SIZE);
    await insertChunkWithAudit(db, sessionId, chunk, options.actor.email, options.actor);
  }

  return { summary, rows: classified, committed: true };
}
