#!/usr/bin/env node
import { createServer } from "node:http";

const PORT = Number(process.env.E2E_MOCK_API_PORT ?? 8787);
const NOW = "2026-05-09T00:00:00.000Z";

const member = {
  memberId: "m-1",
  fullName: "山田 太郎",
  nickname: "taro",
  occupation: "エンジニア",
  location: "兵庫県神戸市",
  ubmZone: "Kobe",
  ubmMembershipType: "regular",
};

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

const publicList = (url) => {
  const q = url.searchParams.get("q") ?? "";
  const densityRaw = url.searchParams.get("density") ?? "comfy";
  const density = ["comfy", "dense", "list"].includes(densityRaw) ? densityRaw : "comfy";
  const items = q === "zzz_no_match_zzz" ? [] : [member];
  return {
    items,
    pagination: {
      total: items.length,
      page: 1,
      limit: 24,
      totalPages: items.length > 0 ? 1 : 0,
      hasNext: false,
      hasPrev: false,
    },
    appliedQuery: {
      q,
      zone: url.searchParams.get("zone") ?? "all",
      status: url.searchParams.get("status") ?? "all",
      tags: url.searchParams.getAll("tag"),
      sort: url.searchParams.get("sort") === "name" ? "name" : "recent",
      density,
    },
    generatedAt: NOW,
  };
};

const publicProfile = {
  memberId: member.memberId,
  summary: {
    fullName: member.fullName,
    nickname: member.nickname,
    location: member.location,
    occupation: member.occupation,
    ubmZone: member.ubmZone,
    ubmMembershipType: member.ubmMembershipType,
  },
  publicSections: [
    {
      key: "profile",
      title: "プロフィール",
      fields: [
        {
          stableKey: "profile:introduction",
          label: "自己紹介",
          value: "UBM Hyogo member",
          kind: "longText",
          visibility: "public",
          source: "forms",
        },
      ],
    },
  ],
  attendance: [{ sessionId: "s-1", title: "定例会", heldOn: "2026-05-01" }],
  attendanceMeta: { hasMore: false, nextCursor: null },
  tags: [{ code: "engineer", label: "Engineer", category: "skill" }],
};

const adminMembers = {
  total: 1,
  page: 1,
  pageSize: 20,
  members: [
    {
      memberId: member.memberId,
      responseEmail: "member@example.test",
      fullName: member.fullName,
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      lastSubmittedAt: NOW,
    },
  ],
};

const meProfile = {
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
  editResponseUrl: "https://forms.example.test/edit",
  fallbackResponderUrl: "https://forms.example.test/responder",
  pendingRequests: {},
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  console.log(`${req.method} ${url.pathname}${url.search}`);

  if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true });
  if (req.method === "GET" && url.pathname === "/me") {
    return json(res, 200, {
      user: {
        memberId: "m-1",
        responseId: "r-1",
        email: "member@example.test",
        isAdmin: false,
        authGateState: "active",
      },
      authGateState: "active",
    });
  }
  if (req.method === "GET" && url.pathname === "/me/profile") return json(res, 200, meProfile);
  if (req.method === "POST" && url.pathname === "/me/visibility-request") {
    meProfile.pendingRequests.visibility = {
      queueId: "q1",
      status: "pending",
      createdAt: NOW,
      desiredState: "hidden",
    };
    return json(res, 202, { queueId: "q1", type: "visibility_request", status: "pending", createdAt: NOW });
  }
  if (req.method === "POST" && url.pathname === "/me/delete-request") {
    meProfile.pendingRequests.delete = { queueId: "q2", status: "pending", createdAt: NOW };
    return json(res, 202, { queueId: "q2", type: "delete_request", status: "pending", createdAt: NOW });
  }

  if (req.method === "GET" && url.pathname === "/public/stats") {
    return json(res, 200, {
      memberCount: 1,
      publicMemberCount: 1,
      zoneBreakdown: [{ zone: "Kobe", count: 1 }],
      membershipBreakdown: [{ type: "regular", count: 1 }],
      meetingCountThisYear: 1,
      recentMeetings: [],
      lastSync: { schemaSync: "ok", responseSync: "ok", schemaSyncFinishedAt: NOW, responseSyncFinishedAt: NOW },
      generatedAt: NOW,
    });
  }
  if (req.method === "GET" && url.pathname === "/public/members") return json(res, 200, publicList(url));
  if (req.method === "GET" && url.pathname === "/public/members/m-1") return json(res, 200, publicProfile);
  if (req.method === "GET" && url.pathname.startsWith("/public/members/")) return json(res, 404, { error: "NOT_FOUND" });
  if (req.method === "GET" && url.pathname === "/public/form-preview") {
    return json(res, 200, {
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
      responderUrl: "https://example.com/respond",
    });
  }

  if (req.method === "GET" && url.pathname === "/admin/dashboard") {
    return json(res, 200, {
      totals: { totalMembers: 1, publicMembers: 1, untaggedMembers: 0, unresolvedSchema: 0 },
      recentActions: [],
      generatedAt: NOW,
    });
  }
  if (req.method === "GET" && url.pathname === "/admin/members") return json(res, 200, adminMembers);
  if (req.method === "GET" && url.pathname === "/admin/tags/queue") return json(res, 200, { total: 0, items: [] });
  if (req.method === "GET" && url.pathname === "/admin/schema/diff") return json(res, 200, { total: 0, items: [] });
  if (req.method === "GET" && url.pathname === "/admin/meetings") return json(res, 200, { total: 0, items: [] });
  if (req.method === "POST" && /\/admin\/requests\/.+\/resolve$/.test(url.pathname)) return json(res, 200, { ok: true });
  if (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") return json(res, 200, { ok: true });

  return json(res, 404, { error: "MOCK_API_NOT_FOUND", path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`e2e mock API listening on http://127.0.0.1:${PORT}`);
});
