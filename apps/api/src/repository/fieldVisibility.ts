// member_field_visibility テーブルへの CRUD

import type { DbCtx } from "./_shared/db";
import type { MemberId, StableKey } from "./_shared/brand";
import type { FieldVisibility } from "@ubm-hyogo/shared";

export interface MemberFieldVisibilityRow {
  member_id: string;
  stable_key: string;
  visibility: string;
  updated_at: string;
}

/**
 * member_id の全フィールド可視性設定を取得する
 */
export async function listVisibilityByMemberId(
  c: DbCtx,
  mid: MemberId,
): Promise<MemberFieldVisibilityRow[]> {
  const result = await c.db
    .prepare(
      "SELECT * FROM member_field_visibility WHERE member_id = ?1",
    )
    .bind(mid)
    .all<MemberFieldVisibilityRow>();
  return result.results;
}

/**
 * 特定フィールドの可視性を設定する（upsert）
 */
export async function setVisibility(
  c: DbCtx,
  mid: MemberId,
  sk: StableKey,
  visibility: FieldVisibility,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT INTO member_field_visibility (member_id, stable_key, visibility, updated_at)
       VALUES (?1, ?2, ?3, datetime('now'))
       ON CONFLICT(member_id, stable_key) DO UPDATE SET
         visibility = excluded.visibility,
         updated_at = datetime('now')`,
    )
    .bind(mid, sk, visibility)
    .run();
}
