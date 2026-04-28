// member_responses テーブルへの CRUD
// 不変条件 #4: partial update 禁止、upsert のみ

import type { DbCtx } from "./_shared/db";
import type { MemberId, ResponseId, ResponseEmail } from "./_shared/brand";
import { placeholders } from "./_shared/sql";

export interface MemberResponseRow {
  response_id: string;
  form_id: string;
  revision_id: string;
  schema_hash: string;
  response_email: string | null;
  submitted_at: string;
  edit_response_url: string | null;
  answers_json: string;
  raw_answers_json: string;
  extra_fields_json: string;
  unmapped_question_ids_json: string;
  search_text: string;
}

export interface UpsertResponseInput {
  responseId: ResponseId;
  formId: string;
  revisionId: string;
  schemaHash: string;
  responseEmail: ResponseEmail | null;
  submittedAt: string;
  editResponseUrl: string | null;
  answersJson: string;
  rawAnswersJson: string;
  extraFieldsJson: string;
  unmappedQuestionIdsJson: string;
  searchText: string;
}

/**
 * response_id で回答を取得する
 */
export async function findResponseById(
  c: DbCtx,
  rid: ResponseId,
): Promise<MemberResponseRow | null> {
  return c.db
    .prepare(
      "SELECT * FROM member_responses WHERE response_id = ?1 LIMIT 1",
    )
    .bind(rid)
    .first<MemberResponseRow>();
}

/**
 * 複数 response_id の回答を一括取得する
 */
export async function listResponsesByIds(
  c: DbCtx,
  ids: ResponseId[],
): Promise<MemberResponseRow[]> {
  if (ids.length === 0) return [];
  const ph = placeholders(ids.length);
  const result = await c.db
    .prepare(`SELECT * FROM member_responses WHERE response_id IN (${ph})`)
    .bind(...ids)
    .all<MemberResponseRow>();
  return result.results;
}

/**
 * member_id の現在の回答を取得する（member_identities JOIN）
 */
export async function findCurrentResponse(
  c: DbCtx,
  mid: MemberId,
): Promise<MemberResponseRow | null> {
  return c.db
    .prepare(
      `SELECT mr.*
       FROM member_responses mr
       JOIN member_identities mi ON mi.current_response_id = mr.response_id
       WHERE mi.member_id = ?1
       LIMIT 1`,
    )
    .bind(mid)
    .first<MemberResponseRow>();
}

/**
 * email に紐づく全回答を最新順で一覧取得する（ページネーション付き）
 */
export async function listResponsesByEmail(
  c: DbCtx,
  email: ResponseEmail,
  limit = 20,
  offset = 0,
): Promise<MemberResponseRow[]> {
  const result = await c.db
    .prepare(
      `SELECT * FROM member_responses
       WHERE response_email = ?1
       ORDER BY submitted_at DESC
       LIMIT ?2 OFFSET ?3`,
    )
    .bind(email, limit, offset)
    .all<MemberResponseRow>();
  return result.results;
}

/**
 * 回答を upsert する（不変条件 #4: partial update 禁止）
 * response_id が存在する場合は全フィールドを更新する
 */
export async function upsertResponse(
  c: DbCtx,
  row: UpsertResponseInput,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT INTO member_responses
        (response_id, form_id, revision_id, schema_hash, response_email,
         submitted_at, edit_response_url, answers_json, raw_answers_json,
         extra_fields_json, unmapped_question_ids_json, search_text)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
       ON CONFLICT(response_id) DO UPDATE SET
         form_id = excluded.form_id,
         revision_id = excluded.revision_id,
         schema_hash = excluded.schema_hash,
         response_email = excluded.response_email,
         submitted_at = excluded.submitted_at,
         edit_response_url = excluded.edit_response_url,
         answers_json = excluded.answers_json,
         raw_answers_json = excluded.raw_answers_json,
         extra_fields_json = excluded.extra_fields_json,
         unmapped_question_ids_json = excluded.unmapped_question_ids_json,
         search_text = excluded.search_text`,
    )
    .bind(
      row.responseId,
      row.formId,
      row.revisionId,
      row.schemaHash,
      row.responseEmail,
      row.submittedAt,
      row.editResponseUrl,
      row.answersJson,
      row.rawAnswersJson,
      row.extraFieldsJson,
      row.unmappedQuestionIdsJson,
      row.searchText,
    )
    .run();
}
