import { z } from "zod";

export const AdminDashboardZ = z
  .object({
    totals: z
      .object({
        totalMembers: z.number().int().nonnegative(),
        publicMembers: z.number().int().nonnegative(),
        untaggedMembers: z.number().int().nonnegative().optional(),
        unresolvedSchema: z.number().int().nonnegative(),
      })
      .passthrough(),
    recentActions: z.array(z.unknown()),
    generatedAt: z.string(),
  })
  .passthrough();

const AdminMemberItemZ = z
  .object({
    memberId: z.string(),
    responseEmail: z.string().optional(),
    fullName: z.string(),
    publicConsent: z.string(),
    rulesConsent: z.string(),
    publishState: z.string(),
    isDeleted: z.boolean(),
    lastSubmittedAt: z.string().optional(),
  })
  .passthrough();

export const AdminMemberListZ = z
  .object({
    total: z.number().int().nonnegative(),
    page: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    members: z.array(AdminMemberItemZ),
  })
  .passthrough();

export const AdminMemberDetailZ = z
  .object({
    identityMemberId: z.string(),
    identityEmail: z.string().optional(),
    status: z
      .object({
        publicConsent: z.string(),
        rulesConsent: z.string(),
        publishState: z.string(),
        isDeleted: z.boolean(),
      })
      .passthrough(),
    audit: z.array(z.unknown()),
  })
  .passthrough();

export const AdminMemberPatchResponseZ = z
  .object({
    memberId: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const AdminTagQueueZ = z
  .object({
    total: z.number().int().nonnegative(),
    items: z.array(z.unknown()),
  })
  .passthrough();

export const AdminSchemaZ = z
  .object({
    total: z.number().int().nonnegative(),
    items: z.array(z.unknown()),
    sections: z.array(z.unknown()),
  })
  .passthrough();

export const AdminSchemaDiffZ = AdminSchemaZ;

const AdminMeetingItemZ = z
  .object({
    sessionId: z.string(),
    title: z.string(),
    heldOn: z.string(),
    attendanceCount: z.number().int().nonnegative().optional(),
  })
  .passthrough();

export const AdminMeetingListZ = z
  .object({
    total: z.number().int().nonnegative(),
    items: z.array(AdminMeetingItemZ),
  })
  .passthrough();

export const AdminMeetingDetailZ = z
  .object({
    sessionId: z.string(),
    title: z.string(),
    heldOn: z.string(),
    candidates: z.array(z.unknown()),
    attendees: z.array(z.unknown()),
  })
  .passthrough();

export const AdminAttendanceResponseZ = z
  .object({
    sessionId: z.string(),
    memberId: z.string(),
    registeredAt: z.string(),
  })
  .passthrough();

export const AdminRequestListZ = z
  .object({
    ok: z.boolean().optional(),
    items: z.array(z.unknown()),
    nextCursor: z.string().nullable().optional(),
    appliedFilters: z.unknown().optional(),
  })
  .passthrough();

export const AdminRequestResolveResponseZ = z
  .object({
    resolvedAt: z.string().optional(),
    ok: z.boolean().optional(),
  })
  .passthrough();

export const AdminAuditListZ = z
  .object({
    items: z.array(z.unknown()),
    nextCursor: z.string().nullable().optional(),
    total: z.number().int().nonnegative().optional(),
  })
  .passthrough();
