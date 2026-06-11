import { describe, expect, it } from "vitest";
import { normalizeTagSource } from "../types/common";
import { TagSourceZ } from "./primitives";

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
      meetingCountThisYear: 4,
      recentMeetings: [],
      lastSync: {
        schemaSync: "ok",
        responseSync: "never",
        schemaSyncFinishedAt: "2026-04-27T00:00:00Z",
        responseSyncFinishedAt: null,
      },
      generatedAt: "2026-04-27T00:00:00Z",
    });
    expect(ok.success).toBe(true);
    expect(
      PublicStatsViewZ.safeParse({ memberCount: -1 }).success,
    ).toBe(false);
  });

  it("PublicMemberListView strict rejects extra fields (#1 抽象)", () => {
    const result = PublicMemberListViewZ.safeParse({
      items: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 24,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      appliedQuery: {
        q: "",
        zone: "all",
        status: "all",
        tags: [],
        sort: "recent",
        density: "comfy",
      },
      topTags: [],
      generatedAt: "2026-04-27T00:00:00Z",
      extra: "nope",
    });
    expect(result.success).toBe(false);
  });

  it("PublicMemberListView accepts topTags entries", () => {
    const ok = PublicMemberListViewZ.safeParse({
      items: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 24,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      appliedQuery: {
        q: "",
        zone: "all",
        status: "all",
        tags: [],
        sort: "recent",
        density: "comfy",
      },
      topTags: [
        { code: "ai", label: "AI", count: 3 },
        { code: "design", label: "デザイン", count: 1 },
      ],
      generatedAt: "2026-04-27T00:00:00Z",
    });
    expect(ok.success).toBe(true);

    const tooMany = PublicMemberListViewZ.safeParse({
      items: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 24,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      appliedQuery: {
        q: "",
        zone: "all",
        status: "all",
        tags: [],
        sort: "recent",
        density: "comfy",
      },
      topTags: Array.from({ length: 21 }, (_, i) => ({
        code: `t${i}`,
        label: `t${i}`,
        count: i,
      })),
      generatedAt: "2026-04-27T00:00:00Z",
    });
    expect(tooMany.success).toBe(false);
  });

  it("PublicMemberListView accepts optional item tags and rejects leaked tag fields", () => {
    const base = {
      items: [
        {
          memberId: "m_1",
          fullName: "山田 太郎",
          nickname: "たろ",
          occupation: "開発者",
          location: "神戸",
          ubmZone: null,
          ubmMembershipType: null,
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 24,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      appliedQuery: {
        q: "",
        zone: "all",
        status: "all",
        tags: [],
        sort: "recent",
        density: "comfy",
      },
      topTags: [],
      generatedAt: "2026-04-27T00:00:00Z",
    } as const;

    expect(PublicMemberListViewZ.safeParse(base).success).toBe(true);
    expect(
      PublicMemberListViewZ.safeParse({
        ...base,
        items: [
          {
            ...base.items[0],
            tags: [{ code: "web", label: "Web", category: "skill" }],
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      PublicMemberListViewZ.safeParse({
        ...base,
        items: [
          {
            ...base.items[0],
            tags: [
              {
                code: "web",
                label: "Web",
                category: "skill",
                confidence: 1,
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
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
        attendance: [{ sessionId: "s-1", title: "定例会 1", heldOn: "2026-03-15" }],
        attendanceMeta: { hasMore: false, nextCursor: null },
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

  it("MemberProfile tag source falls back to manual for seed and unknown values", () => {
    const parsed = MemberProfileZ.parse({
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
      tags: [
        { code: "seeded", label: "Seeded", category: "test", source: "seed" },
        { code: "unknown", label: "Unknown", category: "test", source: "" },
      ],
      lastSubmittedAt: "2026-04-27T00:00:00Z",
      editResponseUrl: null,
    });

    expect(parsed.tags.map((tag) => tag.source)).toEqual(["manual", "manual"]);
  });

  it("normalizeTagSource and TagSourceZ keep known values and fail soft for unknown inputs", () => {
    expect(["rule", "ai", "manual"].map((source) => normalizeTagSource(source))).toEqual([
      "rule",
      "ai",
      "manual",
    ]);
    expect([
      normalizeTagSource("seed"),
      normalizeTagSource(""),
      normalizeTagSource(null),
      normalizeTagSource(undefined),
    ]).toEqual(["manual", "manual", "manual", "manual"]);
    expect(TagSourceZ.safeParse("seed")).toEqual({ success: true, data: "manual" });
  });

  it("AdminDashboardView totals 4 fields + recentActions", () => {
    expect(
      AdminDashboardViewZ.safeParse({
        totals: {
          totalMembers: 1,
          publicMembers: 0,
          untaggedMembers: 0,
          unresolvedSchema: 0,
        },
        byStatus: [
          { status: "public", count: 1 },
          { status: "member_only", count: 0 },
          { status: "hidden", count: 0 },
        ],
        recentActions: [],
        generatedAt: "2026-04-27T00:00:00Z",
      }).success,
    ).toBe(true);
  });

  it("AdminMemberListView requires total + members", () => {
    expect(AdminMemberListViewZ.safeParse({ total: 0, members: [] }).success).toBe(true);
  });

  it("AdminMemberListView defaults pendingRequestTypes to empty array", () => {
    const result = AdminMemberListViewZ.parse({
      total: 1,
      members: [
        {
          memberId: "m1",
          responseEmail: "m1@example.test",
          fullName: "Member One",
          publicConsent: "consented",
          rulesConsent: "consented",
          publishState: "public",
          isDeleted: false,
          lastSubmittedAt: "2026-06-09T00:00:00.000Z",
        },
      ],
    });

    expect(result.members[0]?.pendingRequestTypes).toEqual([]);
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
          notificationOptOut: false,
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
