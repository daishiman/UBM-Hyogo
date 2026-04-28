// member_status テーブルおよび deleted_members テーブルへの CRUD
// admin 用 setter は setPublishState / setDeleted のみ（不変条件 #11）

import type { DbCtx } from "./_shared/db";
import type { MemberId, AdminId } from "./_shared/brand";
import type { ConsentStatus, PublishState } from "@ubm-hyogo/shared";
import { placeholders } from "./_shared/sql";

export interface MemberStatusRow {
  member_id: string;
  public_consent: string;
  rules_consent: string;
  publish_state: string;
  is_deleted: number;
  hidden_reason: string | null;
  last_notified_at: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface DeletedMemberRow {
  member_id: string;
  deleted_by: string;
  deleted_at: string;
  reason: string;
}

/**
 * member_id で status を取得する
 */
export async function getStatus(
  c: DbCtx,
  id: MemberId,
): Promise<MemberStatusRow | null> {
  return c.db
    .prepare(
      "SELECT * FROM member_status WHERE member_id = ?1 LIMIT 1",
    )
    .bind(id)
    .first<MemberStatusRow>();
}

/**
 * 複数 member_id の status を一括取得する
 */
export async function listStatusesByMemberIds(
  c: DbCtx,
  ids: MemberId[],
): Promise<MemberStatusRow[]> {
  if (ids.length === 0) return [];
  const ph = placeholders(ids.length);
  const result = await c.db
    .prepare(`SELECT * FROM member_status WHERE member_id IN (${ph})`)
    .bind(...ids)
    .all<MemberStatusRow>();
  return result.results;
}

/**
 * 同意状態のスナップショットを更新する
 * フォーム回答から取得した同意状態を記録する
 */
export async function setConsentSnapshot(
  c: DbCtx,
  id: MemberId,
  publicConsent: ConsentStatus,
  rulesConsent: ConsentStatus,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT INTO member_status (member_id, public_consent, rules_consent, updated_at)
       VALUES (?1, ?2, ?3, datetime('now'))
       ON CONFLICT(member_id) DO UPDATE SET
         public_consent = excluded.public_consent,
         rules_consent = excluded.rules_consent,
         updated_at = datetime('now')`,
    )
    .bind(id, publicConsent, rulesConsent)
    .run();
}

/**
 * 公開状態を管理者が変更する（不変条件 #11: admin 用 setter）
 */
export async function setPublishState(
  c: DbCtx,
  id: MemberId,
  state: PublishState,
  updatedBy: AdminId,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT INTO member_status (member_id, publish_state, updated_by, updated_at)
       VALUES (?1, ?2, ?3, datetime('now'))
       ON CONFLICT(member_id) DO UPDATE SET
         publish_state = excluded.publish_state,
         updated_by = excluded.updated_by,
         updated_at = datetime('now')`,
    )
    .bind(id, state, updatedBy)
    .run();
}

/**
 * 会員を論理削除する（不変条件 #11: admin 用 setter）
 * member_status.is_deleted を 1 に設定し、deleted_members に記録する
 */
export async function setDeleted(
  c: DbCtx,
  id: MemberId,
  deletedBy: AdminId,
  reason: string,
): Promise<void> {
  // member_status を論理削除状態に更新
  await c.db
    .prepare(
      `INSERT INTO member_status (member_id, is_deleted, updated_by, updated_at)
       VALUES (?1, 1, ?2, datetime('now'))
       ON CONFLICT(member_id) DO UPDATE SET
         is_deleted = 1,
         updated_by = excluded.updated_by,
         updated_at = datetime('now')`,
    )
    .bind(id, deletedBy)
    .run();

  // deleted_members に記録
  await c.db
    .prepare(
      `INSERT INTO deleted_members (member_id, deleted_by, deleted_at, reason)
       VALUES (?1, ?2, datetime('now'), ?3)
       ON CONFLICT(member_id) DO UPDATE SET
         deleted_by = excluded.deleted_by,
         deleted_at = datetime('now'),
         reason = excluded.reason`,
    )
    .bind(id, deletedBy, reason)
    .run();
}
