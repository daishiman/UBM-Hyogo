// member_tags + tag_definitions テーブルへの読み取り（read-only）。
// 書き込み API は新規追加禁止（不変条件 #13: タグ書き込みは tagQueueResolve workflow 経由のみ）。
// 例外として `assignTagsToMember` のみ 07a tagQueueResolve workflow 専用 helper として残置している。
// `assignTagsToMember` を tagQueueResolve workflow 以外の新規 caller から呼ぶことを禁止する。
// 直接 INSERT 経路を追加したい場合は不変条件 #13 のレビューを経ること。

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

/**
 * **tagQueueResolve workflow 専用 helper。直接呼び出し禁止。**
 *
 * 不変条件 #13（タグ書き込みは tagQueueResolve workflow 経由のみ）の例外として、
 * 07a で `apps/api/src/workflows/tagQueueResolve.ts` から `confirmed` 確定経路で呼ばれる helper。
 * これ以外の caller を追加することは禁止する。新規書き込み経路が必要な場合は、
 * `tagQueueResolve` workflow 側へ集約するか、不変条件 #13 自体の変更レビューを経ること。
 *
 * type-level の write keyword 禁止 gate（`memberTags.readonly.test-d.ts`）では
 * allow list として例外許可されている。新規 `insert*` / `update*` / `delete*` / `upsert*`
 * 接頭辞の export を追加すると type-level test が FAIL する。
 *
 * @internal tagQueueResolve workflow 以外からの呼び出しを禁止する
 */
export async function assignTagsToMember(
  c: DbCtx,
  mid: MemberId,
  tagIds: TagId[],
  assignedBy: string,
): Promise<number> {
  let applied = 0;
  for (const tagId of tagIds) {
    const result = await c.db
      .prepare(
        `INSERT INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
         VALUES (?1, ?2, 'admin_queue', 1.0, ?3)
         ON CONFLICT(member_id, tag_id) DO UPDATE SET
           source = excluded.source,
           confidence = excluded.confidence,
           assigned_at = datetime('now'),
           assigned_by = excluded.assigned_by`,
      )
      .bind(mid, tagId, assignedBy)
      .run();
    if (result.success) applied += 1;
  }
  return applied;
}

// 型エクスポート
export type { TagId };

export interface MemberTagsProvider {
  listTagsByMemberId(mid: MemberId): Promise<MemberTagWithDefinition[]>;
  listTagsByMemberIds(mids: MemberId[]): Promise<MemberTagWithDefinition[]>;
  /**
   * **tagQueueResolve workflow 専用 helper。直接呼び出し禁止。**
   * 詳細は同モジュール内 `assignTagsToMember` 関数定義の JSDoc を参照。
   * @internal
   */
  assignTagsToMember(mid: MemberId, tagIds: TagId[], assignedBy: string): Promise<number>;
}

export const createMemberTagsProvider = (c: DbCtx): MemberTagsProvider => ({
  listTagsByMemberId: (mid) => listTagsByMemberId(c, mid),
  listTagsByMemberIds: (mids) => listTagsByMemberIds(c, mids),
  assignTagsToMember: (mid, tagIds, assignedBy) =>
    assignTagsToMember(c, mid, tagIds, assignedBy),
});
