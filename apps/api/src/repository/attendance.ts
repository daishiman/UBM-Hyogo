import type { DbCtx } from "./_shared/db";
import { isUniqueConstraintError } from "./_shared/db";
import type { MemberId } from "./_shared/brand";
import { asMemberId } from "./_shared/brand";

export interface MemberAttendanceRow {
  memberId: MemberId;
  sessionId: string;
  assignedAt: string;
  assignedBy: string;
}

export type AddAttendanceResult =
  | { ok: true; row: MemberAttendanceRow }
  | { ok: false; reason: "duplicate"; existing: MemberAttendanceRow }
  | { ok: false; reason: "deleted_member" | "session_not_found" };

interface AttendanceDbRow {
  member_id: string;
  session_id: string;
  assigned_at: string;
  assigned_by: string;
}

const map = (r: AttendanceDbRow): MemberAttendanceRow => ({
  memberId: asMemberId(r.member_id),
  sessionId: r.session_id,
  assignedAt: r.assigned_at,
  assignedBy: r.assigned_by,
});

export async function listAttendanceByMember(c: DbCtx, memberId: MemberId): Promise<MemberAttendanceRow[]> {
  const r = await c.db
    .prepare("SELECT member_id, session_id, assigned_at, assigned_by FROM member_attendance WHERE member_id = ?")
    .bind(memberId)
    .all<AttendanceDbRow>();
  return (r.results ?? []).map(map);
}

export async function listAttendanceBySession(c: DbCtx, sessionId: string): Promise<MemberAttendanceRow[]> {
  const r = await c.db
    .prepare("SELECT member_id, session_id, assigned_at, assigned_by FROM member_attendance WHERE session_id = ?")
    .bind(sessionId)
    .all<AttendanceDbRow>();
  return (r.results ?? []).map(map);
}

export async function getAttendance(
  c: DbCtx,
  memberId: MemberId,
  sessionId: string,
): Promise<MemberAttendanceRow | null> {
  const r = await c.db
    .prepare(
      "SELECT member_id, session_id, assigned_at, assigned_by FROM member_attendance WHERE member_id = ? AND session_id = ?",
    )
    .bind(memberId, sessionId)
    .first<AttendanceDbRow>();
  return r ? map(r) : null;
}

export async function addAttendance(
  c: DbCtx,
  memberId: MemberId,
  sessionId: string,
  by: string,
): Promise<AddAttendanceResult> {
  // 1. session 存在確認
  const session = await c.db
    .prepare("SELECT session_id FROM meeting_sessions WHERE session_id = ?")
    .bind(sessionId)
    .first<{ session_id: string }>();
  if (!session) return { ok: false, reason: "session_not_found" };

  // 2. 削除済み除外
  const status = await c.db
    .prepare("SELECT is_deleted FROM member_status WHERE member_id = ?")
    .bind(memberId)
    .first<{ is_deleted: number }>();
  if (status && status.is_deleted === 1) return { ok: false, reason: "deleted_member" };

  // 3. PK 制約で重複阻止
  try {
    await c.db
      .prepare("INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES (?, ?, ?)")
      .bind(memberId, sessionId, by)
      .run();
    const row = await getAttendance(c, memberId, sessionId);
    if (!row) throw new Error("attendance insert succeeded but row was not readable");
    return { ok: true, row };
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      const existing = await getAttendance(c, memberId, sessionId);
      if (!existing) throw e;
      return { ok: false, reason: "duplicate", existing };
    }
    throw e;
  }
}

export async function removeAttendance(c: DbCtx, memberId: MemberId, sessionId: string): Promise<MemberAttendanceRow | null> {
  const existing = await getAttendance(c, memberId, sessionId);
  if (!existing) return null;
  await c.db
    .prepare("DELETE FROM member_attendance WHERE member_id = ? AND session_id = ?")
    .bind(memberId, sessionId)
    .run();
  return existing;
}

export interface AttendableMember {
  memberId: MemberId;
  fullName: string;
  occupation: string;
}

interface AttendableDbRow {
  member_id: string;
  full_name: string;
  occupation: string;
}

// 削除済み (is_deleted=1) を除外し、既に同 session に登録済みの member も除外。
// 注: full_name / occupation は responses 側にある想定の placeholder（02a 実装と統合時に調整）。
// 本タスクでは `members` view（0001_init.sql 末尾）を経由し、status を JOIN する read-only クエリで実装する。
export async function listAttendableMembers(c: DbCtx, sessionId: string): Promise<AttendableMember[]> {
  const r = await c.db
    .prepare(
      "SELECT m.member_id AS member_id, '' AS full_name, '' AS occupation " +
        "FROM members m " +
        "JOIN member_status ms ON ms.member_id = m.member_id " +
        "WHERE ms.is_deleted = 0 AND m.member_id NOT IN (SELECT member_id FROM member_attendance WHERE session_id = ?)",
    )
    .bind(sessionId)
    .all<AttendableDbRow>();
  return (r.results ?? []).map((row) => ({
    memberId: asMemberId(row.member_id),
    fullName: row.full_name,
    occupation: row.occupation,
  }));
}
