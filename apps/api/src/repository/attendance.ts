import type { DbCtx } from "./_shared/db";
import { isUniqueConstraintError } from "./_shared/db";
import type { MemberId } from "./_shared/brand";
import { asMemberId } from "./_shared/brand";
import { placeholders } from "./_shared/sql";

export interface MemberAttendanceRow {
  memberId: MemberId;
  sessionId: string;
  assignedAt: string;
  assignedBy: string;
}

export type AddAttendanceResult =
  | { ok: true; row: MemberAttendanceRow }
  | { ok: false; reason: "duplicate"; existing: MemberAttendanceRow }
  | { ok: false; reason: "deleted_member" | "member_not_found" | "session_not_found" };

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
  // 1. active session 存在確認
  const session = await c.db
    .prepare("SELECT session_id FROM meeting_sessions WHERE session_id = ? AND deleted_at IS NULL")
    .bind(sessionId)
    .first<{ session_id: string }>();
  if (!session) return { ok: false, reason: "session_not_found" };

  // 2. member 存在 + 削除済み除外
  const member = await c.db
    .prepare("SELECT member_id FROM member_identities WHERE member_id = ?")
    .bind(memberId)
    .first<{ member_id: string }>();
  if (!member) return { ok: false, reason: "member_not_found" };

  const status = await c.db
    .prepare("SELECT is_deleted FROM member_status WHERE member_id = ?")
    .bind(memberId)
    .first<{ is_deleted: number }>();
  if (status?.is_deleted === 1) return { ok: false, reason: "deleted_member" };

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

// =====================================================================
// MemberProfile.attendance への注入用 read aggregator
// (ut-02a-attendance-profile-integration)
// MemberProfile.attendance: AttendanceRecord[] の型契約は 02a で確定。
// 本セクションは builder へ供給する read-only の集約のみを担う。
// =====================================================================

export interface AttendanceRecord {
  sessionId: string;
  title: string;
  heldOn: string;
}

// Cloudflare D1 の prepared statement 引数上限は 100。安全側で 80 とする。
export const ATTENDANCE_BIND_CHUNK_SIZE = 80;

interface AttendanceJoinRow {
  member_id: string;
  session_id: string;
  title: string;
  held_on: string;
}

// issue-372: 大量出席履歴のページング
// cursor は { heldOn, sessionId } を base64url(JSON) でエンコードする。
// sort 順序は held_on DESC, session_id DESC（ページング用 tiebreak）。
// 既存 findByMemberIds は変更しない（後方互換維持）。
export const ATTENDANCE_PAGE_DEFAULT_LIMIT = 50;
export const ATTENDANCE_PAGE_MAX_LIMIT = 200;

export interface AttendanceCursor {
  heldOn: string;
  sessionId: string;
}

export interface AttendancePageOptions {
  limit?: number;
  cursor?: AttendanceCursor;
}

export interface AttendancePageResult {
  records: ReadonlyArray<AttendanceRecord>;
  hasMore: boolean;
  nextCursor: string | null;
}

const toBase64Url = (s: string): string => {
  // Cloudflare Workers / Node 共通で動く実装
  let b64: string;
  if (typeof btoa === "function") {
    // btoa は latin-1 のみ。JSON ASCII のみ前提だが、安全側で URI encode 経由
    b64 = btoa(unescape(encodeURIComponent(s)));
  } else {
    b64 = Buffer.from(s, "utf-8").toString("base64");
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (s: string): string => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(b64 + pad)));
  }
  return Buffer.from(b64 + pad, "base64").toString("utf-8");
};

export const encodeAttendanceCursor = (cursor: AttendanceCursor): string =>
  toBase64Url(JSON.stringify({ heldOn: cursor.heldOn, sessionId: cursor.sessionId }));

export const decodeAttendanceCursor = (encoded: string): AttendanceCursor | null => {
  try {
    const json = fromBase64Url(encoded);
    const obj = JSON.parse(json) as Record<string, unknown>;
    if (typeof obj.heldOn !== "string" || typeof obj.sessionId !== "string") return null;
    if (obj.heldOn.length === 0 || obj.sessionId.length === 0) return null;
    return { heldOn: obj.heldOn, sessionId: obj.sessionId };
  } catch {
    return null;
  }
};

export const clampAttendanceLimit = (raw: number | undefined): number => {
  if (raw === undefined || !Number.isFinite(raw)) return ATTENDANCE_PAGE_DEFAULT_LIMIT;
  const n = Math.floor(raw);
  if (n < 1) return ATTENDANCE_PAGE_DEFAULT_LIMIT;
  if (n > ATTENDANCE_PAGE_MAX_LIMIT) return ATTENDANCE_PAGE_MAX_LIMIT;
  return n;
};

export interface AttendanceProvider {
  findByMemberIds(
    ids: ReadonlyArray<MemberId>,
  ): Promise<ReadonlyMap<MemberId, ReadonlyArray<AttendanceRecord>>>;
  findByMemberId(
    id: MemberId,
    opts?: AttendancePageOptions,
  ): Promise<AttendancePageResult>;
}

const chunkBy = <T>(items: ReadonlyArray<T>, size: number): T[][] => {
  if (size <= 0) return [items.slice()];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
};

const dedupeIds = <T>(items: ReadonlyArray<T>): T[] => Array.from(new Set(items));

const sortRecords = (a: AttendanceRecord, b: AttendanceRecord): number => {
  // held_on DESC, session_id ASC
  if (a.heldOn !== b.heldOn) return a.heldOn < b.heldOn ? 1 : -1;
  if (a.sessionId < b.sessionId) return -1;
  if (a.sessionId > b.sessionId) return 1;
  return 0;
};

/**
 * 複数 memberId の出席履歴をバッチ取得する。
 * - 入力空配列の場合は D1 にクエリを発行せず空 Map を返す。
 * - bind 上限を超える場合は ATTENDANCE_BIND_CHUNK_SIZE 単位でチャンク分割し、N+1 を回避する。
 * - meeting_sessions に該当しない attendance row（参照元 meeting が消えたケース）は INNER JOIN により自動除外。
 * - 同一 member の同一 session 重複は session_id 単位で 1 件に正規化。
 */
export const createAttendanceProvider = (c: DbCtx): AttendanceProvider => ({
  async findByMemberIds(ids) {
    const result = new Map<MemberId, AttendanceRecord[]>();
    if (ids.length === 0) return result;

    const uniqueIds = dedupeIds(ids);
    const chunks = chunkBy(uniqueIds, ATTENDANCE_BIND_CHUNK_SIZE);
    const seenByMember = new Map<MemberId, Set<string>>();

    for (const ch of chunks) {
      const ph = placeholders(ch.length);
      const rows = await c.db
        .prepare(
          `SELECT ma.member_id AS member_id,
                  ms.session_id AS session_id,
                  ms.title AS title,
                  ms.held_on AS held_on
           FROM member_attendance ma
           INNER JOIN meeting_sessions ms ON ms.session_id = ma.session_id
           WHERE ma.member_id IN (${ph})`,
        )
        .bind(...ch)
        .all<AttendanceJoinRow>();

      for (const row of rows.results) {
        const mid = row.member_id as MemberId;
        let bucket = result.get(mid);
        if (!bucket) {
          bucket = [];
          result.set(mid, bucket);
        }
        let seen = seenByMember.get(mid);
        if (!seen) {
          seen = new Set();
          seenByMember.set(mid, seen);
        }
        if (seen.has(row.session_id)) continue;
        seen.add(row.session_id);
        bucket.push({
          sessionId: row.session_id,
          title: row.title,
          heldOn: row.held_on,
        });
      }
    }

    for (const [mid, recs] of result) {
      result.set(mid, recs.sort(sortRecords));
    }
    return result;
  },

  async findByMemberId(id, opts) {
    const limit = clampAttendanceLimit(opts?.limit);
    const cursor = opts?.cursor;

    // LIMIT N+1 で hasMore を判定する。
    // sort: held_on DESC, session_id DESC。
    // cursor 条件: held_on < c.heldOn OR (held_on = c.heldOn AND session_id < c.sessionId)
    const baseSelect =
      `SELECT ms.session_id AS session_id,
              ms.title AS title,
              ms.held_on AS held_on
         FROM member_attendance ma
         INNER JOIN meeting_sessions ms ON ms.session_id = ma.session_id
        WHERE ma.member_id = ?`;
    const orderLimit = ` ORDER BY ms.held_on DESC, ms.session_id DESC LIMIT ?`;

    let sql: string;
    let binds: unknown[];
    if (cursor) {
      sql =
        baseSelect +
        ` AND (ms.held_on < ? OR (ms.held_on = ? AND ms.session_id < ?))` +
        orderLimit;
      binds = [id, cursor.heldOn, cursor.heldOn, cursor.sessionId, limit + 1];
    } else {
      sql = baseSelect + orderLimit;
      binds = [id, limit + 1];
    }

    const rows = await c.db
      .prepare(sql)
      .bind(...binds)
      .all<AttendanceJoinRow>();

    const all = (rows.results ?? []).map((row) => ({
      sessionId: row.session_id,
      title: row.title,
      heldOn: row.held_on,
    }));

    // 同一 session_id 重複は dedupe（findByMemberIds と同じ正規化）
    const seen = new Set<string>();
    const deduped: AttendanceRecord[] = [];
    for (const r of all) {
      if (seen.has(r.sessionId)) continue;
      seen.add(r.sessionId);
      deduped.push(r);
    }

    const hasMore = deduped.length > limit;
    const records = hasMore ? deduped.slice(0, limit) : deduped;
    const last = records[records.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeAttendanceCursor({ heldOn: last.heldOn, sessionId: last.sessionId })
        : null;

    return { records, hasMore, nextCursor };
  },
});
