import type { DbCtx } from "./_shared/db";
import type { StableKey } from "./_shared/brand";
import { asStableKey } from "./_shared/brand";

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
 * 03a sync 用: question_id → 既存 stable_key を引く（既存 alias 取り込み源）。
 * 'unknown' は alias 未確定として扱い null 返却。
 * AC-3: alias 確定後の sync で stableKey を温存するために使用。
 */
export async function findStableKeyByQuestionId(
  c: DbCtx,
  questionId: string,
): Promise<string | null> {
  const r = await c.db
    .prepare(
      "SELECT stable_key FROM schema_questions WHERE question_id = ? ORDER BY revision_id DESC LIMIT 1",
    )
    .bind(questionId)
    .first<{ stable_key: string }>();
  if (!r) return null;
  if (r.stable_key === "unknown") return null;
  return r.stable_key;
}

export async function updateStableKey(
  c: DbCtx,
  questionId: string,
  newStableKey: StableKey,
  revisionId?: string,
): Promise<void> {
  if (revisionId) {
    await c.db
      .prepare(
        "UPDATE schema_questions SET stable_key = ? WHERE question_id = ? AND revision_id = ?",
      )
      .bind(newStableKey, questionId, revisionId)
      .run();
    return;
  }
  await c.db
    .prepare("UPDATE schema_questions SET stable_key = ? WHERE question_id = ?")
    .bind(newStableKey, questionId)
    .run();
}
