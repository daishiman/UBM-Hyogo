import { z } from "zod";

export const PublicStatsZ = z
  .object({
    memberCount: z.number().int().nonnegative(),
    publicMemberCount: z.number().int().nonnegative(),
    zoneBreakdown: z.array(z.object({ zone: z.string(), count: z.number().int() }).passthrough()),
    membershipBreakdown: z.array(z.object({ type: z.string(), count: z.number().int() }).passthrough()),
    meetingCountThisYear: z.number().int().nonnegative(),
    recentMeetings: z.array(z.unknown()),
    lastSync: z.unknown(),
    generatedAt: z.string(),
  })
  .passthrough();

export const PublicMemberListItemZ = z
  .object({
    memberId: z.string(),
    fullName: z.string(),
  })
  .passthrough();

export const PublicMemberListZ = z
  .object({
    items: z.array(PublicMemberListItemZ),
    pagination: z
      .object({
        total: z.number().int().nonnegative(),
        page: z.number().int(),
        limit: z.number().int(),
        totalPages: z.number().int(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      })
      .passthrough()
      .optional(),
    total: z.number().int().nonnegative().optional(),
  })
  .passthrough();

export const PublicMemberDetailZ = z
  .object({
    memberId: z.string(),
    summary: z
      .object({
        fullName: z.string(),
        nickname: z.string().nullable().optional(),
        location: z.string().optional(),
        occupation: z.string().optional(),
        ubmZone: z.string(),
        ubmMembershipType: z.string(),
      })
      .passthrough(),
    publicSections: z.array(z.unknown()),
  })
  .passthrough();

export const PublicFormPreviewZ = z
  .object({
    manifest: z.unknown().optional(),
    fields: z.array(z.unknown()).optional(),
    sectionCount: z.number().int().nonnegative().optional(),
    fieldCount: z.number().int().nonnegative().optional(),
    questionCount: z.number().int().nonnegative().optional(),
    responderUrl: z.string(),
  })
  .passthrough();
