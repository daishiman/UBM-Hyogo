// member_identities テーブルに対する検索・更新
// email <-> member_id の双方向検索を提供

import type { DbCtx } from "./_shared/db";
import type { MemberId, ResponseEmail } from "./_shared/brand";
import type { MemberIdentityRow } from "./members";

export interface AutoLinkCandidate {
  member_id: string;
  response_email: string;
  current_response_id: string;
  first_response_id: string;
  last_submitted_at: string;
}

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

export async function findAutoLinkCandidateByEmail(
  c: DbCtx,
  email: ResponseEmail,
): Promise<AutoLinkCandidate | null> {
  const normalizedEmail = String(email).trim().toLowerCase();
  const row = await c.db
    .prepare(
      `WITH normalized AS (
         SELECT
           response_id,
           lower(trim(response_email)) AS response_email,
           submitted_at
         FROM member_responses
         WHERE response_email IS NOT NULL
           AND trim(response_email) <> ''
           AND lower(trim(response_email)) = ?1
       ),
       picked_member AS (
         SELECT MIN(taq.member_id) AS member_id
         FROM tag_assignment_queue taq
         JOIN normalized n ON n.response_id = taq.response_id
       )
       SELECT
         COALESCE(
           (SELECT member_id FROM picked_member WHERE member_id IS NOT NULL),
           ?2
         ) AS member_id,
         ?1 AS response_email,
         (SELECT response_id FROM normalized ORDER BY submitted_at DESC, response_id DESC LIMIT 1) AS current_response_id,
         (SELECT response_id FROM normalized ORDER BY submitted_at ASC, response_id ASC LIMIT 1) AS first_response_id,
         (SELECT submitted_at FROM normalized ORDER BY submitted_at DESC, response_id DESC LIMIT 1) AS last_submitted_at
       WHERE EXISTS (SELECT 1 FROM normalized)`,
    )
    .bind(normalizedEmail, `autolink:${crypto.randomUUID()}`)
    .first<AutoLinkCandidate>();
  return row;
}

export async function backfillIdentityFromCandidate(
  c: DbCtx,
  candidate: AutoLinkCandidate,
): Promise<MemberIdentityRow | null> {
  await c.db
    .prepare(
      `INSERT OR IGNORE INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))`,
    )
    .bind(
      candidate.member_id,
      candidate.response_email,
      candidate.current_response_id,
      candidate.first_response_id,
      candidate.last_submitted_at,
    )
    .run();

  return findIdentityByEmail(c, candidate.response_email as ResponseEmail);
}

export async function tryAutoLinkIdentityByEmail(
  c: DbCtx,
  email: ResponseEmail,
): Promise<MemberIdentityRow | null> {
  const existing = await findIdentityByEmail(c, email);
  if (existing) return existing;

  const candidate = await findAutoLinkCandidateByEmail(c, email);
  if (!candidate) return null;

  return backfillIdentityFromCandidate(c, candidate);
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
  currentResponseId: string,
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
