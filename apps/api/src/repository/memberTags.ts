// member_tags + tag_definitions テーブルへの読み取り（read-only）
// 書き込み API は提供しない（不変条件: タグは rule/ai/manual で管理される）

import type { DbCtx } from "./_shared/db";
import type { MemberId, TagId } from "./_shared/brand";
import { placeholders } from "./_shared/sql";

export interface MemberTagWithDefinition {
  member_id: string;
  tag_id: string;
  source: string;
  confidence: number | null;
  assigned_at: string;
  assigned_by: string | null;
  // tag_definitions のカラム
  code: string;
  label: string;
  category: string;
  source_stable_keys_json: string;
  active: number;
}

/**
 * member_id のタグ一覧を tag_definitions JOIN で取得する
 */
export async function listTagsByMemberId(
  c: DbCtx,
  mid: MemberId,
): Promise<MemberTagWithDefinition[]> {
  const result = await c.db
    .prepare(
      `SELECT mt.*, td.code, td.label, td.category, td.source_stable_keys_json, td.active
       FROM member_tags mt
       JOIN tag_definitions td ON td.tag_id = mt.tag_id
       WHERE mt.member_id = ?1 AND td.active = 1`,
    )
    .bind(mid)
    .all<MemberTagWithDefinition>();
  return result.results;
}

/**
 * 複数 member_id のタグをバッチ取得する
 */
export async function listTagsByMemberIds(
  c: DbCtx,
  mids: MemberId[],
): Promise<MemberTagWithDefinition[]> {
  if (mids.length === 0) return [];
  const ph = placeholders(mids.length);
  const result = await c.db
    .prepare(
      `SELECT mt.*, td.code, td.label, td.category, td.source_stable_keys_json, td.active
       FROM member_tags mt
       JOIN tag_definitions td ON td.tag_id = mt.tag_id
       WHERE mt.member_id IN (${ph}) AND td.active = 1`,
    )
    .bind(...mids)
    .all<MemberTagWithDefinition>();
  return result.results;
}

// 型エクスポート
export type { TagId };
