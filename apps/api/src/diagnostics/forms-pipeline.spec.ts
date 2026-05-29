import { describe, expect, it } from "vitest";
import {
  buildDiagnosisSummary,
  deriveFormsPipelineHypotheses,
} from "./forms-pipeline";

describe("deriveFormsPipelineHypotheses", () => {
  it("flags ingest, visibility, identity, and alias causes independently", () => {
    const flags = deriveFormsPipelineHypotheses({
      counts: {
        formResponses: 0,
        responseFields: 0,
        members: 3,
        memberIdentities: 2,
      },
      latestSyncRuns: [{ status: "error" }],
      aliasPendingCount: 4,
      publicVisibility: {
        totalMembers: 3,
        publicConsentTrue: 0,
        publishedTrue: 0,
        visibleOnPublicDirectory: 0,
        allHiddenByPublishState: true,
      },
      identityHealth: {
        totalIdentities: 2,
        identitiesWithoutMember: 0,
        membersWithoutIdentity: 1,
      },
    });

    expect(flags).toEqual({
      H1_ingestNeverRanOrAllErrors: true,
      H2_identityMismatchSuspected: true,
      H3_allHiddenByPublishState: true,
      H4_aliasPendingNonZero: true,
    });
  });

  it("flags H1 when response rows exist but the sync ledger is empty", () => {
    const flags = deriveFormsPipelineHypotheses({
      counts: {
        formResponses: 1,
        responseFields: 31,
        members: 1,
        memberIdentities: 1,
      },
      latestSyncRuns: [],
      aliasPendingCount: 0,
      publicVisibility: {
        totalMembers: 1,
        publicConsentTrue: 1,
        publishedTrue: 1,
        visibleOnPublicDirectory: 1,
        allHiddenByPublishState: false,
      },
      identityHealth: {
        totalIdentities: 1,
        identitiesWithoutMember: 0,
        membersWithoutIdentity: 0,
      },
    });

    expect(flags.H1_ingestNeverRanOrAllErrors).toBe(true);
  });
});

describe("buildDiagnosisSummary (members-not-displaying Task A)", () => {
  const baseFlags = {
    H1_ingestNeverRanOrAllErrors: false,
    H2_identityMismatchSuspected: false,
    H3_allHiddenByPublishState: false,
    H4_aliasPendingNonZero: false,
  };
  const baseConsent = { consented: 1, declined: 0, unknown: 0 };
  const basePublish = {
    public: 1,
    member_only: 0,
    hidden: 0,
    legacy_published: 0,
    legacy_private: 0,
  };

  it("H1 が立っていればその旨を含める", () => {
    const s = buildDiagnosisSummary({
      hypothesisFlags: { ...baseFlags, H1_ingestNeverRanOrAllErrors: true },
      visiblePublicCount: 0,
      publishStateBreakdown: basePublish,
      publicConsentBreakdown: baseConsent,
    });
    expect(s).toMatch(/H1/);
  });

  it("可視 0 + consent 0 のときは『公開同意ユーザーが存在しない』を含める", () => {
    const s = buildDiagnosisSummary({
      hypothesisFlags: baseFlags,
      visiblePublicCount: 0,
      publishStateBreakdown: basePublish,
      publicConsentBreakdown: { consented: 0, declined: 0, unknown: 5 },
    });
    expect(s).toMatch(/公開同意/);
  });

  it("legacy_published のみで canonical=0 を検知する", () => {
    const s = buildDiagnosisSummary({
      hypothesisFlags: baseFlags,
      visiblePublicCount: 0,
      publishStateBreakdown: {
        public: 0,
        member_only: 0,
        hidden: 0,
        legacy_published: 3,
        legacy_private: 0,
      },
      publicConsentBreakdown: { consented: 3, declined: 0, unknown: 0 },
    });
    expect(s).toMatch(/legacy/);
  });

  it("仮説 0 件 + visible>0 のときは異常無しを示す", () => {
    const s = buildDiagnosisSummary({
      hypothesisFlags: baseFlags,
      visiblePublicCount: 12,
      publishStateBreakdown: basePublish,
      publicConsentBreakdown: baseConsent,
    });
    expect(s).toMatch(/異常は検出されません/);
  });
});
