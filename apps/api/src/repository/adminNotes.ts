// admin_member_notes repository（CRUD、admin context 専用）
// 不変条件 #11: 管理者は member 本文（member_responses）を直接編集できない。
//   このファイルは別テーブル admin_member_notes のみを扱い、member_responses には触れない。
// 不変条件 #12: admin_member_notes は public/member view model に絶対に混ざらない。
//   このファイルは builder 経路（02a の _shared/builder.ts）から呼ばれない。04c admin route のみが呼ぶ。
//   構造で守るため、PublicMemberProfile / MemberProfile は import すらしない。
import type { DbCtx } from "./_shared/db";
import type { AdminEmail, MemberId } from "./_shared/brand";

// 04b: member self-service API が利用する note_type。
//   - general: 既存 admin 用 free-form note（DEFAULT）
//   - visibility_request: 会員本人による公開停止/再公開 申請の queue
//   - delete_request: 会員本人による退会申請の queue
// 不変条件 #4 / #12: 本テーブルは public/member view model に絶対に混ざらず、
//   申請も response_fields には触れない（type 列で queue 化のみ）。
export type AdminMemberNoteType =
  | "general"
  | "visibility_request"
  | "delete_request";

export interface AdminMemberNoteRow {
  noteId: string;
  memberId: MemberId;
  body: string;
  noteType: AdminMemberNoteType;
  createdBy: AdminEmail;
  updatedBy: AdminEmail;
  createdAt: string;
  updatedAt: string;
}

export interface NewAdminMemberNote {
  memberId: MemberId;
  body: string;
  createdBy: AdminEmail;
  noteType?: AdminMemberNoteType;
}

interface RawNoteRow {
  noteId: string;
  memberId: string;
  body: string;
  noteType: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

const toRow = (r: RawNoteRow): AdminMemberNoteRow => ({
  noteId: r.noteId,
  memberId: r.memberId as MemberId,
  body: r.body,
  noteType: ((r.noteType ?? "general") as AdminMemberNoteType),
  createdBy: r.createdBy as AdminEmail,
  updatedBy: r.updatedBy as AdminEmail,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const SELECT_COLS =
  "note_id AS noteId, member_id AS memberId, body, note_type AS noteType, created_by AS createdBy, updated_by AS updatedBy, created_at AS createdAt, updated_at AS updatedAt";

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
  const noteType: AdminMemberNoteType = input.noteType ?? "general";
  await c.db
    .prepare(
      "INSERT INTO admin_member_notes (note_id, member_id, body, note_type, created_by, updated_by, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5, ?6, ?6)",
    )
    .bind(noteId, input.memberId, input.body, noteType, input.createdBy, now)
    .run();
  return {
    noteId,
    memberId: input.memberId,
    body: input.body,
    noteType,
    createdBy: input.createdBy,
    updatedBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * 指定 member × note_type の最新 1 件を取得する（pending 判定用）。
 * MVP では admin queue 側の resolve でレコードを削除/更新する運用とし、
 * 「pending = 同 type の最新行が存在する」と簡易判定する。
 * 04b の二重申請防止 (AC-6) はこの関数を使う。
 */
export const findLatestByMemberAndType = async (
  c: DbCtx,
  memberId: MemberId,
  noteType: AdminMemberNoteType,
): Promise<AdminMemberNoteRow | null> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM admin_member_notes
       WHERE member_id = ?1 AND note_type = ?2
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(memberId, noteType)
    .first<RawNoteRow>();
  return r ? toRow(r) : null;
};

/**
 * 同一 member × note_type の pending 申請が既にあれば true を返す。
 * 04b POST /me/visibility-request / POST /me/delete-request の DUPLICATE_PENDING_REQUEST 判定に使う。
 */
export const hasPendingRequest = async (
  c: DbCtx,
  memberId: MemberId,
  noteType: Exclude<AdminMemberNoteType, "general">,
): Promise<boolean> => {
  const r = await findLatestByMemberAndType(c, memberId, noteType);
  return r !== null;
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
