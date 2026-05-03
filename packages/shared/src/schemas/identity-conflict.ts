// issue-194-03b-followup-001-email-conflict-identity-merge
// admin identity merge / dismiss の request / response schema (zod)
import { z } from "zod";

export const IdentityConflictMatchedFieldZ = z.union([
  z.literal("name"),
  z.literal("affiliation"),
]);
export type IdentityConflictMatchedField = z.infer<typeof IdentityConflictMatchedFieldZ>;

export const IdentityConflictRowZ = z.object({
  conflictId: z.string().min(1),
  sourceMemberId: z.string().min(1),
  candidateTargetMemberId: z.string().min(1),
  matchedFields: z.array(IdentityConflictMatchedFieldZ),
  detectedAt: z.string().min(1),
  responseEmailMasked: z.string().min(1),
  syncJobId: z.string().nullable(),
});
export type IdentityConflictRow = z.infer<typeof IdentityConflictRowZ>;

export const ListIdentityConflictsResponseZ = z.object({
  items: z.array(IdentityConflictRowZ),
  nextCursor: z.string().nullable(),
});
export type ListIdentityConflictsResponse = z.infer<typeof ListIdentityConflictsResponseZ>;

export const MergeIdentityRequestZ = z.object({
  targetMemberId: z.string().min(1),
  reason: z.string().min(1).max(500),
});
export type MergeIdentityRequest = z.infer<typeof MergeIdentityRequestZ>;

export const MergeIdentityResponseZ = z.object({
  mergedAt: z.string().min(1),
  targetMemberId: z.string().min(1),
  archivedSourceMemberId: z.string().min(1),
  auditId: z.string().min(1),
});
export type MergeIdentityResponse = z.infer<typeof MergeIdentityResponseZ>;

export const DismissIdentityConflictRequestZ = z.object({
  reason: z.string().min(1).max(500),
});
export type DismissIdentityConflictRequest = z.infer<typeof DismissIdentityConflictRequestZ>;

export const DismissIdentityConflictResponseZ = z.object({
  dismissedAt: z.string().min(1),
});
export type DismissIdentityConflictResponse = z.infer<typeof DismissIdentityConflictResponseZ>;

/**
 * responseEmail を admin UI 上で部分マスク表示するための helper。
 * 不変条件 #3 (PII 取扱) 遵守。
 *   - `user@example.com` -> `u***@example.com`
 *   - 短い local part (1 文字以下) は `*@example.com`
 *   - email 形式でない値はそのまま `***` を返す（防御的）
 */
export function maskResponseEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 1) return `*${domain}`;
  return `${local[0]}***${domain}`;
}
