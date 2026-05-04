import type { DbCtx } from "./_shared/db";

export interface MeetingSessionRow {
  sessionId: string;
  title: string;
  heldOn: string;
  note: string | null;
  createdAt: string;
  createdBy: string;
  deletedAt: string | null;
}

export interface NewMeetingSessionRow {
  sessionId: string;
  title: string;
  heldOn: string;
  note: string | null;
  createdBy: string;
}

interface DbRow {
  session_id: string;
  title: string;
  held_on: string;
  note: string | null;
  created_at: string;
  created_by: string;
  deleted_at?: string | null;
}

const map = (r: DbRow): MeetingSessionRow => ({
  sessionId: r.session_id,
  title: r.title,
  heldOn: r.held_on,
  note: r.note,
  createdAt: r.created_at,
  createdBy: r.created_by,
  deletedAt: r.deleted_at ?? null,
});

export interface UpdateMeetingSessionInput {
  title?: string | undefined;
  heldOn?: string | undefined;
  note?: string | null | undefined;
  deletedAt?: string | null | undefined;
}

export interface MeetingAttendanceExportRow {
  meetingId: string;
  heldOn: string;
  memberId: string;
  displayName: string;
  attended: "true";
}

const SELECT_MEETING_COLS = "session_id, title, held_on, note, created_at, created_by, deleted_at";

export async function findMeetingById(c: DbCtx, id: string): Promise<MeetingSessionRow | null> {
  const r = await c.db
    .prepare(`SELECT ${SELECT_MEETING_COLS} FROM meeting_sessions WHERE session_id = ?`)
    .bind(id)
    .first<DbRow>();
  return r ? map(r) : null;
}

export async function listMeetings(c: DbCtx, limit: number, offset: number): Promise<MeetingSessionRow[]> {
  const r = await c.db
    .prepare(`SELECT ${SELECT_MEETING_COLS} FROM meeting_sessions WHERE deleted_at IS NULL ORDER BY held_on DESC LIMIT ? OFFSET ?`)
    .bind(limit, offset)
    .all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function listRecentMeetings(c: DbCtx, n: number): Promise<MeetingSessionRow[]> {
  const r = await c.db
    .prepare(`SELECT ${SELECT_MEETING_COLS} FROM meeting_sessions WHERE deleted_at IS NULL ORDER BY held_on DESC LIMIT ?`)
    .bind(n)
    .all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function countMeetingsInYear(c: DbCtx, year: number): Promise<number> {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const r = await c.db
    .prepare("SELECT COUNT(*) AS cnt FROM meeting_sessions WHERE deleted_at IS NULL AND held_on >= ? AND held_on < ?")
    .bind(start, end)
    .first<{ cnt: number }>();
  return r?.cnt ?? 0;
}

export async function insertMeeting(c: DbCtx, row: NewMeetingSessionRow): Promise<MeetingSessionRow> {
  await c.db
    .prepare("INSERT INTO meeting_sessions (session_id, title, held_on, note, created_by) VALUES (?, ?, ?, ?, ?)")
    .bind(row.sessionId, row.title, row.heldOn, row.note, row.createdBy)
    .run();
  const found = await findMeetingById(c, row.sessionId);
  if (!found) throw new Error(`insertMeeting failed for ${row.sessionId}`);
  return found;
}

export async function updateMeeting(
  c: DbCtx,
  id: string,
  input: UpdateMeetingSessionInput,
): Promise<MeetingSessionRow | null> {
  const current = await findMeetingById(c, id);
  if (!current) return null;
  const next = {
    title: input.title ?? current.title,
    heldOn: input.heldOn ?? current.heldOn,
    note: input.note !== undefined ? input.note : current.note,
    deletedAt: input.deletedAt !== undefined ? input.deletedAt : current.deletedAt,
  };
  await c.db
    .prepare("UPDATE meeting_sessions SET title = ?, held_on = ?, note = ?, deleted_at = ? WHERE session_id = ?")
    .bind(next.title, next.heldOn, next.note, next.deletedAt, id)
    .run();
  return findMeetingById(c, id);
}

export async function listMeetingAttendanceForExport(
  c: DbCtx,
  id: string,
): Promise<MeetingAttendanceExportRow[] | null> {
  const meeting = await findMeetingById(c, id);
  if (!meeting || meeting.deletedAt) return null;
  const r = await c.db
    .prepare(
      `SELECT ma.member_id AS memberId,
              COALESCE(json_extract(mr.answers_json, '$.displayName'),
                       json_extract(mr.answers_json, '$.fullName'),
                       mi.response_email,
                       ma.member_id) AS displayName
         FROM member_attendance ma
         LEFT JOIN member_identities mi ON mi.member_id = ma.member_id
         LEFT JOIN member_responses mr ON mr.response_id = mi.current_response_id
        WHERE ma.session_id = ?
        ORDER BY displayName ASC, ma.member_id ASC`,
    )
    .bind(id)
    .all<{ memberId: string; displayName: string | null }>();
  return (r.results ?? []).map((row) => ({
    meetingId: meeting.sessionId,
    heldOn: meeting.heldOn,
    memberId: row.memberId,
    displayName: row.displayName ?? row.memberId,
    attended: "true",
  }));
}
