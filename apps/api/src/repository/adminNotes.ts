// admin_member_notes repository（CRUD、admin context 専用）
// 不変条件 #11: 管理者は member 本文（member_responses）を直接編集できない。
//   このファイルは別テーブル admin_member_notes のみを扱い、member_responses には触れない。
// 不変条件 #12: admin_member_notes は public/member view model に絶対に混ざらない。
//   このファイルは builder 経路（02a の _shared/builder.ts）から呼ばれない。04c admin route のみが呼ぶ。
//   構造で守るため、PublicMemberProfile / MemberProfile は import すらしない。
import type { DbCtx } from "./_shared/db";
import type { AdminEmail, MemberId } from "./_shared/brand";

export interface AdminMemberNoteRow {
  noteId: string;
  memberId: MemberId;
  body: string;
  createdBy: AdminEmail;
  updatedBy: AdminEmail;
  createdAt: string;
  updatedAt: string;
}

export interface NewAdminMemberNote {
  memberId: MemberId;
  body: string;
  createdBy: AdminEmail;
}

interface RawNoteRow {
  noteId: string;
  memberId: string;
  body: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

const toRow = (r: RawNoteRow): AdminMemberNoteRow => ({
  noteId: r.noteId,
  memberId: r.memberId as MemberId,
  body: r.body,
  createdBy: r.createdBy as AdminEmail,
  updatedBy: r.updatedBy as AdminEmail,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const SELECT_COLS =
  "note_id AS noteId, member_id AS memberId, body, created_by AS createdBy, updated_by AS updatedBy, created_at AS createdAt, updated_at AS updatedAt";

export const findById = async (
  c: DbCtx,
  noteId: string,
): Promise<AdminMemberNoteRow | null> => {
  const r = await c.db
    .prepare(`SELECT ${SELECT_COLS} FROM admin_member_notes WHERE note_id = ?1`)
    .bind(noteId)
    .first<RawNoteRow>();
  return r ? toRow(r) : null;
};

export const listByMemberId = async (
  c: DbCtx,
  memberId: MemberId,
): Promise<AdminMemberNoteRow[]> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM admin_member_notes WHERE member_id = ?1 ORDER BY created_at DESC`,
    )
    .bind(memberId)
    .all<RawNoteRow>();
  return (r.results ?? []).map(toRow);
};

export const create = async (
  c: DbCtx,
  input: NewAdminMemberNote,
): Promise<AdminMemberNoteRow> => {
  const noteId = crypto.randomUUID();
  const now = new Date().toISOString();
  await c.db
    .prepare(
      "INSERT INTO admin_member_notes (note_id, member_id, body, created_by, updated_by, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?5)",
    )
    .bind(noteId, input.memberId, input.body, input.createdBy, now)
    .run();
  return {
    noteId,
    memberId: input.memberId,
    body: input.body,
    createdBy: input.createdBy,
    updatedBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
};

export const update = async (
  c: DbCtx,
  noteId: string,
  body: string,
  updatedBy: AdminEmail,
): Promise<AdminMemberNoteRow | null> => {
  const now = new Date().toISOString();
  const result = await c.db
    .prepare(
      "UPDATE admin_member_notes SET body = ?1, updated_at = ?2, updated_by = ?3 WHERE note_id = ?4",
    )
    .bind(body, now, updatedBy, noteId)
    .run();
  if (result.meta.changes === 0) return null;
  return findById(c, noteId);
};

export const remove = async (c: DbCtx, noteId: string): Promise<boolean> => {
  const result = await c.db
    .prepare("DELETE FROM admin_member_notes WHERE note_id = ?1")
    .bind(noteId)
    .run();
  return result.meta.changes > 0;
};
