import type { DbCtx } from "./_shared/db";

export interface MeetingSessionRow {
  sessionId: string;
  title: string;
  heldOn: string;
  note: string | null;
  createdAt: string;
  createdBy: string;
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
}

const map = (r: DbRow): MeetingSessionRow => ({
  sessionId: r.session_id,
  title: r.title,
  heldOn: r.held_on,
  note: r.note,
  createdAt: r.created_at,
  createdBy: r.created_by,
});

export async function findMeetingById(c: DbCtx, id: string): Promise<MeetingSessionRow | null> {
  const r = await c.db
    .prepare("SELECT session_id, title, held_on, note, created_at, created_by FROM meeting_sessions WHERE session_id = ?")
    .bind(id)
    .first<DbRow>();
  return r ? map(r) : null;
}

export async function listMeetings(c: DbCtx, limit: number, offset: number): Promise<MeetingSessionRow[]> {
  const r = await c.db
    .prepare("SELECT session_id, title, held_on, note, created_at, created_by FROM meeting_sessions ORDER BY held_on DESC LIMIT ? OFFSET ?")
    .bind(limit, offset)
    .all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function listRecentMeetings(c: DbCtx, n: number): Promise<MeetingSessionRow[]> {
  const r = await c.db
    .prepare("SELECT session_id, title, held_on, note, created_at, created_by FROM meeting_sessions ORDER BY held_on DESC LIMIT ?")
    .bind(n)
    .all<DbRow>();
  return (r.results ?? []).map(map);
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
