import { STABLE_KEY } from "@ubm-hyogo/shared";
import type { FieldVisibility } from "@ubm-hyogo/shared";

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

const MEMBER_RESPONSE_FIELD_KEYS = [
  STABLE_KEY.birthDate,
  STABLE_KEY.ubmJoinDate,
  STABLE_KEY.challenges,
] as const;

const ADMIN_RESPONSE_FIELD_KEYS = [
  STABLE_KEY.publicConsent,
  STABLE_KEY.rulesConsent,
] as const;

const RESPONSE_FIELD_KEYS = [
  ...PUBLIC_RESPONSE_FIELD_KEYS,
  ...MEMBER_RESPONSE_FIELD_KEYS,
  ...ADMIN_RESPONSE_FIELD_KEYS,
] as const;

const FIELD_VISIBILITY = {
  ...Object.fromEntries(PUBLIC_RESPONSE_FIELD_KEYS.map((stableKey) => [stableKey, "public"])),
  ...Object.fromEntries(MEMBER_RESPONSE_FIELD_KEYS.map((stableKey) => [stableKey, "member"])),
  ...Object.fromEntries(ADMIN_RESPONSE_FIELD_KEYS.map((stableKey) => [stableKey, "admin"])),
} as Record<(typeof RESPONSE_FIELD_KEYS)[number], FieldVisibility>;

interface SchemaQuestionSeed {
  readonly stableKey: (typeof RESPONSE_FIELD_KEYS)[number];
  readonly sectionKey: string;
  readonly sectionTitle: string;
  readonly label: string;
  readonly kind: string;
  readonly required: boolean;
  readonly visibility: FieldVisibility;
}

const SCHEMA_QUESTIONS: readonly SchemaQuestionSeed[] = [
  { stableKey: STABLE_KEY.fullName, sectionKey: "basic_profile", sectionTitle: "基本プロフィール", label: "お名前（フルネーム）", kind: "shortText", required: true, visibility: "public" },
  { stableKey: STABLE_KEY.nickname, sectionKey: "basic_profile", sectionTitle: "基本プロフィール", label: "あだ名・ニックネーム", kind: "shortText", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.location, sectionKey: "basic_profile", sectionTitle: "基本プロフィール", label: "お住まい", kind: "shortText", required: true, visibility: "public" },
  { stableKey: STABLE_KEY.birthDate, sectionKey: "basic_profile", sectionTitle: "基本プロフィール", label: "生年月日", kind: "date", required: false, visibility: "member" },
  { stableKey: STABLE_KEY.occupation, sectionKey: "basic_profile", sectionTitle: "基本プロフィール", label: "職業・仕事内容", kind: "shortText", required: true, visibility: "public" },
  { stableKey: STABLE_KEY.hometown, sectionKey: "basic_profile", sectionTitle: "基本プロフィール", label: "出身地", kind: "shortText", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.ubmZone, sectionKey: "ubm_profile", sectionTitle: "UBMプロフィール", label: "UBM区画", kind: "radio", required: true, visibility: "public" },
  { stableKey: STABLE_KEY.ubmMembershipType, sectionKey: "ubm_profile", sectionTitle: "UBMプロフィール", label: "UBM参加ステータス", kind: "radio", required: true, visibility: "public" },
  { stableKey: STABLE_KEY.ubmJoinDate, sectionKey: "ubm_profile", sectionTitle: "UBMプロフィール", label: "UBMに入会・参加した時期", kind: "shortText", required: false, visibility: "member" },
  { stableKey: STABLE_KEY.businessOverview, sectionKey: "ubm_profile", sectionTitle: "UBMプロフィール", label: "ビジネス概要", kind: "paragraph", required: true, visibility: "public" },
  { stableKey: STABLE_KEY.skills, sectionKey: "ubm_profile", sectionTitle: "UBMプロフィール", label: "得意分野・スキル", kind: "paragraph", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.challenges, sectionKey: "ubm_profile", sectionTitle: "UBMプロフィール", label: "現在の課題・相談したいこと", kind: "paragraph", required: false, visibility: "member" },
  { stableKey: STABLE_KEY.canProvide, sectionKey: "ubm_profile", sectionTitle: "UBMプロフィール", label: "提供できること・協力できること", kind: "paragraph", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.hobbies, sectionKey: "personal_profile", sectionTitle: "パーソナル", label: "趣味・好きなこと", kind: "shortText", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.recentInterest, sectionKey: "personal_profile", sectionTitle: "パーソナル", label: "最近ハマっていること", kind: "shortText", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.motto, sectionKey: "personal_profile", sectionTitle: "パーソナル", label: "座右の銘", kind: "shortText", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.otherActivities, sectionKey: "personal_profile", sectionTitle: "パーソナル", label: "仕事以外の活動", kind: "paragraph", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlWebsite, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "ホームページ URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlFacebook, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "Facebook URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlInstagram, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "Instagram URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlThreads, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "Threads URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlYoutube, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "YouTube URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlTiktok, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "TikTok URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlX, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "X（Twitter）URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlBlog, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "ブログ URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlNote, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "note URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlLinkedin, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "LinkedIn URL", kind: "url", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.urlOthers, sectionKey: "social_links", sectionTitle: "SNS・Web", label: "その他のSNS・URL", kind: "paragraph", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.selfIntroduction, sectionKey: "message", sectionTitle: "メッセージ", label: "自己紹介・一言メッセージ", kind: "paragraph", required: false, visibility: "public" },
  { stableKey: STABLE_KEY.publicConsent, sectionKey: "consent", sectionTitle: "同意", label: "ホームページへの掲載に同意", kind: "consent", required: true, visibility: "admin" },
  { stableKey: STABLE_KEY.rulesConsent, sectionKey: "consent", sectionTitle: "同意", label: "勧誘ルール・免責事項への同意", kind: "consent", required: true, visibility: "admin" },
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
  [STABLE_KEY.publicConsent]: member.publicConsent,
  [STABLE_KEY.rulesConsent]: member.rulesConsent,
  notificationOptOut: member.notificationOptOut ? "true" : "false",
});

const searchTextFor = (member: TestMemberAccount): string =>
  [member.fullName, member.occupation, member.ubmZone, member.email].filter(Boolean).join(" ");

const responseFieldRows = (catalog: TestAccountsCatalog): string[][] =>
  catalog.members.flatMap((member) => {
    const answers = answersFor(member);
    return RESPONSE_FIELD_KEYS.filter((stableKey) =>
      Object.hasOwn(answers, stableKey),
    ).map((stableKey) => [
      sqlString(member.responseId),
      sqlString(stableKey),
      sqlJson(answers[stableKey]),
      sqlJson(answers[stableKey]),
    ]);
  });

const visibilityRows = (catalog: TestAccountsCatalog): string[][] =>
  catalog.members.flatMap((member) =>
    RESPONSE_FIELD_KEYS.map((stableKey) => [
      sqlString(member.memberId),
      sqlString(stableKey),
      sqlString(FIELD_VISIBILITY[stableKey]),
      sqlString(catalog.submittedAt),
    ]),
  );

const schemaQuestionRows = (catalog: TestAccountsCatalog): string[][] =>
  SCHEMA_QUESTIONS.map((question, index) => [
    sqlString(`${catalog.revisionId}:${question.stableKey}`),
    sqlString(catalog.revisionId),
    sqlString(question.stableKey),
    sqlString(`TEST-Q-${String(index + 1).padStart(2, "0")}`),
    sqlString(`TEST-ITEM-${String(index + 1).padStart(2, "0")}`),
    sqlString(question.sectionKey),
    sqlString(question.sectionTitle),
    sqlString(question.label),
    sqlString(question.kind),
    sqlNumber(index + 1),
    sqlNumber(question.required),
    sqlString(question.visibility),
    "1",
    sqlString("active"),
    sqlJson([]),
  ]);

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
        sqlNumber(RESPONSE_FIELD_KEYS.length),
        "0",
        sqlString("seed:test-accounts"),
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
      "member_field_visibility",
      ["member_id", "stable_key", "visibility", "updated_at"],
      visibilityRows(catalog),
    ),
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
    `DELETE FROM member_field_visibility WHERE member_id IN (${memberIds});`,
    `DELETE FROM member_status WHERE member_id IN (${memberIds});`,
    `DELETE FROM member_identities WHERE member_id IN (${memberIds});`,
    `DELETE FROM response_fields WHERE response_id IN (${responseIds});`,
    `DELETE FROM member_responses WHERE response_id IN (${responseIds});`,
    `DELETE FROM meeting_sessions WHERE session_id IN (${meetingIds});`,
    `DELETE FROM admin_users WHERE admin_id IN (${adminIds});`,
    `DELETE FROM schema_questions WHERE revision_id = ${sqlString(catalog.revisionId)};`,
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
