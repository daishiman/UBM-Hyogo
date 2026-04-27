import { describe, expect, it } from "vitest";

import {
  AdminDashboardViewZ,
  AdminMemberDetailViewZ,
  AdminMemberListViewZ,
  AuthGateStateZ,
  FormPreviewViewZ,
  MemberProfileZ,
  PublicMemberListViewZ,
  PublicMemberProfileZ,
  PublicStatsViewZ,
  SessionUserZ,
  VIEWMODEL_PARSER_LIST,
} from "./viewmodel";

describe("viewmodel parsers — 10 種 (AC-4 / 不変条件 #1)", () => {
  it("VIEWMODEL_PARSER_LIST has 10 entries", () => {
    expect(VIEWMODEL_PARSER_LIST).toHaveLength(10);
  });

  it("PublicStatsView parses valid + rejects invalid", () => {
    const ok = PublicStatsViewZ.safeParse({
      memberCount: 100,
      publicMemberCount: 80,
      zoneBreakdown: [{ zone: "0_to_1", count: 30 }],
      membershipBreakdown: [{ type: "member", count: 70 }],
      generatedAt: "2026-04-27T00:00:00Z",
    });
    expect(ok.success).toBe(true);
    expect(
      PublicStatsViewZ.safeParse({ memberCount: -1 }).success,
    ).toBe(false);
  });

  it("PublicMemberListView strict rejects extra fields (#1 抽象)", () => {
    const result = PublicMemberListViewZ.safeParse({
      total: 0,
      members: [],
      generatedAt: "2026-04-27T00:00:00Z",
      extra: "nope",
    });
    expect(result.success).toBe(false);
  });

  it("PublicMemberProfile parses minimal valid", () => {
    expect(
      PublicMemberProfileZ.safeParse({
        memberId: "m_1",
        summary: {
          fullName: "山田 太郎",
          nickname: "たろ",
          location: "神戸",
          occupation: "開発者",
          ubmZone: null,
          ubmMembershipType: null,
        },
        publicSections: [],
        tags: [],
      }).success,
    ).toBe(true);
  });

  it("FormPreviewView requires manifest + fields + responderUrl", () => {
    expect(FormPreviewViewZ.safeParse({}).success).toBe(false);
  });

  it("SessionUser excludes input/sent from authGateState", () => {
    expect(
      SessionUserZ.safeParse({
        memberId: "m_1",
        responseId: "r_1",
        email: "a@example.com",
        isAdmin: false,
        authGateState: "input",
      }).success,
    ).toBe(false);
    expect(
      SessionUserZ.safeParse({
        memberId: "m_1",
        responseId: "r_1",
        email: "a@example.com",
        isAdmin: false,
        authGateState: null,
      }).success,
    ).toBe(true);
  });

  it("MemberProfile requires summary + sections (#1)", () => {
    expect(MemberProfileZ.safeParse({}).success).toBe(false);
  });

  it("AdminDashboardView totals 4 fields", () => {
    expect(
      AdminDashboardViewZ.safeParse({
        totals: {
          members: 1,
          pendingConsent: 0,
          deletedMembers: 0,
          queuedTagAssignments: 0,
        },
        recentSubmissions: [],
        schemaState: "active",
        generatedAt: "2026-04-27T00:00:00Z",
      }).success,
    ).toBe(true);
  });

  it("AdminMemberListView requires total + members", () => {
    expect(AdminMemberListViewZ.safeParse({ total: 0, members: [] }).success).toBe(true);
  });

  it("AdminMemberDetailView strict rejects extra fields", () => {
    expect(
      AdminMemberDetailViewZ.safeParse({
        identityMemberId: "m_1",
        identityEmail: "a@example.com",
        status: {
          publicConsent: "consented",
          rulesConsent: "consented",
          publishState: "public",
          isDeleted: false,
        },
        profile: {
          memberId: "m_1",
          responseId: "r_1",
          responseEmail: "a@example.com",
          publicConsent: "consented",
          rulesConsent: "consented",
          publishState: "public",
          isDeleted: false,
          summary: {
            fullName: "山田",
            nickname: "y",
            location: "兵庫",
            occupation: "dev",
            ubmZone: null,
            ubmMembershipType: null,
          },
          sections: [],
          attendance: [],
          tags: [],
          lastSubmittedAt: "2026-04-27T00:00:00Z",
          editResponseUrl: null,
        },
        audit: [],
      }).success,
    ).toBe(true);
  });

  it("AuthGateState accepts all 5 state values", () => {
    for (const s of [
      "input",
      "sent",
      "unregistered",
      "rules_declined",
      "deleted",
    ] as const) {
      expect(
        AuthGateStateZ.safeParse({ state: s, email: null, reason: null })
          .success,
      ).toBe(true);
    }
  });
});
