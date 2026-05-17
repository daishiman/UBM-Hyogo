import type { DbCtx } from "./_shared/db";
import type { StableKey } from "./_shared/brand";
import { asStableKey } from "./_shared/brand";
import { findAliasByQuestionId } from "./schemaAliases";

export type FieldKind = string;
export type FieldVisibility = "public" | "members_only" | "admin_only";
export type FieldStatus = "active" | "inactive" | "deprecated";

export interface FormFieldRow {
  questionPk: string;
  revisionId: string;
  stableKey: StableKey;
  questionId: string | null;
  itemId: string | null;
  sectionKey: string;
  sectionTitle: string;
  label: string;
  kind: FieldKind;
  position: number;
  required: boolean;
  visibility: FieldVisibility;
  searchable: boolean;
  status: FieldStatus;
  choiceLabelsJson: string;
}

export interface NewFormFieldRow {
  questionPk: string;
  revisionId: string;
  stableKey: StableKey;
  questionId: string | null;
  itemId: string | null;
  sectionKey: string;
  sectionTitle: string;
  label: string;
  kind: FieldKind;
  position: number;
  required: boolean;
  visibility: FieldVisibility;
  searchable: boolean;
  status: FieldStatus;
  choiceLabelsJson: string;
}

interface DbRow {
  question_pk: string;
  revision_id: string;
  stable_key: string;
  question_id: string | null;
  item_id: string | null;
  section_key: string;
  section_title: string;
  label: string;
  kind: string;
  position: number;
  required: number;
  visibility: FieldVisibility;
  searchable: number;
  status: FieldStatus;
  choice_labels_json: string;
}

const map = (r: DbRow): FormFieldRow => ({
  questionPk: r.question_pk,
  revisionId: r.revision_id,
  stableKey: asStableKey(r.stable_key),
  questionId: r.question_id,
  itemId: r.item_id,
  sectionKey: r.section_key,
  sectionTitle: r.section_title,
  label: r.label,
  kind: r.kind,
  position: r.position,
  required: r.required === 1,
  visibility: r.visibility,
  searchable: r.searchable === 1,
  status: r.status,
  choiceLabelsJson: r.choice_labels_json,
});

const SELECT_COLS =
  "SELECT question_pk, revision_id, stable_key, question_id, item_id, section_key, section_title, label, kind, position, required, visibility, searchable, status, choice_labels_json FROM schema_questions";

export async function listFieldsByVersion(
  c: DbCtx,
  _formId: string,
  revisionId: string,
): Promise<FormFieldRow[]> {
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE revision_id = ? ORDER BY position ASC`)
    .bind(revisionId)
    .all<DbRow>();
  return (r.results ?? []).map(map);
}

export async function findFieldByStableKey(c: DbCtx, stableKey: StableKey): Promise<FormFieldRow | null> {
  const r = await c.db.prepare(`${SELECT_COLS} WHERE stable_key = ?`).bind(stableKey).first<DbRow>();
  return r ? map(r) : null;
}

export async function upsertField(c: DbCtx, row: NewFormFieldRow): Promise<FormFieldRow> {
  await c.db
    .prepare(
      "INSERT OR REPLACE INTO schema_questions (question_pk, revision_id, stable_key, question_id, item_id, section_key, section_title, label, kind, position, required, visibility, searchable, status, choice_labels_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      row.questionPk,
      row.revisionId,
      row.stableKey,
      row.questionId,
      row.itemId,
      row.sectionKey,
      row.sectionTitle,
      row.label,
      row.kind,
      row.position,
      row.required ? 1 : 0,
      row.visibility,
      row.searchable ? 1 : 0,
      row.status,
      row.choiceLabelsJson,
    )
    .run();
  const r = await c.db.prepare(`${SELECT_COLS} WHERE question_pk = ?`).bind(row.questionPk).first<DbRow>();
  if (!r) throw new Error(`upsertField failed for ${row.questionPk}`);
  return map(r);
}

/**
 * 03a sync 用: question_id → 既存 stable_key を引く（alias-only 解決）。
 * issue-299: schema_aliases への 100% 移行完了に伴い、schema_questions.stable_key
 * SELECT fallback を廃止。alias miss は unresolved として null を返す。
 */
export async function findStableKeyByQuestionId(
  c: DbCtx,
  questionId: string,
): Promise<string | null> {
  const alias = await findAliasByQuestionId(c, questionId);
  if (alias) return alias.stableKey;
  return null;
}
