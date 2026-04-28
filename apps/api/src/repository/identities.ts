// member_identities テーブルに対する検索・更新
// email <-> member_id の双方向検索を提供

import type { DbCtx } from "./_shared/db";
import type { MemberId, ResponseId, ResponseEmail } from "./_shared/brand";
import type { MemberIdentityRow } from "./members";

/**
 * email で identity を検索する
 */
export async function findIdentityByEmail(
  c: DbCtx,
  email: ResponseEmail,
): Promise<MemberIdentityRow | null> {
  return c.db
    .prepare(
      "SELECT * FROM member_identities WHERE response_email = ?1 LIMIT 1",
    )
    .bind(email)
    .first<MemberIdentityRow>();
}

/**
 * member_id で identity を検索する
 */
export async function findIdentityByMemberId(
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
 * 現在の回答 ID と最終提出日時を更新する
 */
export async function updateCurrentResponse(
  c: DbCtx,
  id: MemberId,
  currentResponseId: ResponseId,
  lastSubmittedAt: string,
): Promise<void> {
  await c.db
    .prepare(
      `UPDATE member_identities
       SET current_response_id = ?2, last_submitted_at = ?3, updated_at = datetime('now')
       WHERE member_id = ?1`,
    )
    .bind(id, currentResponseId, lastSubmittedAt)
    .run();
}
