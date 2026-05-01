// テスト用フィクスチャデータ

import type { AnyRow } from "./d1mock";

// 基本的な会員 identity
export const MEMBER_IDENTITY_1: AnyRow = {
  member_id: "m_001",
  response_email: "user1@example.com",
  current_response_id: "r_001",
  first_response_id: "r_001",
  last_submitted_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

export const MEMBER_IDENTITY_2: AnyRow = {
  member_id: "m_002",
  response_email: "user2@example.com",
  current_response_id: "r_002",
  first_response_id: "r_002",
  last_submitted_at: "2026-01-02T00:00:00Z",
  created_at: "2026-01-02T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

// 削除済み会員
export const MEMBER_IDENTITY_DELETED: AnyRow = {
  member_id: "m_003",
  response_email: "deleted@example.com",
  current_response_id: "r_003",
  first_response_id: "r_003",
  last_submitted_at: "2026-01-03T00:00:00Z",
  created_at: "2026-01-03T00:00:00Z",
  updated_at: "2026-01-03T00:00:00Z",
};

// 会員ステータス（公開同意済み）
export const MEMBER_STATUS_CONSENTED: AnyRow = {
  member_id: "m_001",
  public_consent: "consented",
  rules_consent: "consented",
  publish_state: "public",
  is_deleted: 0,
  hidden_reason: null,
  last_notified_at: null,
  updated_by: null,
  updated_at: "2026-01-01T00:00:00Z",
};

// 会員ステータス（同意なし）
export const MEMBER_STATUS_NOT_CONSENTED: AnyRow = {
  member_id: "m_002",
  public_consent: "unknown",
  rules_consent: "unknown",
  publish_state: "member_only",
  is_deleted: 0,
  hidden_reason: null,
  last_notified_at: null,
  updated_by: null,
  updated_at: "2026-01-02T00:00:00Z",
};

// 削除済みステータス
export const MEMBER_STATUS_DELETED: AnyRow = {
  member_id: "m_003",
  public_consent: "consented",
  rules_consent: "consented",
  publish_state: "public",
  is_deleted: 1,
  hidden_reason: "退会申請",
  last_notified_at: null,
  updated_by: "admin_001",
  updated_at: "2026-01-03T00:00:00Z",
};

// フォーム回答
export const MEMBER_RESPONSE_1: AnyRow = {
  response_id: "r_001",
  form_id: "form_001",
  revision_id: "rev_001",
  schema_hash: "abc123",
  response_email: "user1@example.com",
  submitted_at: "2026-01-01T00:00:00Z",
  edit_response_url: "https://docs.google.com/forms/edit/r_001",
  answers_json: JSON.stringify({
    fullName: "山田 太郎",
    nickname: "タロウ",
    location: "兵庫県神戸市",
    occupation: "エンジニア",
    ubmZone: "関西",
    ubmMembershipType: "正会員",
  }),
  raw_answers_json: "{}",
  extra_fields_json: "{}",
  unmapped_question_ids_json: "[]",
  search_text: "山田 太郎 タロウ 兵庫県神戸市 エンジニア",
};

export const MEMBER_RESPONSE_2: AnyRow = {
  response_id: "r_002",
  form_id: "form_001",
  revision_id: "rev_001",
  schema_hash: "abc123",
  response_email: "user2@example.com",
  submitted_at: "2026-01-02T00:00:00Z",
  edit_response_url: null,
  answers_json: JSON.stringify({
    fullName: "鈴木 花子",
    nickname: "ハナ",
    location: "大阪府大阪市",
    occupation: "デザイナー",
    ubmZone: "関西",
    ubmMembershipType: "準会員",
  }),
  raw_answers_json: "{}",
  extra_fields_json: "{}",
  unmapped_question_ids_json: "[]",
  search_text: "鈴木 花子 ハナ 大阪府大阪市 デザイナー",
};

export const MEMBER_RESPONSE_3: AnyRow = {
  response_id: "r_003",
  form_id: "form_001",
  revision_id: "rev_001",
  schema_hash: "abc123",
  response_email: "deleted@example.com",
  submitted_at: "2026-01-03T00:00:00Z",
  edit_response_url: null,
  answers_json: JSON.stringify({
    fullName: "削除 太郎",
    nickname: "消えた人",
    location: "東京都",
    occupation: "元会員",
    ubmZone: null,
    ubmMembershipType: null,
  }),
  raw_answers_json: "{}",
  extra_fields_json: "{}",
  unmapped_question_ids_json: "[]",
  search_text: "削除 太郎",
};

// レスポンスセクション
export const RESPONSE_SECTIONS_R001: AnyRow[] = [
  {
    response_id: "r_001",
    section_key: "profile",
    section_title: "基本情報",
    position: 1,
  },
  {
    response_id: "r_001",
    section_key: "skills",
    section_title: "スキル・経験",
    position: 2,
  },
];

// レスポンスフィールド
export const RESPONSE_FIELDS_R001: AnyRow[] = [
  {
    response_id: "r_001",
    stable_key: "fullName",
    value_json: JSON.stringify("山田 太郎"),
    raw_value_json: JSON.stringify("山田 太郎"),
  },
  {
    response_id: "r_001",
    stable_key: "nickname",
    value_json: JSON.stringify("タロウ"),
    raw_value_json: JSON.stringify("タロウ"),
  },
  {
    response_id: "r_001",
    stable_key: "admin_note_field",
    value_json: JSON.stringify("管理者のみ閲覧"),
    raw_value_json: JSON.stringify("管理者のみ閲覧"),
  },
];

// フィールド可視性設定
export const FIELD_VISIBILITY_M001: AnyRow[] = [
  {
    member_id: "m_001",
    stable_key: "fullName",
    visibility: "public",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    member_id: "m_001",
    stable_key: "nickname",
    visibility: "member",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    member_id: "m_001",
    stable_key: "admin_note_field",
    visibility: "admin",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

// タグ定義
export const TAG_DEFINITIONS: AnyRow[] = [
  {
    tag_id: "tag_001",
    code: "engineer",
    label: "エンジニア",
    category: "occupation",
    source_stable_keys_json: '["occupation"]',
    active: 1,
  },
  {
    tag_id: "tag_002",
    code: "designer",
    label: "デザイナー",
    category: "occupation",
    source_stable_keys_json: '["occupation"]',
    active: 1,
  },
  {
    tag_id: "tag_003",
    code: "inactive_tag",
    label: "非アクティブタグ",
    category: "test",
    source_stable_keys_json: "[]",
    active: 0,
  },
];

// 会員タグ
export const MEMBER_TAGS_M001: AnyRow[] = [
  {
    member_id: "m_001",
    tag_id: "tag_001",
    source: "rule",
    confidence: 0.9,
    assigned_at: "2026-01-01T00:00:00Z",
    assigned_by: null,
  },
];
