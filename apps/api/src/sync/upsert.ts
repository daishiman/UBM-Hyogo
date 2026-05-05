// u-04: member_responses への upsert を sync layer に再配置。
// 不変条件 #4: member_status の admin 列 (publish_state / is_deleted / hidden_reason) は更新句に含めない。
// member_status 側 consent 同期は本実装では行わない (member_status は member_id 主キーで sync 経路で member_id 解決を持たないため)。
// member_status の consent 列同期は別 wave (responses-sync / 03b) が担当する。本タスクは member_responses upsert に限定。

import type { MemberRow } from "../jobs/mappers/sheets-to-members";

const UPSERT_COLUMNS = [
  "response_id",
  "form_id",
  "revision_id",
  "schema_hash",
  "response_email",
  "submitted_at",
  "answers_json",
  "raw_answers_json",
  "extra_fields_json",
  "unmapped_question_ids_json",
] as const;

function buildUpsertSql(): string {
  const placeholders = UPSERT_COLUMNS.map((_, i) => `?${i + 1}`).join(", ");
  const updateAssignments = UPSERT_COLUMNS.filter((c) => c !== "response_id")
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");
  return `INSERT INTO member_responses (${UPSERT_COLUMNS.join(", ")})
VALUES (${placeholders})
ON CONFLICT(response_id) DO UPDATE SET ${updateAssignments}`;
}

function answersJson(row: MemberRow): string {
  return JSON.stringify({
    fullName: row.fullName,
    nickname: row.nickname,
    location: row.location,
    birthDate: row.birthDate,
    occupation: row.occupation,
    hometown: row.hometown,
    ubmZone: row.ubmZone,
    ubmMembershipType: row.ubmMembershipType,
    ubmJoinDate: row.ubmJoinDate,
    businessOverview: row.businessOverview,
    skills: row.skills,
    challenges: row.challenges,
    canProvide: row.canProvide,
    hobbies: row.hobbies,
    recentInterest: row.recentInterest,
    motto: row.motto,
    otherActivities: row.otherActivities,
    urlWebsite: row.urlWebsite,
    urlFacebook: row.urlFacebook,
    urlInstagram: row.urlInstagram,
    urlThreads: row.urlThreads,
    urlYoutube: row.urlYoutube,
    urlTiktok: row.urlTiktok,
    urlX: row.urlX,
    urlBlog: row.urlBlog,
    urlNote: row.urlNote,
    urlLinkedin: row.urlLinkedin,
    urlOthers: row.urlOthers,
    selfIntroduction: row.selfIntroduction,
    publicConsent: row.publicConsent,
    rulesConsent: row.rulesConsent,
  });
}

function bindingsOf(row: MemberRow): unknown[] {
  return [
    row.responseId,
    "google-sheets",
    "u-04",
    "u-04-sheets",
    row.responseEmail,
    row.submittedAt,
    answersJson(row),
    answersJson(row),
    row.extraFieldsJson ?? "{}",
    row.unmappedQuestionIdsJson ?? "[]",
  ];
}

export function buildUpsertStatements(
  db: D1Database,
  rows: readonly MemberRow[],
): D1PreparedStatement[] {
  if (rows.length === 0) return [];
  const sql = buildUpsertSql();
  return rows.map((row) => db.prepare(sql).bind(...bindingsOf(row)));
}

export async function upsertMemberResponses(
  db: D1Database,
  rows: readonly MemberRow[],
): Promise<void> {
  if (rows.length === 0) return;
  await db.batch(buildUpsertStatements(db, rows));
}

export function buildTruncateStatements(db: D1Database): D1PreparedStatement[] {
  return [
    db.prepare("DELETE FROM member_responses"),
  ];
}
