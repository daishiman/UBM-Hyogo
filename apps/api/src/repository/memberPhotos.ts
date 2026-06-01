// issue-983: member_photos 表への CRUD repository。
// invariant #4: Google Form schema 外データ（admin-managed）を分離して扱う。
// invariant #5: D1 アクセスは apps/api に閉じる。
import type { DbCtx } from "./_shared/db";
import type { MemberId } from "./_shared/brand";

export interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
}

interface RawMemberPhotoRow {
  member_id: string;
  object_key: string;
  content_type: string;
  byte_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

/** member_photos から 1 行取得。存在しない場合 null。 */
export async function getMemberPhoto(
  c: DbCtx,
  memberId: MemberId,
): Promise<MemberPhotoRow | null> {
  const row = await c.db
    .prepare(
      `SELECT member_id, object_key, content_type, byte_size, uploaded_by, uploaded_at
       FROM member_photos WHERE member_id = ?1`,
    )
    .bind(memberId)
    .first<RawMemberPhotoRow>();
  if (!row) return null;
  return {
    memberId: row.member_id,
    objectKey: row.object_key,
    contentType: row.content_type,
    byteSize: row.byte_size,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

/**
 * issue-1029: 複数 member の object_key を 1 query で取得（public list の N+1 防止）。
 * 空配列は SQL 非発行で空 Map。未登録 id は Map に含めない。
 */
export async function listMemberPhotosByIds(
  c: DbCtx,
  memberIds: readonly string[],
): Promise<Map<string, string>> {
  if (memberIds.length === 0) return new Map();
  const ph = memberIds.map(() => "?").join(", ");
  const r = await c.db
    .prepare(`SELECT member_id, object_key FROM member_photos WHERE member_id IN (${ph})`)
    .bind(...memberIds)
    .all<{ member_id: string; object_key: string }>();
  const map = new Map<string, string>();
  for (const row of r.results ?? []) map.set(row.member_id, row.object_key);
  return map;
}

/** member_photos を INSERT OR REPLACE（upsert = 1 member 1 photo 上書き保存）する。 */
export async function upsertMemberPhoto(
  c: DbCtx,
  row: Omit<MemberPhotoRow, "uploadedAt">,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT OR REPLACE INTO member_photos
       (member_id, object_key, content_type, byte_size, uploaded_by, uploaded_at)
       VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))`,
    )
    .bind(row.memberId, row.objectKey, row.contentType, row.byteSize, row.uploadedBy)
    .run();
}

/** member_photos から 1 行削除する。 */
export async function deleteMemberPhoto(
  c: DbCtx,
  memberId: MemberId,
): Promise<void> {
  await c.db
    .prepare(`DELETE FROM member_photos WHERE member_id = ?1`)
    .bind(memberId)
    .run();
}
