import { STABLE_KEY } from "@ubm-hyogo/shared";

import {
  TEST_ACCOUNT_ACTOR,
  testAccountsCatalog,
  isLoginableTestMember,
  isPublicListedTestMember,
  type TestAccountsCatalog,
  type TestMemberAccount,
} from "./catalog.ts";

export interface TestAccountManifest {
  readonly generatedAt: string;
  readonly members: readonly {
    readonly memberId: string;
    readonly email: string;
    readonly fullName: string;
    readonly loginable: boolean;
    readonly publicListed: boolean;
    readonly isDeleted: boolean;
    readonly storageStateName: string;
  }[];
  readonly admins: readonly {
    readonly adminId: string;
    readonly email: string;
    readonly displayName: string;
    readonly active: boolean;
    readonly storageStateName: string;
  }[];
}

const PUBLIC_RESPONSE_FIELD_KEYS = [
  STABLE_KEY.fullName,
  STABLE_KEY.nickname,
  STABLE_KEY.location,
  STABLE_KEY.occupation,
  STABLE_KEY.hometown,
  STABLE_KEY.ubmZone,
  STABLE_KEY.ubmMembershipType,
  STABLE_KEY.businessOverview,
  STABLE_KEY.skills,
  STABLE_KEY.canProvide,
  STABLE_KEY.hobbies,
  STABLE_KEY.recentInterest,
  STABLE_KEY.motto,
  STABLE_KEY.otherActivities,
  STABLE_KEY.urlWebsite,
  STABLE_KEY.urlFacebook,
  STABLE_KEY.urlInstagram,
  STABLE_KEY.urlThreads,
  STABLE_KEY.urlYoutube,
  STABLE_KEY.urlTiktok,
  STABLE_KEY.urlX,
  STABLE_KEY.urlBlog,
  STABLE_KEY.urlNote,
  STABLE_KEY.urlLinkedin,
  STABLE_KEY.urlOthers,
  STABLE_KEY.selfIntroduction,
] as const;

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

const answersFor = (member: TestMemberAccount): Record<string, string | null> => ({
  [STABLE_KEY.fullName]: member.fullName,
  [STABLE_KEY.occupation]: member.occupation,
  [STABLE_KEY.ubmZone]: member.ubmZone,
  ...member.profile,
  notificationOptOut: member.notificationOptOut ? "true" : "false",
});

const searchTextFor = (member: TestMemberAccount): string =>
  [member.fullName, member.occupation, member.ubmZone, member.email].filter(Boolean).join(" ");

const responseFieldRows = (catalog: TestAccountsCatalog): string[][] =>
  catalog.members.flatMap((member) => {
    const answers = answersFor(member);
    return PUBLIC_RESPONSE_FIELD_KEYS.filter((stableKey) =>
      Object.hasOwn(answers, stableKey),
    ).map((stableKey) => [
      sqlString(member.responseId),
      sqlString(stableKey),
      sqlJson(answers[stableKey]),
      sqlJson(answers[stableKey]),
    ]);
  });

export const buildSeedSql = (catalog: TestAccountsCatalog = testAccountsCatalog): string => {
  // Cloudflare D1 の remote 実行は SQL の BEGIN TRANSACTION / COMMIT を拒否する
  // （wrangler d1 execute --file が全文を1バッチ＝暗黙アトミックに実行するため）。
  // local / remote 双方で動くよう明示トランザクションは出力しない。
  const statements = [
    buildInsert(
      "schema_versions",
      ["revision_id", "form_id", "schema_hash", "state", "synced_at", "field_count", "unknown_field_count", "source_url"],
      [[
        sqlString(catalog.revisionId),
        sqlString(catalog.formId),
        sqlString(catalog.schemaHash),
        sqlString("active"),
        sqlString(catalog.submittedAt),
        sqlNumber(PUBLIC_RESPONSE_FIELD_KEYS.length),
        "0",
        sqlString("seed:test-accounts"),
      ]],
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
        sqlString(catalog.submittedAt),
        sqlNullableString(`https://forms.test.invalid/edit/${member.responseId}`),
        sqlJson(answersFor(member)),
        sqlJson(answersFor(member)),
        sqlJson({ source: TEST_ACCOUNT_ACTOR }),
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
        sqlString(catalog.submittedAt),
        sqlString(catalog.submittedAt),
        sqlString(catalog.submittedAt),
      ]),
    ),
    buildInsert(
      "member_status",
      ["member_id", "public_consent", "rules_consent", "publish_state", "is_deleted", "hidden_reason", "updated_by", "updated_at", "notification_opt_out"],
      catalog.members.map((member) => [
        sqlString(member.memberId),
        sqlString(member.publicConsent),
        sqlString(member.rulesConsent),
        sqlString(member.publishState),
        sqlNumber(member.isDeleted),
        sqlNullableString(member.publishState === "hidden" ? "test account hidden case" : null),
        sqlString(TEST_ACCOUNT_ACTOR),
        sqlString(catalog.submittedAt),
        sqlNumber(member.notificationOptOut),
      ]),
    ),
    buildInsert(
      "meeting_sessions",
      ["session_id", "title", "held_on", "note", "created_at", "created_by", "deleted_at"],
      catalog.meetings.map((meeting) => [
        sqlString(meeting.sessionId),
        sqlString(meeting.title),
        sqlString(meeting.heldOn),
        sqlString("test account seed meeting"),
        sqlString(catalog.submittedAt),
        sqlString(TEST_ACCOUNT_ACTOR),
        "NULL",
      ]),
    ),
    buildInsert(
      "member_attendance",
      ["member_id", "session_id", "assigned_at", "assigned_by"],
      catalog.members.flatMap((member) =>
        member.attendance.map((sessionId) => [
          sqlString(member.memberId),
          sqlString(sessionId),
          sqlString(catalog.submittedAt),
          sqlString(TEST_ACCOUNT_ACTOR),
        ]),
      ),
    ),
    buildInsert(
      "member_tags",
      ["member_id", "tag_id", "source", "confidence", "assigned_at", "assigned_by"],
      catalog.members.flatMap((member) =>
        member.tags.map((tagId) => [
          sqlString(member.memberId),
          sqlString(tagId),
          sqlString("seed"),
          "1.0",
          sqlString(catalog.submittedAt),
          sqlString(TEST_ACCOUNT_ACTOR),
        ]),
      ),
      "INSERT OR IGNORE",
    ),
    buildInsert(
      "member_photos",
      ["member_id", "object_key", "content_type", "byte_size", "uploaded_by", "uploaded_at", "source", "thumb_object_key", "thumb_byte_size", "content_hash", "processing_status"],
      catalog.members
        .filter((member) => member.photo)
        .map((member) => [
          sqlString(member.memberId),
          sqlString(`test-accounts/${member.memberId}/avatar.jpg`),
          sqlString("image/jpeg"),
          "1024",
          sqlString(TEST_ACCOUNT_ACTOR),
          sqlString(catalog.submittedAt),
          sqlString(member.photo!.source),
          sqlNullableString(member.photo!.hasThumb ? `test-accounts/${member.memberId}/thumb.jpg` : null),
          member.photo!.hasThumb ? "256" : "NULL",
          sqlString(`sha256-${member.memberId.toLowerCase()}`),
          sqlString(member.photo!.processingStatus),
        ]),
    ),
    buildInsert(
      "deleted_members",
      ["member_id", "deleted_by", "deleted_at", "reason", "purged_at", "retention_policy_version"],
      catalog.members
        .filter((member) => member.isDeleted)
        .map((member) => [
          sqlString(member.memberId),
          sqlString(TEST_ACCOUNT_ACTOR),
          sqlString(catalog.submittedAt),
          sqlString("test account deleted case"),
          "NULL",
          "NULL",
        ]),
    ),
    buildInsert(
      "admin_member_notes",
      ["note_id", "member_id", "body", "created_by", "updated_by", "created_at", "updated_at", "note_type", "request_status", "resolved_at", "resolved_by_admin_id"],
      catalog.requests.map((request) => [
        sqlString(request.noteId),
        sqlString(request.memberId),
        `json_object('reason', ${sqlString(request.reason)}, 'payload', json(${sqlJson(request.payload)}))`,
        sqlString(TEST_ACCOUNT_ACTOR),
        sqlString(TEST_ACCOUNT_ACTOR),
        sqlString(catalog.submittedAt),
        sqlString(catalog.submittedAt),
        sqlString(request.noteType),
        sqlString("pending"),
        "NULL",
        "NULL",
      ]),
    ),
    buildInsert(
      "admin_users",
      ["admin_id", "email", "display_name", "active", "created_at"],
      catalog.admins.map((admin) => [
        sqlString(admin.adminId),
        sqlString(admin.email),
        sqlString(admin.displayName),
        sqlNumber(admin.active),
        sqlString(catalog.submittedAt),
      ]),
    ),
  ].filter(Boolean);

  return `${statements.join("\n\n")}\n`;
};

export const buildCleanupSql = (catalog: TestAccountsCatalog = testAccountsCatalog): string => {
  const memberIds = catalog.members.map((member) => sqlString(member.memberId)).join(", ");
  const responseIds = catalog.members.map((member) => sqlString(member.responseId)).join(", ");
  const meetingIds = catalog.meetings.map((meeting) => sqlString(meeting.sessionId)).join(", ");
  const adminIds = catalog.admins.map((admin) => sqlString(admin.adminId)).join(", ");
  const statements = [
    `DELETE FROM member_photos WHERE member_id IN (${memberIds});`,
    `DELETE FROM member_attendance WHERE member_id IN (${memberIds}) OR session_id IN (${meetingIds});`,
    `DELETE FROM member_tags WHERE member_id IN (${memberIds});`,
    `DELETE FROM admin_member_notes WHERE note_id LIKE 'TEST-NOTE-%';`,
    `DELETE FROM deleted_members WHERE member_id IN (${memberIds});`,
    `DELETE FROM member_status WHERE member_id IN (${memberIds});`,
    `DELETE FROM member_identities WHERE member_id IN (${memberIds});`,
    `DELETE FROM response_fields WHERE response_id IN (${responseIds});`,
    `DELETE FROM member_responses WHERE response_id IN (${responseIds});`,
    `DELETE FROM meeting_sessions WHERE session_id IN (${meetingIds});`,
    `DELETE FROM admin_users WHERE admin_id IN (${adminIds});`,
    `DELETE FROM schema_versions WHERE revision_id = ${sqlString(catalog.revisionId)};`,
  ];
  return `${statements.join("\n")}\n`;
};

export const buildManifest = (catalog: TestAccountsCatalog = testAccountsCatalog): TestAccountManifest => ({
  generatedAt: catalog.submittedAt,
  members: catalog.members.map((member) => ({
    memberId: member.memberId,
    email: member.email,
    fullName: member.fullName,
    loginable: isLoginableTestMember(member),
    publicListed: isPublicListedTestMember(member),
    isDeleted: member.isDeleted,
    storageStateName: `${member.memberId.toLowerCase()}.storageState.json`,
  })),
  admins: catalog.admins.map((admin) => ({
    adminId: admin.adminId,
    email: admin.email,
    displayName: admin.displayName,
    active: admin.active,
    storageStateName: `${admin.adminId.toLowerCase()}.storageState.json`,
  })),
});

export const buildManifestJson = (catalog: TestAccountsCatalog = testAccountsCatalog): string =>
  `${JSON.stringify(buildManifest(catalog), null, 2)}\n`;
