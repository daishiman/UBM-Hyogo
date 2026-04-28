// member_identities テーブルへの CRUD
// members は VIEW のため SELECT のみ。書き込みは member_identities を直接使う。

import type { DbCtx } from "./_shared/db";
import { placeholders } from "./_shared/sql";
import type { MemberId, ResponseId, ResponseEmail } from "./_shared/brand";

export interface MemberIdentityRow {
  member_id: string;
  response_email: string;
  current_response_id: string;
  first_response_id: string;
  last_submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertMemberInput {
  memberId: MemberId;
  responseEmail: ResponseEmail;
  currentResponseId: ResponseId;
  firstResponseId: ResponseId;
  lastSubmittedAt: string;
}

/**
 * member_id で会員 identity を取得する
 */
export async function findMemberById(
  c: DbCtx,
  id: MemberId,
): Promise<MemberIdentityRow | null> {
  return c.db
    .prepare(
      "SELECT * FROM member_identities WHERE member_id = ?1 LIMIT 1",
    )
    .bind(id)
    .first<MemberIdentityRow>();
}

/**
 * 複数の member_id で会員 identity 一覧を取得する
 */
export async function listMembersByIds(
  c: DbCtx,
  ids: MemberId[],
): Promise<MemberIdentityRow[]> {
  if (ids.length === 0) return [];
  const ph = placeholders(ids.length);
  const result = await c.db
    .prepare(
      `SELECT * FROM member_identities WHERE member_id IN (${ph})`,
    )
    .bind(...ids)
    .all<MemberIdentityRow>();
  return result.results;
}

/**
 * 会員 identity を upsert する
 * member_id が存在する場合は更新、存在しない場合は挿入
 */
export async function upsertMember(
  c: DbCtx,
  row: UpsertMemberInput,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
       ON CONFLICT(member_id) DO UPDATE SET
         response_email = excluded.response_email,
         current_response_id = excluded.current_response_id,
         last_submitted_at = excluded.last_submitted_at,
         updated_at = datetime('now')`,
    )
    .bind(
      row.memberId,
      row.responseEmail,
      row.currentResponseId,
      row.firstResponseId,
      row.lastSubmittedAt,
    )
    .run();
}
