import { z } from "zod";

export const MergeIdentityRequestZ = z
  .object({
    targetMemberId: z.string().min(1),
    sourceMemberId: z.string().optional(),
    strategy: z.enum(["merge_profile", "keep_separate"]).optional(),
    reason: z.string().max(500).optional(),
  })
  .passthrough();

export const DismissIdentityConflictRequestZ = z
  .object({
    reason: z.string().min(1).max(500),
  })
  .passthrough();

export const IdentityConflictItemZ = z
  .object({
    conflictId: z.string(),
    sourceMemberId: z.string(),
    candidateTargetMemberId: z.string(),
    matchedFields: z.array(z.string()),
    detectedAt: z.string(),
    responseEmailMasked: z.string().optional(),
    syncJobId: z.string().nullable().optional(),
  })
  .passthrough();

export const IdentityConflictListZ = z
  .object({
    items: z.array(IdentityConflictItemZ),
    total: z.number().int().nonnegative().optional(),
    nextCursor: z.string().nullable().optional(),
  })
  .passthrough();

export const MergeIdentityResponseZ = z
  .object({
    targetMemberId: z.string(),
    archivedSourceMemberId: z.string().optional(),
    mergedAt: z.string(),
    auditId: z.string().optional(),
  })
  .passthrough();

export const DismissIdentityConflictResponseZ = z
  .object({
    dismissedAt: z.string(),
  })
  .passthrough();
