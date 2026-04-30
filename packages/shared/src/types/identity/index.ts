import type {
  AdminId,
  MemberId,
  ResponseEmail,
  ResponseId,
  TagId,
} from "../../branded";
import type { ConsentStatus, PublishState, TagSource } from "../common";

export interface MemberIdentity {
  memberId: MemberId;
  responseEmail: ResponseEmail;
  currentResponseId: ResponseId;
  firstResponseId: ResponseId;
  lastSubmittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberStatusRecord {
  memberId: MemberId;
  publicConsent: ConsentStatus;
  rulesConsent: ConsentStatus;
  publishState: PublishState;
  isDeleted: boolean;
  hiddenReason: string | null;
  lastNotifiedAt: string | null;
  updatedAt: string;
  updatedBy: AdminId | null;
}

export interface DeletedMemberRecord {
  memberId: MemberId;
  deletedAt: string;
  deletedBy: AdminId;
  reason: string;
}

export interface MeetingSession {
  sessionId: string;
  title: string;
  heldOn: string;
  note: string | null;
  createdAt: string;
  createdBy: AdminId;
}

export interface MemberAttendance {
  memberId: MemberId;
  sessionId: string;
  assignedAt: string;
  assignedBy: AdminId;
}

export interface TagDefinition {
  tagId: TagId;
  code: string;
  label: string;
  category: string;
  sourceStableKeys: string[];
  active: boolean;
}

export interface MemberTag {
  memberId: MemberId;
  tagId: TagId;
  source: TagSource;
  confidence: number | null;
  assignedAt: string;
  assignedBy: AdminId | null;
}

export interface TagAssignmentQueueItem {
  queueId: string;
  memberId: MemberId;
  responseId: ResponseId;
  status: "queued" | "reviewing" | "resolved" | "rejected";
  suggestedTags: string[];
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}
