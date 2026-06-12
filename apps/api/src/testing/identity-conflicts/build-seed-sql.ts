import { STABLE_KEY } from "@ubm-hyogo/shared";

import {
  IDENTITY_CONFLICT_SEED_ACTOR,
  identityConflictSeedCatalog,
  type IdentityConflictSeedCatalog,
  type IdentityConflictSeedMember,
} from "./catalog.ts";

const RESPONSE_FIELD_KEYS = [
  STABLE_KEY.fullName,
  STABLE_KEY.occupation,
  STABLE_KEY.ubmZone,
  STABLE_KEY.location,
  STABLE_KEY.businessOverview,
  STABLE_KEY.selfIntroduction,
] as const;

type ResponseFieldKey = (typeof RESPONSE_FIELD_KEYS)[number];

const FIELD_LABELS: Record<ResponseFieldKey, string> = {
  [STABLE_KEY.fullName]: "お名前（フルネーム）",
  [STABLE_KEY.occupation]: "職業・仕事内容",
  [STABLE_KEY.ubmZone]: "UBM区画",
  [STABLE_KEY.location]: "お住まい",
  [STABLE_KEY.businessOverview]: "ビジネス概要",
  [STABLE_KEY.selfIntroduction]: "自己紹介・一言メッセージ",
};

const sqlString = (value: string): string => `'${value.replaceAll("'", "''")}'`;
const sqlNullableString = (value: string | null | undefined): string =>
  value == null ? "NULL" : sqlString(value);
const sqlNumber = (value: number | boolean): string => String(Number(value));
const sqlJson = (value: unknown): string => sqlString(JSON.stringify(value));
const values = (row: readonly string[]): string => `(${row.join(", ")})`;

const buildInsert = (
  table: string,
  columns: readonly string[],
  rows: readonly (readonly string[])[],
  verb = "INSERT OR REPLACE",
): string => {
  if (rows.length === 0) return "";
  return `${verb} INTO ${table} (${columns.join(", ")}) VALUES\n  ${rows.map(values).join(",\n  ")};`;
};

const answersFor = (member: IdentityConflictSeedMember): Record<ResponseFieldKey, string> => ({
  [STABLE_KEY.fullName]: member.fullName,
  [STABLE_KEY.occupation]: member.occupation,
  [STABLE_KEY.ubmZone]: member.ubmZone,
  [STABLE_KEY.location]: member.location,
  [STABLE_KEY.businessOverview]: member.businessOverview,
  [STABLE_KEY.selfIntroduction]: member.selfIntroduction,
});

const searchTextFor = (member: IdentityConflictSeedMember): string =>
  [member.fullName, member.occupation, member.ubmZone, member.email, member.location].join(" ");

const schemaQuestionRows = (catalog: IdentityConflictSeedCatalog): string[][] =>
  RESPONSE_FIELD_KEYS.map((stableKey, index) => [
    sqlString(`${catalog.revisionId}:${stableKey}`),
    sqlString(catalog.revisionId),
    sqlString(stableKey),
    sqlString(`TEST-DUP-Q-${String(index + 1).padStart(2, "0")}`),
    sqlString(`TEST-DUP-ITEM-${String(index + 1).padStart(2, "0")}`),
    sqlString(index < 3 ? "basic_profile" : "message"),
    sqlString(index < 3 ? "基本プロフィール" : "メッセージ"),
    sqlString(FIELD_LABELS[stableKey]),
    sqlString(stableKey === STABLE_KEY.businessOverview || stableKey === STABLE_KEY.selfIntroduction ? "paragraph" : "shortText"),
    sqlNumber(index + 1),
    sqlNumber(stableKey === STABLE_KEY.fullName || stableKey === STABLE_KEY.occupation),
    sqlString("public"),
    "1",
    sqlString("active"),
    sqlJson([]),
  ]);

const responseFieldRows = (catalog: IdentityConflictSeedCatalog): string[][] =>
  catalog.members.flatMap((member) => {
    const answers = answersFor(member);
    return RESPONSE_FIELD_KEYS.map((stableKey) => [
      sqlString(member.responseId),
      sqlString(stableKey),
      sqlJson(answers[stableKey]),
      sqlJson(answers[stableKey]),
    ]);
  });

export const buildIdentityConflictSeedSql = (
  catalog: IdentityConflictSeedCatalog = identityConflictSeedCatalog,
): string => {
  const statements = [
    buildInsert(
      "schema_versions",
      ["revision_id", "form_id", "schema_hash", "state", "synced_at", "field_count", "unknown_field_count", "source_url"],
      [[
        sqlString(catalog.revisionId),
        sqlString(catalog.formId),
        sqlString(catalog.schemaHash),
        sqlString("active"),
        sqlString("2026-06-09T10:00:00.000Z"),
        sqlNumber(RESPONSE_FIELD_KEYS.length),
        "0",
        sqlString(IDENTITY_CONFLICT_SEED_ACTOR),
      ]],
    ),
    buildInsert(
      "schema_questions",
      ["question_pk", "revision_id", "stable_key", "question_id", "item_id", "section_key", "section_title", "label", "kind", "position", "required", "visibility", "searchable", "status", "choice_labels_json"],
      schemaQuestionRows(catalog),
    ),
    buildInsert(
      "member_responses",
      ["response_id", "form_id", "revision_id", "schema_hash", "response_email", "submitted_at", "edit_response_url", "answers_json", "raw_answers_json", "extra_fields_json", "unmapped_question_ids_json", "search_text"],
      catalog.members.map((member) => [
        sqlString(member.responseId),
        sqlString(catalog.formId),
        sqlString(catalog.revisionId),
        sqlString(catalog.schemaHash),
        sqlString(member.email),
        sqlString(member.lastSubmittedAt),
        sqlNullableString(`https://forms.test.invalid/edit/${member.responseId}`),
        sqlJson(answersFor(member)),
        sqlJson(answersFor(member)),
        sqlJson({ source: IDENTITY_CONFLICT_SEED_ACTOR }),
        sqlJson([]),
        sqlString(searchTextFor(member)),
      ]),
    ),
    buildInsert("response_fields", ["response_id", "stable_key", "value_json", "raw_value_json"], responseFieldRows(catalog)),
    buildInsert(
      "member_identities",
      ["member_id", "response_email", "current_response_id", "first_response_id", "last_submitted_at", "created_at", "updated_at"],
      catalog.members.map((member) => [
        sqlString(member.memberId),
        sqlString(member.email),
        sqlString(member.responseId),
        sqlString(member.responseId),
        sqlString(member.lastSubmittedAt),
        sqlString(member.lastSubmittedAt),
        sqlString(member.lastSubmittedAt),
      ]),
    ),
    buildInsert(
      "member_status",
      ["member_id", "public_consent", "rules_consent", "publish_state", "is_deleted", "hidden_reason", "updated_by", "updated_at", "notification_opt_out"],
      catalog.members.map((member) => [
        sqlString(member.memberId),
        sqlString("declined"),
        sqlString("consented"),
        sqlString("member_only"),
        "0",
        "NULL",
        sqlString(IDENTITY_CONFLICT_SEED_ACTOR),
        sqlString(member.lastSubmittedAt),
        "0",
      ]),
    ),
  ].filter(Boolean);

  return `${statements.join("\n\n")}\n`;
};

export const buildIdentityConflictCleanupSql = (
  catalog: IdentityConflictSeedCatalog = identityConflictSeedCatalog,
): string => {
  const memberIds = catalog.members.map((member) => sqlString(member.memberId)).join(", ");
  const responseIds = catalog.members.map((member) => sqlString(member.responseId)).join(", ");
  const statements = [
    `DELETE FROM member_status WHERE member_id IN (${memberIds});`,
    `DELETE FROM member_identities WHERE member_id IN (${memberIds});`,
    `DELETE FROM response_fields WHERE response_id IN (${responseIds});`,
    `DELETE FROM member_responses WHERE response_id IN (${responseIds});`,
    `DELETE FROM schema_questions WHERE revision_id = ${sqlString(catalog.revisionId)};`,
    `DELETE FROM schema_versions WHERE revision_id = ${sqlString(catalog.revisionId)};`,
  ];
  return `${statements.join("\n")}\n`;
};
