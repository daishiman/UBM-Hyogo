// response_fields テーブルへの読み取り

import type { DbCtx } from "./_shared/db";
import type { ResponseId } from "./_shared/brand";

export interface ResponseFieldRow {
  response_id: string;
  stable_key: string;
  value_json: string | null;
  raw_value_json: string | null;
}

/**
 * response_id に紐づくフィールド一覧を取得する
 */
export async function listFieldsByResponseId(
  c: DbCtx,
  rid: ResponseId,
): Promise<ResponseFieldRow[]> {
  const result = await c.db
    .prepare(
      "SELECT * FROM response_fields WHERE response_id = ?1",
    )
    .bind(rid)
    .all<ResponseFieldRow>();
  return result.results;
}
