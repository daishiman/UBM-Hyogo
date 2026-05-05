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
    attendance: z.array(
      z.object({
        sessionId: z.string(),
        title: z.string(),
        heldOn: z.string(),
      }),
    ),
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

export const PublicMemberListItemZ = z.object({
  memberId: z.string().min(1),
  fullName: z.string(),
  nickname: z.string(),
  occupation: z.string(),
  location: z.string(),
  ubmZone: z.string().nullable(),
  ubmMembershipType: z.string().nullable(),
});

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
    generatedAt: Iso8601Z,
  })
  .strict();

export const PublicMemberProfileZ = z
  .object({
    memberId: z.string().min(1),
    summary: SummaryZ,
    publicSections: z.array(SectionZ),
    tags: z.array(
      z.object({
        code: z.string(),
        label: z.string(),
        category: z.string(),
      }),
    ),
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
    recentActions: z.array(
      z.object({
        auditId: z.string(),
        actorEmail: z.string().nullable(),
        action: z.string(),
        targetType: z.string(),
        targetId: z.string().nullable(),
        createdAt: Iso8601Z,
      }),
    ),
    generatedAt: Iso8601Z,
  })
  .strict();

export const AdminMemberListItemZ = z.object({
  memberId: z.string().min(1),
  responseEmail: EmailZ,
  fullName: z.string(),
  publicConsent: ConsentStatusZ,
  rulesConsent: ConsentStatusZ,
  publishState: PublishStateZ,
  isDeleted: z.boolean(),
  lastSubmittedAt: Iso8601Z,
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
