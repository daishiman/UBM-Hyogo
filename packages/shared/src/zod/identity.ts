import { z } from "zod";

import {
  ConsentStatusZ,
  EmailZ,
  Iso8601Z,
  PublishStateZ,
  TagSourceZ,
} from "./primitives";

export const MemberIdentityZ = z.object({
  memberId: z.string().min(1),
  responseEmail: EmailZ,
  currentResponseId: z.string().min(1),
  firstResponseId: z.string().min(1),
  lastSubmittedAt: Iso8601Z,
  createdAt: Iso8601Z,
  updatedAt: Iso8601Z,
});

export const MemberStatusRecordZ = z.object({
  memberId: z.string().min(1),
  publicConsent: ConsentStatusZ,
  rulesConsent: ConsentStatusZ,
  publishState: PublishStateZ,
  isDeleted: z.boolean(),
  hiddenReason: z.string().nullable(),
  lastNotifiedAt: Iso8601Z.nullable(),
  updatedAt: Iso8601Z,
  updatedBy: z.string().nullable(),
});

export const DeletedMemberRecordZ = z.object({
  memberId: z.string().min(1),
  deletedAt: Iso8601Z,
  deletedBy: z.string().min(1),
  reason: z.string(),
});

export const MeetingSessionZ = z.object({
  sessionId: z.string().min(1),
  title: z.string(),
  heldOn: z.string().min(1),
  note: z.string().nullable(),
  createdAt: Iso8601Z,
  createdBy: z.string().min(1),
});

export const MemberAttendanceZ = z.object({
  memberId: z.string().min(1),
  sessionId: z.string().min(1),
  assignedAt: Iso8601Z,
  assignedBy: z.string().min(1),
});

export const TagDefinitionZ = z.object({
  tagId: z.string().min(1),
  code: z.string().min(1),
  label: z.string(),
  category: z.string(),
  sourceStableKeys: z.array(z.string()),
  active: z.boolean(),
});

export const MemberTagZ = z.object({
  memberId: z.string().min(1),
  tagId: z.string().min(1),
  source: TagSourceZ,
  confidence: z.number().min(0).max(1).nullable(),
  assignedAt: Iso8601Z,
  assignedBy: z.string().nullable(),
});

export const TagAssignmentQueueItemZ = z.object({
  queueId: z.string().min(1),
  memberId: z.string().min(1),
  responseId: z.string().min(1),
  status: z.enum(["queued", "reviewing", "resolved", "rejected"]),
  suggestedTags: z.array(z.string()),
  reason: z.string().nullable(),
  createdAt: Iso8601Z,
  updatedAt: Iso8601Z,
});
