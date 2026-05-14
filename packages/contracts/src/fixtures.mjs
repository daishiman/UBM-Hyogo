// AC-4 canonical seed: 3 members / 2 zones / 2 memberships / negative query / 2 tag facets.
// Mock and contract test both import from here.
export const NOW = "2026-05-09T00:00:00.000Z";

const memberItems = [
  {
    memberId: "m-1",
    fullName: "山田 太郎",
    nickname: "taro",
    location: "兵庫県神戸市",
    occupation: "エンジニア",
    ubmZone: "Kobe",
    ubmMembershipType: "regular",
  },
  {
    memberId: "m-2",
    fullName: "佐藤 花子",
    nickname: "hana",
    location: "兵庫県姫路市",
    occupation: "医師",
    ubmZone: "Himeji",
    ubmMembershipType: "honorary",
  },
  {
    memberId: "m-3",
    fullName: "鈴木 次郎",
    nickname: null,
    location: "兵庫県姫路市",
    occupation: "教員",
    ubmZone: "Himeji",
    ubmMembershipType: "regular",
  },
];

export const fixtures = {
  me: {
    meResponse: {
      user: {
        memberId: "m-1",
        responseId: "r-1",
        email: "member@example.test",
        isAdmin: false,
        authGateState: "active",
      },
      authGateState: "active",
    },
    meProfileResponse: {
      profile: {
        sections: [],
        attendance: [],
        attendanceMeta: { hasMore: false, nextCursor: null },
      },
      statusSummary: {
        publicConsent: "consented",
        rulesConsent: "consented",
        publishState: "public",
        isDeleted: false,
      },
      editResponseUrl:
        "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform",
      fallbackResponderUrl:
        "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform",
      pendingRequests: {},
    },
  },
  public: {
    negativeQuery: "zzz_no_match_zzz",
    memberList: {
      items: memberItems,
      total: memberItems.length,
    },
    stats: {
      memberCount: 3,
      publicMemberCount: 3,
      zoneBreakdown: [
        { zone: "Kobe", count: 1 },
        { zone: "Himeji", count: 2 },
      ],
      membershipBreakdown: [
        { type: "regular", count: 2 },
        { type: "honorary", count: 1 },
      ],
      meetingCountThisYear: 1,
      recentMeetings: [],
      lastSync: {
        schemaSync: "ok",
        responseSync: "ok",
        schemaSyncFinishedAt: NOW,
        responseSyncFinishedAt: NOW,
      },
      generatedAt: NOW,
    },
    formPreview: {
      manifest: {
        formId: "form-1",
        title: "UBM 兵庫支部会 入会フォーム",
        revisionId: "rev-1",
        schemaHash: "hash-1",
        state: "active",
        syncedAt: NOW,
        sourceUrl: "https://example.com/form",
        fieldCount: 0,
        unknownFieldCount: 0,
      },
      fields: [],
      sectionCount: 0,
      fieldCount: 0,
      questionCount: 31,
      responderUrl:
        "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform",
    },
  },
  admin: {
    tagFacets: ["ABC法", "DEF法"],
    memberList: {
      total: 3,
      page: 1,
      pageSize: 50,
      members: [
        {
          memberId: "mem_alpha",
          responseEmail: "alpha@example.test",
          fullName: "青木 太郎",
          publicConsent: "consented",
          rulesConsent: "consented",
          publishState: "public",
          isDeleted: false,
          lastSubmittedAt: NOW,
        },
        {
          memberId: "mem_beta",
          responseEmail: "beta@example.test",
          fullName: "兵庫 花子",
          publicConsent: "consented",
          rulesConsent: "consented",
          publishState: "hidden",
          isDeleted: false,
          lastSubmittedAt: NOW,
        },
        {
          memberId: "mem_gamma",
          responseEmail: "gamma@example.test",
          fullName: "神戸 次郎",
          publicConsent: "unknown",
          rulesConsent: "consented",
          publishState: "member_only",
          isDeleted: false,
          lastSubmittedAt: NOW,
        },
      ],
    },
    dashboard: {
      totals: {
        totalMembers: 3,
        publicMembers: 2,
        untaggedMembers: 0,
        unresolvedSchema: 0,
      },
      recentActions: [],
      generatedAt: NOW,
    },
    memberPatchResponse: {
      memberId: "m-1",
      updatedAt: NOW,
    },
    auditList: { items: [], total: 0, nextCursor: null },
  },
  identityConflicts: {
    list: {
      items: [
        {
          conflictId: "cf_001",
          sourceMemberId: "m_src_01",
          candidateTargetMemberId: "m_dst_01",
          matchedFields: ["name", "affiliation"],
          detectedAt: "2026-05-08T00:00:00Z",
          responseEmailMasked: "t***@example.com",
          syncJobId: "sync_001",
        },
        {
          conflictId: "cf_002",
          sourceMemberId: "m_src_02",
          candidateTargetMemberId: "m_dst_02",
          matchedFields: ["name"],
          detectedAt: "2026-05-08T01:00:00Z",
          responseEmailMasked: "h***@example.com",
          syncJobId: null,
        },
      ],
      total: 2,
      nextCursor: null,
    },
    mergeRequest: { targetMemberId: "m_dst_01", reason: "duplicate" },
    mergeResponse: {
      targetMemberId: "m_dst_01",
      archivedSourceMemberId: "m_src_01",
      mergedAt: "2026-05-09T00:00:00Z",
      auditId: "aud_merge_001",
    },
    dismissRequest: { reason: "false-positive" },
    dismissResponse: { dismissedAt: "2026-05-09T00:00:00Z" },
  },
};
