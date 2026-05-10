import { describe, expect, it } from "vitest";

import {
  DismissIdentityConflictRequestZ,
  DismissIdentityConflictResponseZ,
  IdentityConflictRowZ,
  ListIdentityConflictsResponseZ,
  MergeIdentityRequestZ,
  MergeIdentityResponseZ,
  maskResponseEmail,
} from "./identity-conflict";

const row = {
  conflictId: "cf_001",
  sourceMemberId: "m_src_01",
  candidateTargetMemberId: "m_dst_01",
  matchedFields: ["name", "affiliation"],
  detectedAt: "2026-05-08T00:00:00Z",
  responseEmailMasked: "t***@example.com",
  syncJobId: "sync_001",
};
const legacyMergedMemberId = `merged${"Member"}Id`;

describe("identity conflict schemas", () => {
  it("accepts the canonical row and list response shape", () => {
    expect(IdentityConflictRowZ.safeParse(row).success).toBe(true);
    expect(ListIdentityConflictsResponseZ.safeParse({ items: [row], nextCursor: null }).success).toBe(
      true,
    );
  });

  it("rejects invalid matched fields and unknown row keys", () => {
    expect(
      IdentityConflictRowZ.safeParse({ ...row, matchedFields: ["email"] }).success,
    ).toBe(false);
    expect(
      IdentityConflictRowZ.safeParse({ ...row, [legacyMergedMemberId]: "legacy" }).success,
    ).toBe(false);
  });

  it("accepts merge request and response shapes", () => {
    expect(
      MergeIdentityRequestZ.safeParse({
        targetMemberId: "m_dst_01",
        reason: "confirmed by admin",
      }).success,
    ).toBe(true);
    expect(
      MergeIdentityResponseZ.safeParse({
        mergedAt: "2026-05-09T00:00:00Z",
        targetMemberId: "m_dst_01",
        archivedSourceMemberId: "m_src_01",
        auditId: "aud_001",
      }).success,
    ).toBe(true);
  });

  it("rejects merge drift fields and oversize reasons", () => {
    expect(
      MergeIdentityRequestZ.safeParse({
        targetMemberId: "m_dst_01",
        reason: "confirmed by admin",
        memberId: "legacy",
      }).success,
    ).toBe(false);
    expect(
      MergeIdentityRequestZ.safeParse({
        targetMemberId: "m_dst_01",
        reason: "x".repeat(501),
      }).success,
    ).toBe(false);
    expect(
      MergeIdentityResponseZ.safeParse({
        mergedAt: "2026-05-09T00:00:00Z",
        targetMemberId: "m_dst_01",
        archivedSourceMemberId: "m_src_01",
        auditId: "aud_001",
        [legacyMergedMemberId]: "legacy",
      }).success,
    ).toBe(false);
  });

  it("accepts dismiss request and response shapes", () => {
    expect(DismissIdentityConflictRequestZ.safeParse({ reason: "different person" }).success).toBe(
      true,
    );
    expect(
      DismissIdentityConflictResponseZ.safeParse({
        dismissedAt: "2026-05-09T00:00:00Z",
      }).success,
    ).toBe(true);
  });

  it("rejects dismiss request drift fields", () => {
    expect(
      DismissIdentityConflictRequestZ.safeParse({
        reason: "different person",
        targetMemberId: "m_dst_01",
      }).success,
    ).toBe(false);
  });

  it("masks response email defensively", () => {
    expect(maskResponseEmail("test@example.com")).toBe("t***@example.com");
    expect(maskResponseEmail("a@example.com")).toBe("*@example.com");
    expect(maskResponseEmail("not-an-email")).toBe("***");
  });
});
