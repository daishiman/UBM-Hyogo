// member_tags + tag_definitions テーブルへのアクセス。
//
// 不変条件 #13（2026-06 第3経路追加 / issue-1036。2026-05 再定義 / issue-982）:
//   - 第1経路: AI / Google Form 由来の tag「提案」は tagQueueResolve workflow の resolve 経由で
//     承認する（`assignTagsToMember` がその専用 helper。tagQueueResolve workflow 以外からの
//     呼び出し禁止）。
//   - 第2経路: 管理者による単一 member の tag「手動付与 / 解除」は admin manual 経路として
//     `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` を使い、必ず audit
//     （admin.member.tag_assigned / admin.member.tag_unassigned）を記録する。
//   - 第3経路: 管理者による bulk（複数 member × 複数 tag）の「手動付与 / 解除」は
//     `bulkApplyMemberTagsByAdmin` を使う。実 mutation した member×tag 単位で必ず audit
//     （admin.member.tag_assigned / tag_unassigned・第2経路と action 名 parity）を記録し、
//     after_json / before_json に batchId を埋めて bulk 相関を残す（audit_log に correlation_id
//     列は無いため）。
//   - member_tags への直接 write は上記 3 経路に限り許可する。それ以外の新規 write 経路を
//     生やす場合は不変条件 #13 自体の変更レビューと type-level gate
//     （`memberTags.readonly.test-d.ts`）allow list 更新を経ること。
//
// read 関数（list* / get* / find*）は read-only であり gate 対象外。

import type { DbCtx } from "./_shared/db";
import type { MemberId, TagId, AdminId, AdminEmail } from "./_shared/brand";
import { placeholders } from "./_shared/sql";

/**
 * drawer / admin manual 経路が扱う tag 参照。`tagId`（tag_definitions.tag_id）を正本識別子とし、
 * `code`（UNIQUE）は表示・既存 detail view との parity 用に併せて返す。
 */
export interface TagRef {
  tagId: string;
  code: string;
  label: string;
  category: string;
}

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

// ---------------------------------------------------------------------------
// admin manual 経路（不変条件 #13 再定義 / issue-982）
//   `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` は管理者の手動
//   キュレーション専用。route 側（/admin/members/:memberId/tags）から audit 付きで呼ぶ。
//   tagQueueResolve workflow から呼ぶことは禁止（提案承認は `assignTagsToMember`）。
// ---------------------------------------------------------------------------

const tagRefFromRow = (r: {
  tag_id: string;
  code: string;
  label: string;
  category: string;
}): TagRef => ({
  tagId: r.tag_id,
  code: r.code,
  label: r.label,
  category: r.category,
});

/**
 * drawer の選択肢となる active な tag master 全件を返す（`ALL_TAGS` ハードコード置換用 read 経路）。
 */
export async function getTagDefinitionMaster(c: DbCtx): Promise<TagRef[]> {
  const result = await c.db
    .prepare(
      `SELECT tag_id, code, label, category
       FROM tag_definitions
       WHERE active = 1
       ORDER BY category ASC, label ASC`,
    )
    .all<{ tag_id: string; code: string; label: string; category: string }>();
  return result.results.map(tagRefFromRow);
}

/**
 * 当該 member に付与済みの active な tag 一覧を返す。
 */
export async function listAssignedTagsForMember(
  c: DbCtx,
  mid: MemberId,
): Promise<TagRef[]> {
  const result = await c.db
    .prepare(
      `SELECT td.tag_id, td.code, td.label, td.category
       FROM member_tags mt
       JOIN tag_definitions td ON td.tag_id = mt.tag_id
       WHERE mt.member_id = ?1 AND td.active = 1
       ORDER BY td.category ASC, td.label ASC`,
    )
    .bind(mid)
    .all<{ tag_id: string; code: string; label: string; category: string }>();
  return result.results.map(tagRefFromRow);
}

/**
 * tag master を tag_id で 1 件取得する。存在しなければ null。
 */
export async function findTagDefinitionById(
  c: DbCtx,
  tagId: string,
): Promise<TagRef | null> {
  const row = await c.db
    .prepare(
      `SELECT tag_id, code, label, category
       FROM tag_definitions
       WHERE tag_id = ?1 AND active = 1`,
    )
    .bind(tagId)
    .first<{ tag_id: string; code: string; label: string; category: string }>();
  return row ? tagRefFromRow(row) : null;
}

/**
 * 管理者による手動付与。PK `(member_id, tag_id)` の `INSERT OR IGNORE` で冪等。
 * 新規付与なら true（`meta.changes > 0`）、既存（no-op）なら false を返す。
 * 呼び出し側はこの戻り値で audit を増やすか判定する。
 */
export async function assignTagToMemberByAdmin(
  c: DbCtx,
  mid: MemberId,
  tagId: string,
  assignedBy: string,
): Promise<boolean> {
  const result = await c.db
    .prepare(
      `INSERT OR IGNORE INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
       VALUES (?1, ?2, 'manual', NULL, ?3)`,
    )
    .bind(mid, tagId, assignedBy)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/**
 * 管理者による手動解除。削除行があれば true、無ければ false（冪等。`meta.changes > 0`）。
 */
export async function unassignTagFromMemberByAdmin(
  c: DbCtx,
  mid: MemberId,
  tagId: string,
): Promise<boolean> {
  const result = await c.db
    .prepare(`DELETE FROM member_tags WHERE member_id = ?1 AND tag_id = ?2`)
    .bind(mid, tagId)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/**
 * member_status.is_deleted を返す。member 不在（member_identities にも無い）なら null、
 * member_status 行が無い（在籍だが status 未設定）場合は false 扱い。
 */
export async function getMemberDeletedFlag(
  c: DbCtx,
  mid: MemberId,
): Promise<boolean | null> {
  const identity = await c.db
    .prepare(`SELECT 1 AS found FROM member_identities WHERE member_id = ?1`)
    .bind(mid)
    .first<{ found: number }>();
  if (identity === null) return null;
  const status = await c.db
    .prepare(`SELECT is_deleted FROM member_status WHERE member_id = ?1`)
    .bind(mid)
    .first<{ is_deleted: number }>();
  return status?.is_deleted === 1;
}

// ---------------------------------------------------------------------------
// 不変条件 #13 第3経路（bulk admin manual write / issue-1036）
//   複数 member × 複数 tag を直積で assign/unassign する。route 側（POST /admin/members/tags/bulk）
//   から呼び、実 mutation（assigned/unassigned）した item ごとに audit を append する。
// ---------------------------------------------------------------------------

export type BulkTagOp = "assign" | "unassign";

export type BulkTagItemStatus =
  | "assigned" // assign で新規 INSERT（meta.changes > 0）
  | "unassigned" // unassign で実 DELETE（meta.changes > 0）
  | "noop" // assign で既存 / unassign で未存在（changes = 0・冪等・AC-5）
  | "skipped_deleted" // member が書き込み対象外（is_deleted=1 または member 不在・AC-4）
  | "tag_not_found"; // tag_definitions.active = 1 に該当なし（AC-2）

export interface BulkTagOpResultItem {
  readonly memberId: string;
  readonly tagId: string;
  readonly status: BulkTagItemStatus;
}

export interface BulkApplyMemberTagsResult {
  readonly batchId: string;
  readonly results: ReadonlyArray<BulkTagOpResultItem>;
}

/**
 * 不変条件 #13 第3経路（bulk admin manual write）。
 * 複数 member × 複数 tag を直積で assign/unassign する。
 * - 書き込み対象外 member（is_deleted=1 / 不在）は skipped_deleted で skip し他 member は継続（AC-4）
 * - 未登録 / inactive tag は tag_not_found（AC-2）
 * - assign は INSERT OR IGNORE（複合 PK 自然冪等）、unassign は DELETE
 * - changes=0 は noop（再送冪等・AC-5・#913 非依存）
 * - audit は route 側で実 mutation（assigned/unassigned）した item だけ append する（AC-3）。
 *   bulk 相関のため戻り値の batchId を audit after_json/before_json に埋める。
 *
 * tag master active set と member 書き込み可否を事前に 1 クエリずつ一括取得して N+1 を回避する。
 * 部分成功レポート（AC-2）と「実 mutation のみ audit」（AC-3）を両立するため D1 `db.batch()`
 * （all-or-nothing）は使わず、既存 `assignTagToMemberByAdmin` と同じ逐次 loop で実装する。
 */
export async function bulkApplyMemberTagsByAdmin(
  c: DbCtx,
  input: { memberIds: MemberId[]; tagIds: string[]; op: BulkTagOp },
  actor: { id: AdminId | null; email: AdminEmail | null },
): Promise<BulkApplyMemberTagsResult> {
  const batchId = crypto.randomUUID();
  const results: BulkTagOpResultItem[] = [];

  // 重複 memberId / tagId は dedupe（同一 item の二重評価を防ぐ）
  const memberIds = [...new Set(input.memberIds)];
  const tagIds = [...new Set(input.tagIds)];
  if (memberIds.length === 0 || tagIds.length === 0) {
    return { batchId, results };
  }

  // (1) active tag master set を 1 クエリで取得
  const master = await getTagDefinitionMaster(c);
  const activeTagIds = new Set(master.map((t) => t.tagId));

  // (2) member 存在 + is_deleted を 1 クエリ一括取得 → 書き込み可能 member の Set
  const ph = placeholders(memberIds.length);
  const rows = await c.db
    .prepare(
      `SELECT mi.member_id AS member_id,
              COALESCE(ms.is_deleted, 0) AS is_deleted
       FROM member_identities mi
       LEFT JOIN member_status ms ON ms.member_id = mi.member_id
       WHERE mi.member_id IN (${ph})`,
    )
    .bind(...memberIds)
    .all<{ member_id: string; is_deleted: number }>();
  const writable = new Set(
    rows.results.filter((r) => r.is_deleted !== 1).map((r) => r.member_id),
  );

  const assignedBy: string = actor.email ?? "system";

  // (3) memberId × tagId 直積 loop。member skip を tag 評価より先に判定する。
  for (const memberId of memberIds) {
    if (!writable.has(memberId)) {
      for (const tagId of tagIds) {
        results.push({ memberId, tagId, status: "skipped_deleted" });
      }
      continue;
    }
    for (const tagId of tagIds) {
      if (!activeTagIds.has(tagId)) {
        results.push({ memberId, tagId, status: "tag_not_found" });
        continue;
      }
      if (input.op === "assign") {
        const changed = await assignTagToMemberByAdmin(c, memberId, tagId, assignedBy);
        results.push({ memberId, tagId, status: changed ? "assigned" : "noop" });
      } else {
        const changed = await unassignTagFromMemberByAdmin(c, memberId, tagId);
        results.push({ memberId, tagId, status: changed ? "unassigned" : "noop" });
      }
    }
  }

  return { batchId, results };
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
