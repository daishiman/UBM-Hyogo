// response_sections テーブルへの読み取り

import type { DbCtx } from "./_shared/db";
import type { ResponseId } from "./_shared/brand";

export interface ResponseSectionRow {
  response_id: string;
  section_key: string;
  section_title: string;
  position: number;
}

/**
 * response_id に紐づくセクション一覧を position 昇順で取得する
 */
export async function listSectionsByResponseId(
  c: DbCtx,
  rid: ResponseId,
): Promise<ResponseSectionRow[]> {
  const result = await c.db
    .prepare(
      "SELECT * FROM response_sections WHERE response_id = ?1 ORDER BY position ASC",
    )
    .bind(rid)
    .all<ResponseSectionRow>();
  return result.results;
}
