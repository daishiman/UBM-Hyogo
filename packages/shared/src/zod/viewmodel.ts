import { z } from "zod";

import {
  AnswerValueZ,
  AuthGateStateValueZ,
  ConsentStatusZ,
  EmailZ,
  FieldKindZ,
  FieldSourceZ,
  FieldVisibilityZ,
  Iso8601Z,
  PublishStateZ,
  StableKeyZ,
  TagSourceZ,
} from "./primitives";
import { FormFieldDefinitionZ, FormManifestZ } from "./schema";

const SectionFieldZ = z.object({
  stableKey: StableKeyZ,
  label: z.string(),
  value: AnswerValueZ,
  kind: FieldKindZ,
  visibility: FieldVisibilityZ,
  source: FieldSourceZ,
});

const SectionZ = z.object({
  key: z.string(),
  title: z.string(),
  fields: z.array(SectionFieldZ),
});

const SummaryZ = z.object({
  fullName: z.string(),
  nickname: z.string(),
  location: z.string(),
  occupation: z.string(),
  ubmZone: z.string().nullable(),
  ubmMembershipType: z.string().nullable(),
});

const AttendanceRecordZ = z.object({
  sessionId: z.string(),
  title: z.string(),
  heldOn: z.string(),
});

const AttendanceMetaZ = z.object({
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});

export const MemberProfileZ = z
  .object({
    memberId: z.string().min(1),
    responseId: z.string().min(1),
    responseEmail: EmailZ.nullable(),
    publicConsent: ConsentStatusZ,
    rulesConsent: ConsentStatusZ,
    publishState: PublishStateZ,
    isDeleted: z.boolean(),
    summary: SummaryZ,
    sections: z.array(SectionZ),
    attendance: z.array(AttendanceRecordZ),
    attendanceMeta: AttendanceMetaZ.optional(),
    tags: z.array(
      z.object({
        code: z.string(),
        label: z.string(),
        category: z.string(),
        source: TagSourceZ,
      }),
    ),
    lastSubmittedAt: Iso8601Z,
    editResponseUrl: z.string().url().nullable(),
  })
  .strict();

export const SessionUserZ = z
  .object({
    memberId: z.string().min(1),
    responseId: z.string().min(1),
    email: EmailZ,
    isAdmin: z.boolean(),
    authGateState: AuthGateStateValueZ.exclude(["input", "sent"]).nullable(),
  })
  .strict();

export const PublicStatsViewZ = z
  .object({
    memberCount: z.number().int().nonnegative(),
    publicMemberCount: z.number().int().nonnegative(),
    zoneBreakdown: z.array(
      z.object({ zone: z.string(), count: z.number().int().nonnegative() }),
    ),
    membershipBreakdown: z.array(
      z.object({ type: z.string(), count: z.number().int().nonnegative() }),
    ),
    meetingCountThisYear: z.number().int().nonnegative(),
    recentMeetings: z.array(
      z.object({
        sessionId: z.string(),
        title: z.string(),
        heldOn: z.string(),
      }),
    ),
    lastSync: z.object({
      schemaSync: z.enum(["ok", "running", "failed", "never"]),
      responseSync: z.enum(["ok", "running", "failed", "never"]),
      schemaSyncFinishedAt: z.string().nullable(),
      responseSyncFinishedAt: z.string().nullable(),
    }),
    generatedAt: Iso8601Z,
  })
  .strict();

export const PublicMemberTagZ = z.object({
  code: z.string(),
  label: z.string(),
  category: z.string(),
}).strict();
export type PublicMemberTag = z.infer<typeof PublicMemberTagZ>;

export const PublicMemberListItemZ = z
  .object({
    memberId: z.string().min(1),
    fullName: z.string(),
    nickname: z.string(),
    occupation: z.string(),
    location: z.string(),
    ubmZone: z.string().nullable(),
    ubmMembershipType: z.string().nullable(),
    // issue-1029: public-safe presigned photo URL（TTL 300s）。optional のため既存 parse 不変。
    photoUrl: z.string().url().optional(),
    // issue-224: expand=tags 指定時のみ付与（未指定時 undefined＝キー無し）。
    tags: z.array(PublicMemberTagZ).optional(),
    // public-home-member-card-info-and-tag-clarity: businessOverview 先頭行の公開一覧用要約。
    businessSummary: z.string().optional(),
  })
  .strict();

export const PublicMemberListViewZ = z
  .object({
    items: z.array(PublicMemberListItemZ),
    pagination: z.object({
      total: z.number().int().nonnegative(),
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      totalPages: z.number().int().nonnegative(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
    appliedQuery: z.object({
      q: z.string(),
      zone: z.string(),
      status: z.string(),
      tags: z.array(z.string()),
      sort: z.enum(["recent", "name"]),
      density: z.enum(["comfy", "dense", "list"]),
    }),
    topTags: z
      .array(
        z.object({
          code: z.string().min(1),
          label: z.string(),
          count: z.number().int().nonnegative(),
        }),
      )
      .max(20),
    generatedAt: Iso8601Z,
  })
  .strict();

export const PublicMemberProfileZ = z
  .object({
    memberId: z.string().min(1),
    summary: SummaryZ,
    publicSections: z.array(SectionZ),
    attendance: z.array(AttendanceRecordZ),
    attendanceMeta: AttendanceMetaZ.optional(),
    tags: z.array(
      z.object({
        code: z.string(),
        label: z.string(),
        category: z.string(),
      }),
    ),
    // issue-1029: public-safe presigned photo URL（TTL 300s）。optional のため既存 parse 不変。.strict() 維持。
    photoUrl: z.string().url().optional(),
  })
  .strict();

export const FormPreviewViewZ = z
  .object({
    manifest: FormManifestZ,
    fields: z.array(FormFieldDefinitionZ),
    sectionCount: z.number().int().nonnegative(),
    fieldCount: z.number().int().nonnegative(),
    responderUrl: z.string().url(),
  })
  .strict();

export const AdminDashboardViewZ = z
  .object({
    totals: z.object({
      totalMembers: z.number().int().nonnegative(),
      publicMembers: z.number().int().nonnegative(),
      untaggedMembers: z.number().int().nonnegative(),
      unresolvedSchema: z.number().int().nonnegative(),
    }),
    byStatus: z
      .array(
        z.object({
          status: PublishStateZ,
          count: z.number().int().nonnegative(),
        }),
      )
      .optional(),
    byZone: z
      .array(
        z.object({
          key: z.enum(["0to1", "1to10", "10to100"]),
          label: z.string().min(1),
          hint: z.string().min(1),
          count: z.number().int().nonnegative(),
          total: z.number().int().nonnegative(),
          tone: z.enum(["info", "accent", "ok"]),
        }),
      )
      .length(3)
      .optional(),
    recentActions: z.array(
      z.object({
        auditId: z.string(),
        actorEmail: z.string().nullable(),
        action: z.string(),
        // Read side accepts legacy values; append-side canonical values are
        // "member" | "admin_member_note" | "tag_queue" | "schema_diff" | "meeting" | "system".
        targetType: z.string(),
        targetId: z.string().nullable(),
        createdAt: Iso8601Z,
      }),
    ),
    generatedAt: Iso8601Z,
  })
  .strict();

export const AttendanceOverviewZ = z
  .object({
    totalSessions: z.number().int().nonnegative(),
    totalMembers: z.number().int().nonnegative(),
    overallRate: z.number().min(0).max(1),
  })
  .strict();

export const SessionAttendanceRowZ = z
  .object({
    sessionId: z.string().min(1),
    title: z.string(),
    heldOn: z.string().min(1),
    attendeeCount: z.number().int().nonnegative(),
    rate: z.number().min(0).max(1),
  })
  .strict();

export const MemberAttendanceRankingZ = z
  .object({
    memberId: z.string().min(1),
    displayName: z.string(),
    attendedCount: z.number().int().nonnegative(),
    rate: z.number().min(0).max(1),
  })
  .strict();

export const SessionAttendanceRowsZ = z.array(SessionAttendanceRowZ);
export const MemberAttendanceRankingRowsZ = z.array(MemberAttendanceRankingZ);

export type AttendanceOverviewView = z.infer<typeof AttendanceOverviewZ>;
export type SessionAttendanceRowView = z.infer<typeof SessionAttendanceRowZ>;
export type MemberAttendanceRankingView = z.infer<typeof MemberAttendanceRankingZ>;

export const AdminMemberListItemZ = z.object({
  memberId: z.string().min(1),
  responseEmail: EmailZ,
  fullName: z.string(),
  publicConsent: ConsentStatusZ,
  rulesConsent: ConsentStatusZ,
  publishState: PublishStateZ,
  isDeleted: z.boolean(),
  lastSubmittedAt: Iso8601Z,
  occupation: z.string().optional(),
  ubmZone: z.string().nullable().optional(),
  ubmMembershipType: z.string().nullable().optional(),
  tags: z.array(z.object({ code: z.string(), label: z.string() })).optional(),
  pendingRequestTypes: z
    .array(z.enum(["visibility_request", "delete_request"]))
    .default([]),
  updatedAt: Iso8601Z.optional(),
});

export const AdminMemberListViewZ = z
  .object({
    total: z.number().int().nonnegative(),
    members: z.array(AdminMemberListItemZ),
    // 06c-B: 検索/フィルタ拡張で導入。後方互換のため optional。
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
  })
  .strict();

export const AdminMemberDetailViewZ = z
  .object({
    identityMemberId: z.string().min(1),
    identityEmail: EmailZ,
    status: z.object({
      publicConsent: ConsentStatusZ,
      rulesConsent: ConsentStatusZ,
      publishState: PublishStateZ,
      isDeleted: z.boolean(),
      notificationOptOut: z.boolean(),
    }),
    profile: MemberProfileZ,
    audit: z.array(
      z.object({
        actor: z.string().min(1),
        action: z.string(),
        occurredAt: Iso8601Z,
        note: z.string().nullable(),
      }),
    ),
    // issue-983 AC-2: admin-managed member photo の presigned GET URL（TTL 300s）。
    // optional のため既存 parse は壊れない。.strict() は維持。
    photoUrl: z.string().url().optional(),
    // issue-1030: thumb variant の presigned GET URL（保存済 かつ presign 成功時のみ）。
    // optional・後方互換（thumb 未生成 / 旧行では undefined）。
    photoThumbUrl: z.string().url().optional(),
  })
  .strict();

export const AuthGateStateZ = z
  .object({
    state: AuthGateStateValueZ,
    email: z.string().nullable(),
    reason: z.string().nullable(),
  })
  .strict();

export const VIEWMODEL_PARSER_LIST = [
  "PublicStatsView",
  "PublicMemberListView",
  "PublicMemberProfile",
  "FormPreviewView",
  "SessionUser",
  "MemberProfile",
  "AdminDashboardView",
  "AdminMemberListView",
  "AdminMemberDetailView",
  "AuthGateState",
] as const;
