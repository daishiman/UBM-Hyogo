// response_fields テーブルへの読み書き
// 03b: known stableKey と unknown raw_question_id の両方を扱う

import type { DbCtx } from "./_shared/db";
import type { ResponseId, StableKey } from "./_shared/brand";

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

/**
 * known stableKey の field を upsert する（03b sync 用）
 */
export async function upsertKnownField(
  c: DbCtx,
  rid: ResponseId,
  stableKey: StableKey,
  valueJson: string | null,
  rawValueJson: string | null,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(response_id, stable_key) DO UPDATE SET
         value_json = excluded.value_json,
         raw_value_json = excluded.raw_value_json`,
    )
    .bind(rid, stableKey, valueJson, rawValueJson)
    .run();
}

/**
 * unknown raw_question_id の field を extra として upsert する（03b sync 用）
 *
 * stable_key には `__extra__:<questionId>` を使い、known stableKey と衝突しない。
 * raw_value_json に raw answer payload を JSON 文字列で保存する。
 */
export async function upsertExtraField(
  c: DbCtx,
  rid: ResponseId,
  rawQuestionId: string,
  rawValueJson: string | null,
): Promise<void> {
  const extraKey = `__extra__:${rawQuestionId}`;
  await c.db
    .prepare(
      `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
       VALUES (?1, ?2, NULL, ?3)
       ON CONFLICT(response_id, stable_key) DO UPDATE SET
         raw_value_json = excluded.raw_value_json`,
    )
    .bind(rid, extraKey, rawValueJson)
    .run();
}
