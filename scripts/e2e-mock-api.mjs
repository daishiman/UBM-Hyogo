#!/usr/bin/env node
// e2e-mock-api: Playwright E2E 用 deterministic mock API.
// stateful 部分（pending requests / attendance）は in-memory + reset endpoint で管理する。
// 不変条件: D1 を一切触らず、Worker の API surface を再現する。
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

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,cookie",
};

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json", ...CORS_HEADERS });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += String(chunk);
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });

const state = {
  pendingRequests: {},
  attendance: new Set(), // `${sessionId}:${memberId}`
  adminDashboardUnresolvedSchema: 0,
};

const resetState = () => {
  state.pendingRequests = {};
  state.attendance = new Set();
  state.adminDashboardUnresolvedSchema = 0;
};

const buildPublicProfile = (id) => ({
  memberId: id,
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
    {
      key: "activity",
      title: "活動",
      fields: [
        {
          stableKey: "activity:summary",
          label: "活動サマリ",
          value: "アクティブ",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
      ],
    },
  ],
  attendance: [{ sessionId: "s-1", title: "定例会", heldOn: "2026-05-01" }],
  attendanceMeta: { hasMore: false, nextCursor: null },
  tags: [{ code: "engineer", label: "Engineer", category: "skill" }],
});

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

// /admin/schema/diff: 6 セクション (テスト admin-pages.spec.ts:13 が toHaveCount(6) を要求)
const adminSchemaDiff = {
  total: 0,
  items: [],
  sections: Array.from({ length: 6 }, (_, i) => ({
    sectionKey: `section-${i + 1}`,
    title: `セクション${i + 1}`,
    fields: [],
  })),
};

// /admin/meetings + /admin/meetings/:id: attendance 候補 6 名 (m-1..m-5 + m-6 deleted)
const meetingsList = {
  total: 1,
  items: [
    {
      sessionId: "sess-1",
      title: "5月定例会",
      heldOn: "2026-05-01",
      attendanceCount: 0,
    },
  ],
};

const meetingDetail = (sessionId) => ({
  sessionId,
  title: "5月定例会",
  heldOn: "2026-05-01",
  candidates: [
    { memberId: "m-1", fullName: "山田 太郎", isDeleted: false },
    { memberId: "m-2", fullName: "鈴木 花子", isDeleted: false },
    { memberId: "m-3", fullName: "佐藤 次郎", isDeleted: false },
    { memberId: "m-4", fullName: "田中 三郎", isDeleted: false },
    // m-5 deleted は候補に含めない (UI 側 第2防御)
  ],
  attendees: [...state.attendance]
    .filter((k) => k.startsWith(`${sessionId}:`))
    .map((k) => ({ memberId: k.split(":")[1] })),
});

const adminRequests = {
  ok: true,
  items: [],
  nextCursor: null,
  appliedFilters: { status: "pending", type: "visibility_request" },
};

const meSession = {
  user: {
    memberId: "m-1",
    responseId: "r-1",
    email: "member@example.test",
    isAdmin: false,
    authGateState: "active",
  },
  authGateState: "active",
};

const buildMeProfile = (url) => {
  const seedPending = url?.searchParams.get("seedPending");
  const pending = { ...state.pendingRequests };
  if (seedPending === "visibility" && !pending.visibility) {
    pending.visibility = {
      queueId: "qseed",
      status: "pending",
      createdAt: NOW,
      desiredState: "hidden",
    };
  }
  if (seedPending === "delete" && !pending.delete) {
    pending.delete = { queueId: "qseed", status: "pending", createdAt: NOW };
  }
  return {
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
    pendingRequests: pending,
  };
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const { pathname } = url;
  console.log(`${req.method} ${pathname}${url.search}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // ---- internal control endpoints ----
  if (req.method === "POST" && pathname === "/__test__/reset") {
    resetState();
    return json(res, 200, { ok: true });
  }
  if (req.method === "POST" && pathname === "/__test__/seed-pending") {
    const body = await readBody(req);
    if (body.visibility) {
      state.pendingRequests.visibility = {
        queueId: "qseed",
        status: "pending",
        createdAt: NOW,
        desiredState: body.visibility.desiredState ?? "hidden",
      };
    }
    if (body.delete) {
      state.pendingRequests.delete = {
        queueId: "qseed",
        status: "pending",
        createdAt: NOW,
      };
    }
    return json(res, 200, { ok: true, pendingRequests: state.pendingRequests });
  }
  if (req.method === "POST" && pathname === "/__test__/admin-dashboard") {
    const body = await readBody(req);
    if (typeof body.unresolvedSchema === "number") {
      state.adminDashboardUnresolvedSchema = body.unresolvedSchema;
    }
    return json(res, 200, { ok: true, adminDashboardUnresolvedSchema: state.adminDashboardUnresolvedSchema });
  }

  if (req.method === "GET" && pathname === "/health") return json(res, 200, { ok: true });

  // ---- /me ----
  if (req.method === "GET" && pathname === "/me") return json(res, 200, meSession);
  if (req.method === "GET" && pathname === "/me/profile") return json(res, 200, buildMeProfile(url));

  if (req.method === "POST" && pathname === "/me/visibility-request") {
    const body = await readBody(req);
    if (body.reason === "__invalid__") return json(res, 422, { error: "INVALID_REQUEST" });
    if (body.reason === "__server__") return json(res, 500, { error: "UPSTREAM_500" });
    if (state.pendingRequests.visibility) {
      return json(res, 409, { error: "DUPLICATE_PENDING_REQUEST" });
    }
    state.pendingRequests.visibility = {
      queueId: "q1",
      status: "pending",
      createdAt: NOW,
      desiredState: "hidden",
    };
    return json(res, 202, {
      queueId: "q1",
      type: "visibility_request",
      status: "pending",
      createdAt: NOW,
    });
  }
  if (req.method === "POST" && pathname === "/me/delete-request") {
    if (state.pendingRequests.delete) {
      return json(res, 409, { error: "DUPLICATE_PENDING_REQUEST" });
    }
    state.pendingRequests.delete = {
      queueId: "q2",
      status: "pending",
      createdAt: NOW,
    };
    return json(res, 202, {
      queueId: "q2",
      type: "delete_request",
      status: "pending",
      createdAt: NOW,
    });
  }

  // ---- /public ----
  if (req.method === "GET" && pathname === "/public/stats") {
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
  if (req.method === "GET" && pathname === "/public/members") return json(res, 200, publicList(url));
  if (req.method === "GET" && pathname.startsWith("/public/members/")) {
    const id = pathname.slice("/public/members/".length);
    if (id.startsWith("__") || id === "non-existent" || id === "definitely-not-exist") {
      return json(res, 404, { error: "NOT_FOUND" });
    }
    return json(res, 200, buildPublicProfile(id));
  }
  if (req.method === "GET" && pathname === "/public/form-preview") {
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
      responderUrl:
        "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform",
    });
  }

  // ---- /admin ----
  if (req.method === "GET" && pathname === "/admin/dashboard") {
    return json(res, 200, {
      totals: {
        totalMembers: 1,
        publicMembers: 1,
        untaggedMembers: 0,
        unresolvedSchema: state.adminDashboardUnresolvedSchema,
      },
      recentActions: [],
      generatedAt: NOW,
    });
  }
  if (req.method === "GET" && pathname === "/admin/members") return json(res, 200, adminMembers);
  if (req.method === "GET" && pathname === "/admin/tags/queue") return json(res, 200, { total: 0, items: [] });
  if (req.method === "GET" && pathname === "/admin/schema/diff") return json(res, 200, adminSchemaDiff);
  if (req.method === "GET" && pathname === "/admin/schema") return json(res, 200, adminSchemaDiff);
  if (req.method === "GET" && pathname === "/admin/meetings") return json(res, 200, meetingsList);
  if (req.method === "GET" && pathname.startsWith("/admin/meetings/")) {
    const id = pathname.slice("/admin/meetings/".length);
    return json(res, 200, meetingDetail(id));
  }
  if (req.method === "POST" && pathname.startsWith("/admin/meetings/") && pathname.endsWith("/attendance")) {
    const sessionId = pathname.split("/")[3];
    const body = await readBody(req);
    const memberId = body.memberId;
    if (!memberId) return json(res, 400, { error: "BAD_REQUEST" });
    const key = `${sessionId}:${memberId}`;
    if (state.attendance.has(key)) {
      return json(res, 409, { error: "DUPLICATE_ATTENDANCE" });
    }
    state.attendance.add(key);
    return json(res, 201, { sessionId, memberId, registeredAt: NOW });
  }
  if (req.method === "GET" && pathname === "/admin/requests") return json(res, 200, adminRequests);
  if (req.method === "POST" && /\/admin\/requests\/.+\/resolve$/.test(pathname)) return json(res, 200, { ok: true });
  if (req.method === "GET" && pathname === "/admin/identity-conflicts") return json(res, 200, { items: [], nextCursor: null });
  if (req.method === "GET" && pathname === "/admin/audit") return json(res, 200, { items: [], nextCursor: null });

  if (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") return json(res, 200, { ok: true });

  return json(res, 404, { error: "MOCK_API_NOT_FOUND", path: pathname });
});

server.listen(PORT, () => {
  console.log(`e2e mock API listening on http://127.0.0.1:${PORT}`);
});
