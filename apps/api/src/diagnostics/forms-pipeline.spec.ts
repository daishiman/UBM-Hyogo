import { describe, expect, it } from "vitest";
import { deriveFormsPipelineHypotheses } from "./forms-pipeline";

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
