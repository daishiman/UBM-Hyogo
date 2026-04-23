# メンバーデータの型定義

## 基本方針

型は「生データ」「正規化データ」「表示データ」を分ける。

1. `FormManifest` / `FormSchemaVersion` - Google Form の schema 版管理
2. `MemberResponse` - Forms API の回答を正規化した一次保存
3. `MemberProfile` - 画面表示用にマージした最終データ
4. `MemberStatusRecord` / `DeletedMemberRecord` - 運用状態
5. `TagDefinition` / `TagRule` / `MemberTag` - 検索・分類用メタデータ

---

## 共通型

```typescript
export type ConsentStatus = "consented" | "declined" | "unknown";

export type UbmZone = "0_to_1" | "1_to_10" | "10_to_100";

export type UbmMembershipType = "member" | "non_member" | "academy";

export type MemberVisibility = "public" | "member" | "admin" | "hidden";

export type SchemaState = "active" | "superseded" | "pending_review";

export type SyncJobStatus = "queued" | "running" | "done" | "failed";

export type FieldStatus = "active" | "inactive" | "pending";

export type FieldKind =
  | "shortText"
  | "paragraph"
  | "date"
  | "radio"
  | "checkbox"
  | "dropdown"
  | "scale"
  | "url"
  | "email"
  | "section"
  | "unknown";

export type AnswerValue =
  | string
  | string[]
  | number
  | boolean
  | { year: number; month: number; day: number }
  | null;

export interface DateValue {
  year: number;
  month: number;
  day: number;
}
```

---

## schema 定義

```typescript
export interface FieldOptionDefinition {
  rawLabel: string;
  normalizedValue: string;
  position: number;
  active: boolean;
}

export interface FormFieldDefinition {
  formId: string;
  revisionId: string;
  schemaHash: string;
  stableKey: string;
  questionId: string | null;
  itemId: string | null;
  sectionKey: string;
  sectionTitle: string;
  label: string;
  kind: FieldKind;
  position: number;
  required: boolean;
  visibility: MemberVisibility;
  editableByMember: boolean;
  editableByAdmin: boolean;
  searchable: boolean;
  status: FieldStatus;
  choiceLabels: FieldOptionDefinition[];
}

export interface FormManifest {
  formId: string;
  title: string;
  revisionId: string;
  schemaHash: string;
  state: SchemaState;
  syncedAt: string;
  sourceUrl: string;
  fieldCount: number;
  unknownFieldCount: number;
}

export interface FormSchemaVersion extends FormManifest {
  fields: FormFieldDefinition[];
}

export interface FormFieldAlias {
  formId: string;
  stableKey: string;
  oldQuestionId: string;
  newQuestionId: string;
  oldRevisionId: string;
  newRevisionId: string;
  detectedAt: string;
  resolvedBy: string | null;
}

export interface SchemaDriftIssue {
  stableKey?: string;
  questionId?: string;
  severity: "info" | "warning" | "error";
  message: string;
}
```

---

## 回答データ

```typescript
export interface MemberResponse {
  responseId: string;
  formId: string;
  revisionId: string;
  schemaHash: string;
  loginEmail: string | null;
  responseEmail: string | null;
  submittedAt: string;
  answersByStableKey: Record<string, AnswerValue>;
  rawAnswersByQuestionId: Record<string, unknown>;
  extraFields: Record<string, unknown>;
  unmappedQuestionIds: string[];
  searchText: string;
}

export interface ProfileOverrideRecord {
  responseId: string;
  schemaHash: string;
  values: Record<string, AnswerValue>;
  updatedAt: string;
  updatedBy: string | null;
}

export interface DeletedMemberRecord {
  responseId: string;
  deletedAt: string;
  deletedBy: string;
  reason: string;
}
```

`responseId` を主キーにして、`loginEmail` と `responseEmail` は検索・照合用に残す。
`email` を唯一の識別子にしないこと。

---

## 表示データ

```typescript
export interface MemberProfileSectionField {
  stableKey: string;
  label: string;
  value: AnswerValue;
  kind: FieldKind;
  visibility: MemberVisibility;
  status: FieldStatus;
}

export interface MemberProfileSection {
  key: string;
  title: string;
  fields: MemberProfileSectionField[];
}

export interface MemberStatusRecord {
  memberId: string;
  responseId: string;
  publicConsent: ConsentStatus;
  ruleConsent: ConsentStatus;
  isPublic: boolean;
  isDeleted: boolean;
  hiddenReason: string | null;
  lastNotifiedAt: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface MemberProfile {
  memberId: string;
  responseId: string;
  formId: string;
  revisionId: string;
  schemaHash: string;
  loginEmail: string | null;
  responseEmail: string | null;
  publicConsent: ConsentStatus;
  ruleConsent: ConsentStatus;
  isPublic: boolean;
  isDeleted: boolean;
  summary: {
    fullName: string;
    nickname: string;
    location: string;
    occupation: string;
    ubmZone: UbmZone | null;
    ubmMembershipType: UbmMembershipType | null;
  };
  sections: MemberProfileSection[];
  answers: Record<string, AnswerValue>;
  extraFields: Record<string, unknown>;
  tags: string[];
  lastSyncedAt: string;
}

export interface MemberSummary extends Pick<
  MemberProfile,
  | "memberId"
  | "responseId"
  | "loginEmail"
  | "responseEmail"
  | "publicConsent"
  | "ruleConsent"
  | "isPublic"
  | "isDeleted"
  | "summary"
  | "tags"
  | "lastSyncedAt"
> {}
```

`MemberSummary` は一覧のための軽量型なので、詳細表示専用の `sections` は持たない。

---

## 編集・運用データ

```typescript
export interface EditableProfilePatch {
  responseId: string;
  schemaHash: string;
  values: Record<string, AnswerValue>;
}
```

---

## タグ・検索データ

```typescript
export interface TagDefinition {
  tagId: string;
  code: string;
  label: string;
  category: string;
  sourceFields: string[];
  active: boolean;
}

export interface TagRule {
  ruleId: string;
  tagId: string;
  schemaHash: string | null;
  sourceStableKeys: string[];
  matchType: "contains" | "equals" | "regex" | "in";
  matchValue: string;
  priority: number;
  active: boolean;
}

export interface MemberTag {
  responseId: string;
  tagId: string;
  sourceSchemaHash: string;
  matchedBy: "rule" | "manual";
  confidence: number;
  updatedAt: string;
}
```
