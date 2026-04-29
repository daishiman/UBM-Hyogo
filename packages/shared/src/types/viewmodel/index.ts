import type {
  AdminId,
  MemberId,
  ResponseEmail,
  ResponseId,
  StableKey,
} from "../../branded";
import type {
  AnswerValue,
  AuthGateStateValue,
  ConsentStatus,
  FieldKind,
  FieldSource,
  FieldVisibility,
  PublishState,
  TagSource,
} from "../common";
import type { FormFieldDefinition, FormManifest } from "../schema";

export interface MemberProfileSectionField {
  stableKey: StableKey;
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

export interface MemberProfileSummary {
  fullName: string;
  nickname: string;
  location: string;
  occupation: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
}

export interface MemberProfile {
  memberId: MemberId;
  responseId: ResponseId;
  responseEmail: ResponseEmail | null;
  publicConsent: ConsentStatus;
  rulesConsent: ConsentStatus;
  publishState: PublishState;
  isDeleted: boolean;
  summary: MemberProfileSummary;
  sections: MemberProfileSection[];
  attendance: Array<{
    sessionId: string;
    title: string;
    heldOn: string;
  }>;
  tags: Array<{
    code: string;
    label: string;
    category: string;
    source: TagSource;
  }>;
  lastSubmittedAt: string;
  editResponseUrl: string | null;
}

export interface SessionUser {
  memberId: MemberId;
  responseId: ResponseId;
  email: string;
  isAdmin: boolean;
  authGateState: Exclude<AuthGateStateValue, "input" | "sent"> | null;
}

export interface PublicStatsView {
  memberCount: number;
  publicMemberCount: number;
  zoneBreakdown: Array<{ zone: string; count: number }>;
  membershipBreakdown: Array<{ type: string; count: number }>;
  meetingCountThisYear: number;
  recentMeetings: Array<{
    sessionId: string;
    title: string;
    heldOn: string;
  }>;
  lastSync: {
    schemaSync: "ok" | "running" | "failed" | "never";
    responseSync: "ok" | "running" | "failed" | "never";
    schemaSyncFinishedAt: string | null;
    responseSyncFinishedAt: string | null;
  };
  generatedAt: string;
}

export interface PublicMemberListItem {
  memberId: MemberId;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
}

export interface PublicMemberListView {
  items: PublicMemberListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  appliedQuery: {
    q: string;
    zone: string;
    status: string;
    tags: string[];
    sort: "recent" | "name";
    density: "comfy" | "dense" | "list";
  };
  generatedAt: string;
}

export interface PublicMemberProfile {
  memberId: MemberId;
  summary: MemberProfileSummary;
  publicSections: MemberProfileSection[];
  tags: Array<{ code: string; label: string; category: string }>;
}

export interface FormPreviewView {
  manifest: FormManifest;
  fields: FormFieldDefinition[];
  sectionCount: number;
  fieldCount: number;
  responderUrl: string;
}

export interface AdminDashboardView {
  totals: {
    members: number;
    pendingConsent: number;
    deletedMembers: number;
    queuedTagAssignments: number;
  };
  recentSubmissions: Array<{
    responseId: ResponseId;
    memberId: MemberId | null;
    submittedAt: string;
    fullName: string;
  }>;
  schemaState: "active" | "superseded" | "pending_review";
  generatedAt: string;
}

export interface AdminMemberListItem {
  memberId: MemberId;
  responseEmail: ResponseEmail;
  fullName: string;
  publicConsent: ConsentStatus;
  rulesConsent: ConsentStatus;
  publishState: PublishState;
  isDeleted: boolean;
  lastSubmittedAt: string;
}

export interface AdminMemberListView {
  total: number;
  members: AdminMemberListItem[];
}

export interface AdminMemberDetailView {
  identityMemberId: MemberId;
  identityEmail: ResponseEmail;
  status: {
    publicConsent: ConsentStatus;
    rulesConsent: ConsentStatus;
    publishState: PublishState;
    isDeleted: boolean;
  };
  profile: MemberProfile;
  audit: Array<{
    actor: AdminId;
    action: string;
    occurredAt: string;
    note: string | null;
  }>;
}

export interface AuthGateState {
  state: AuthGateStateValue;
  email: string | null;
  reason: string | null;
}
