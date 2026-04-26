# メンバーデータの型定義

## 基本方針

型は 4 層で分ける。

1. schema 型
2. raw / normalized response 型
3. stable member 型
4. view model 型

Google Form 再回答を正式更新手段にするため、`response` と `member` を分離する。

この型群は `apps/web` と `apps/api` で共有し、表示用・同期用の境界を type で崩さない。

---

## 共通型

```ts
export type ConsentStatus = "consented" | "declined" | "unknown";

export type FieldVisibility = "public" | "member" | "admin";

export type PublishState = "public" | "member_only" | "hidden";

export type SchemaState = "active" | "superseded" | "pending_review";

export type FieldStatus = "active" | "inactive" | "pending";

export type FieldSource = "forms" | "admin" | "derived";

export type TagSource = "rule" | "ai" | "manual";

export type Density = "comfy" | "dense" | "list";

export type SortKey = "recent" | "name";

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "conflict"
  | "sync_unavailable"
  | "internal_error";

export type AuthGateState =
  | "input"
  | "sent"
  | "unregistered"
  | "rules_declined"
  | "deleted";

export type FieldKind =
  | "shortText"
  | "paragraph"
  | "date"
  | "radio"
  | "checkbox"
  | "dropdown"
  | "url"
  | "unknown";

export type AnswerValue =
  | string
  | string[]
  | number
  | boolean
  | { year: number; month: number; day: number }
  | null;

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  gateState?: Exclude<AuthGateState, "input" | "sent">;
  requestId?: string;
}

export interface MutationResult<T = null> {
  ok: true;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface MemberSearchQuery {
  q?: string;
  zone?: "all" | string;
  status?: "all" | string;
  tag?: string[];
  sort?: SortKey;
  density?: Density;
  page?: number;
  pageSize?: number;
}
```

---

## schema 型

```ts
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
  visibility: FieldVisibility;
  searchable: boolean;
  source: "forms";
  status: FieldStatus;
  choiceLabels: Array<{
    rawLabel: string;
    normalizedValue: string;
    position: number;
    active: boolean;
  }>;
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
```

---

## response 型

```ts
export interface MemberResponse {
  responseId: string;
  formId: string;
  revisionId: string;
  schemaHash: string;
  responseEmail: string | null;
  submittedAt: string;
  editResponseUrl: string | null;
  answersByStableKey: Record<string, AnswerValue>;
  rawAnswersByQuestionId: Record<string, unknown>;
  extraFields: Record<string, unknown>;
  unmappedQuestionIds: string[];
  searchText: string;
}
```

`responseEmail` はフォーム項目ではなく system field。

---

## stable member 型

```ts
export interface MemberIdentity {
  memberId: string;
  responseEmail: string;
  currentResponseId: string;
  firstResponseId: string;
  lastSubmittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberStatusRecord {
  memberId: string;
  publicConsent: ConsentStatus;
  rulesConsent: ConsentStatus;
  publishState: PublishState;
  isDeleted: boolean;
  hiddenReason: string | null;
  lastNotifiedAt: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface DeletedMemberRecord {
  memberId: string;
  deletedAt: string;
  deletedBy: string;
  reason: string;
}
```

---

## 会合・参加履歴・タグ

```ts
export interface MeetingSession {
  sessionId: string;
  title: string;
  heldOn: string;
  note: string | null;
  createdAt: string;
  createdBy: string;
}

export interface MeetingWithAttendance extends MeetingSession {
  attendees: Array<{
    memberId: string;
    fullName: string;
    occupation: string;
    isDeleted: boolean;
    assignedAt: string;
  }>;
  attendeeCount: number;
}

export interface MemberAttendance {
  memberId: string;
  sessionId: string;
  assignedAt: string;
  assignedBy: string;
}

export interface AdminMemberNote {
  noteId: string;
  memberId: string;
  body: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface TagDefinition {
  tagId: string;
  code: string;
  label: string;
  category: string;
  sourceStableKeys: string[];
  active: boolean;
}

export interface MemberTag {
  memberId: string;
  tagId: string;
  source: TagSource;
  confidence: number | null;
  assignedAt: string;
  assignedBy: string | null;
}

export interface TagAssignmentQueueItem {
  queueId: string;
  memberId: string;
  responseId: string;
  status: "queued" | "reviewing" | "resolved";
  suggestedTags: string[];
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TagQueueResolveRequest {
  tagIds: string[];
  note?: string;
}
```

---

## view model 型

```ts
export interface MemberProfileSectionField {
  stableKey: string;
  label: string;
  value: AnswerValue;
  kind: FieldKind;
  visibility: FieldVisibility;
  source: FieldSource;
}

export interface MemberProfileSection {
  key: string;
  title: string;
  fields: MemberProfileSectionField[];
}

export interface BaseMemberProfile {
  memberId: string;
  responseId: string;
  responseEmail: string | null;
  publicConsent: ConsentStatus;
  rulesConsent: ConsentStatus;
  publishState: PublishState;
  isDeleted: boolean;
  summary: {
    fullName: string;
    nickname: string;
    location: string;
    occupation: string;
    ubmZone: string | null;
    ubmMembershipType: string | null;
  };
  sections: MemberProfileSection[];
  attendance: MeetingSession[];
  tags: Array<{
    code: string;
    label: string;
    category: string;
    source: TagSource;
  }>;
  lastSubmittedAt: string;
  editResponseUrl: string | null;
}

export type MemberProfile = BaseMemberProfile;

export interface PublicStatsView {
  publicMemberCount: number;
  zoneCounts: Record<string, number>;
  meetingCountThisYear: number;
  recentMeetings: MeetingSession[];
  lastSync: {
    status: "ok" | "running" | "failed" | "never";
    syncedAt: string | null;
  };
}

export interface PublicMemberListItem {
  memberId: string;
  fullName: string;
  nickname: string;
  location: string;
  occupation: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  businessOverview: string | null;
  tags: MemberProfile["tags"];
  lastSubmittedAt: string;
}

export interface PublicMemberListView {
  items: PublicMemberListItem[];
  query: MemberSearchQuery;
  pagination: PaginationMeta;
  availableTags: Array<{ code: string; label: string; category: string }>;
}

export type PublicMemberProfile = Omit<
  BaseMemberProfile,
  "responseEmail" | "rulesConsent" | "adminNotes"
>;

export interface FormPreviewView {
  responderUrl: string;
  sectionCount: number;
  questionCount: number;
  sections: Array<{
    key: string;
    title: string;
    fields: Array<{
      stableKey: string;
      label: string;
      required: boolean;
      visibility: FieldVisibility;
      kind: FieldKind;
    }>;
  }>;
}

export interface AuthGateResponse {
  state: AuthGateState;
  email?: string;
  memberId?: string;
  message?: string;
}

export interface AdminDashboardView {
  totalMembers: number;
  publicMembers: number;
  hiddenMembers: number;
  deletedMembers: number;
  untaggedMembers: number;
  schemaIssues: number;
  zoneCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  recentMeetings: MeetingSession[];
  lastSync: PublicStatsView["lastSync"];
}

export interface AdminMemberListItem extends PublicMemberListItem {
  responseEmail: string | null;
  publicConsent: ConsentStatus;
  rulesConsent: ConsentStatus;
  publishState: PublishState;
  isDeleted: boolean;
  noteCount: number;
}

export interface AdminMemberListView {
  items: AdminMemberListItem[];
  pagination: PaginationMeta;
}

export interface AdminMemberDetailView extends BaseMemberProfile {
  adminNotes: AdminMemberNote[];
}

export interface TagQueueView {
  items: TagAssignmentQueueItem[];
  availableTags: TagDefinition[];
}

export interface SchemaDiffReviewView {
  manifest: FormManifest;
  items: Array<{
    type: "added" | "changed" | "removed" | "unresolved";
    questionId: string | null;
    stableKey: string | null;
    label: string;
    suggestedStableKey?: string;
  }>;
}

export interface AdminMeetingsView {
  meetings: MeetingWithAttendance[];
  addableMembers: Array<{
    memberId: string;
    fullName: string;
    occupation: string;
    isDeleted: boolean;
  }>;
}

export interface SessionUser {
  memberId: string;
  responseId: string;
  email: string;
  isAdmin: boolean;
  authGateState: Exclude<AuthGateState, "input" | "sent"> | null;
}
```

---

## 型設計の注意

1. `responseId` と `memberId` を混同しない
2. `FieldVisibility` と `PublishState` を混同しない
3. `responseEmail` を唯一の DB 主キーにせず、stable member 解決に使う
4. 会合・参加履歴・タグ・管理メモは `FieldSource = "admin" | "derived"` として扱う
5. `adminNotes` は admin API の view model にだけ含め、public/member API には返さない
