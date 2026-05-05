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

// 04b-followup-001: 申請行の処理状態。general 行は常に null。
export type RequestStatus = "pending" | "resolved" | "rejected";

export interface AdminMemberNoteRow {
  noteId: string;
  memberId: MemberId;
  body: string;
  noteType: AdminMemberNoteType;
  requestStatus: RequestStatus | null;
  resolvedAt: number | null;
  resolvedByAdminId: string | null;
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
  requestStatus: string | null;
  resolvedAt: number | null;
  resolvedByAdminId: string | null;
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
  requestStatus: (r.requestStatus as RequestStatus | null) ?? null,
  resolvedAt: r.resolvedAt ?? null,
  resolvedByAdminId: r.resolvedByAdminId ?? null,
  createdBy: r.createdBy as AdminEmail,
  updatedBy: r.updatedBy as AdminEmail,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const SELECT_COLS =
  "note_id AS noteId, member_id AS memberId, body, note_type AS noteType, " +
  "request_status AS requestStatus, resolved_at AS resolvedAt, resolved_by_admin_id AS resolvedByAdminId, " +
  "created_by AS createdBy, updated_by AS updatedBy, created_at AS createdAt, updated_at AS updatedAt";

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
  // 04b-followup-001: visibility_request / delete_request は INSERT 時に pending 状態を確定する。
  //   general 行は request_status NULL のまま（不変条件 #11 の影響範囲を type 列で固定）。
  const initialStatus: RequestStatus | null =
    noteType === "general" ? null : "pending";
  await c.db
    .prepare(
      "INSERT INTO admin_member_notes (note_id, member_id, body, note_type, request_status, created_by, updated_by, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7, ?7)",
    )
    .bind(
      noteId,
      input.memberId,
      input.body,
      noteType,
      initialStatus,
      input.createdBy,
      now,
    )
    .run();
  return {
    noteId,
    memberId: input.memberId,
    body: input.body,
    noteType,
    requestStatus: initialStatus,
    resolvedAt: null,
    resolvedByAdminId: null,
    createdBy: input.createdBy,
    updatedBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * 指定 member × note_type の最新 1 件を取得する。
 * 04b-followup-001 以降は pending/resolved/rejected を含む全行から最新を返す参照用 helper。
 * 二重申請ガードは {@link hasPendingRequest} を使うこと。
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
 * 指定 member × note_type の最新 pending 申請を取得する。
 * `hasPendingRequest` と同じ predicate を使い、read model と二重申請ガードの
 * 判定対象を一致させる。
 */
export const findLatestPendingByMemberAndType = async (
  c: DbCtx,
  memberId: MemberId,
  noteType: Exclude<AdminMemberNoteType, "general">,
): Promise<AdminMemberNoteRow | null> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM admin_member_notes
       WHERE member_id = ?1 AND note_type = ?2 AND request_status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(memberId, noteType)
    .first<RawNoteRow>();
  return r ? toRow(r) : null;
};

/**
 * 同一 member × note_type の pending 申請が既にあれば true を返す。
 * 04b-followup-001: `request_status='pending'` 行のみを判定対象とし、
 *   resolved / rejected 行が残っていても再申請を許容する（AC-3 / AC-7）。
 * partial index `idx_admin_notes_pending_requests` で index hit する。
 */
export const hasPendingRequest = async (
  c: DbCtx,
  memberId: MemberId,
  noteType: Exclude<AdminMemberNoteType, "general">,
): Promise<boolean> => {
  const r = await c.db
    .prepare(
      `SELECT 1 AS hit FROM admin_member_notes
       WHERE member_id = ?1 AND note_type = ?2 AND request_status = 'pending'
       LIMIT 1`,
    )
    .bind(memberId, noteType)
    .first<{ hit: number }>();
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

/**
 * pending → resolved の単方向遷移（AC-4 / AC-6）。
 * `WHERE request_status='pending'` で resolved/rejected/general 行を構造的に除外する。
 * @returns 更新成功時は noteId、対象が pending でない / 存在しない場合は null。
 */
export const markResolved = async (
  c: DbCtx,
  noteId: string,
  adminId: string,
): Promise<string | null> => {
  const now = Date.now();
  const result = await c.db
    .prepare(
      `UPDATE admin_member_notes
          SET request_status = 'resolved',
              resolved_at = ?1,
              resolved_by_admin_id = ?2,
              updated_at = ?3
        WHERE note_id = ?4
          AND request_status = 'pending'`,
    )
    .bind(now, adminId, new Date(now).toISOString(), noteId)
    .run();
  return result.meta.changes > 0 ? noteId : null;
};

/**
 * pending → rejected の単方向遷移（AC-5 / AC-6）。
 * reason は body 末尾に追記（既存 body は保持）。空 reason は呼出側 zod 責務。
 */
export const markRejected = async (
  c: DbCtx,
  noteId: string,
  adminId: string,
  reason: string,
): Promise<string | null> => {
  const now = Date.now();
  const result = await c.db
    .prepare(
      `UPDATE admin_member_notes
          SET request_status = 'rejected',
              resolved_at = ?1,
              resolved_by_admin_id = ?2,
              body = body || ?3,
              updated_at = ?4
        WHERE note_id = ?5
          AND request_status = 'pending'`,
    )
    .bind(
      now,
      adminId,
      `\n\n[rejected] ${reason}`,
      new Date(now).toISOString(),
      noteId,
    )
    .run();
  return result.meta.changes > 0 ? noteId : null;
};

/**
 * 04b-followup-004: admin queue 一覧用 helper。
 *  request_status と note_type で絞り込み、created_at ASC, note_id ASC（FIFO）で返す。
 *  cursor は (createdAt, noteId) ペア。bind parameter のみで構築する。
 */
export interface ListPendingRequestsCursor {
  createdAt: string;
  noteId: string;
}

export interface ListPendingRequestsInput {
  status: RequestStatus | "pending"; // 既定 'pending'
  type: Exclude<AdminMemberNoteType, "general">;
  limit: number;
  cursor?: ListPendingRequestsCursor | null;
}

export interface ListPendingRequestsResult {
  rows: AdminMemberNoteRow[];
  nextCursor: ListPendingRequestsCursor | null;
}

export const listPendingRequests = async (
  c: DbCtx,
  input: ListPendingRequestsInput,
): Promise<ListPendingRequestsResult> => {
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit)));
  const safeLimit = limit + 1;
  const params: unknown[] = [input.status, input.type];
  let where = "request_status = ?1 AND note_type = ?2";
  if (input.cursor) {
    where +=
      " AND (created_at > ?3 OR (created_at = ?3 AND note_id > ?4))";
    params.push(input.cursor.createdAt, input.cursor.noteId);
  }
  params.push(safeLimit);
  const sql = `SELECT ${SELECT_COLS} FROM admin_member_notes
               WHERE ${where}
               ORDER BY created_at ASC, note_id ASC
               LIMIT ?${params.length}`;
  const r = await c.db.prepare(sql).bind(...params).all<RawNoteRow>();
  const rows = (r.results ?? []).map(toRow);
  let nextCursor: ListPendingRequestsCursor | null = null;
  if (rows.length > limit) {
    const last = rows[limit - 1]!;
    nextCursor = { createdAt: last.createdAt, noteId: last.noteId };
    rows.pop();
  }
  return { rows, nextCursor };
};

export const remove = async (c: DbCtx, noteId: string): Promise<boolean> => {
  const result = await c.db
    .prepare("DELETE FROM admin_member_notes WHERE note_id = ?1")
    .bind(noteId)
    .run();
  return result.meta.changes > 0;
};
