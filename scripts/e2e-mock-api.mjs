#!/usr/bin/env node
// e2e-mock-api: Playwright E2E 用 deterministic mock API.
// stateful 部分（pending requests / attendance）は in-memory + reset endpoint で管理する。
// 不変条件:
//   - D1 を一切触らない（既存）
//   - Worker の API surface を再現する（既存）
//   - issue-667: response は packages/contracts の zod schema で safeParse して返す
//     parse 失敗時は HTTP 500 + { error, zodIssues } を返す（fail-fast）
//   - {ok:true} 200 fallthrough は廃止（未定義 path/method は 404）
import { createServer } from "node:http";
import { schemas, fixtures } from "../packages/contracts/src/index.mjs";

const PORT = Number(process.env.E2E_MOCK_API_PORT ?? 8787);
const NOW = "2026-05-09T00:00:00.000Z";

const primaryMember = fixtures.public.memberList.items[0];

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,cookie",
};

const writeJson = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json", ...CORS_HEADERS });
  res.end(JSON.stringify(body));
};

// safeJson: schema が指定された場合は parse を必ず通す。失敗時は 500 + zodIssues。
const safeJson = (res, status, body, schema) => {
  if (schema) {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      writeJson(res, 500, {
        error: "mock_schema_violation",
        zodIssues: parsed.error.issues,
      });
      return;
    }
  }
  writeJson(res, status, body);
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

const defaultMeetingsSeed = () => ({
  members: [
    { memberId: "m-1", fullName: "青木 太郎" },
    { memberId: "m-2", fullName: "兵庫 花子" },
    { memberId: "m-3", fullName: "神戸 次郎" },
    { memberId: "m-5", fullName: "削除済み 会員", isDeleted: true },
  ],
  meetings: [
    {
      sessionId: "sess-1",
      title: "2026年5月 定例会",
      heldOn: "2026-05-15",
      note: "attendance visual smoke fixture",
      createdAt: "2026-05-15T00:00:00.000Z",
      candidates: [
        { memberId: "m-1", fullName: "青木 太郎" },
        { memberId: "m-2", fullName: "兵庫 花子" },
        { memberId: "m-3", fullName: "神戸 次郎" },
        { memberId: "m-5", fullName: "削除済み 会員", isDeleted: true },
      ],
      attendees: [{ memberId: "m-1", assignedAt: "2026-05-15T00:00:00.000Z" }],
    },
  ],
});

const state = {
  pendingRequests: {},
  attendance: new Set(), // `${sessionId}:${memberId}`
  adminDashboardUnresolvedSchema: 0,
  meetingsSeed: defaultMeetingsSeed(),
};

const resetState = () => {
  state.pendingRequests = {};
  state.attendance = new Set();
  state.adminDashboardUnresolvedSchema = 0;
  state.meetingsSeed = defaultMeetingsSeed();
};

const buildPublicProfile = (id) => ({
  memberId: id,
  summary: {
    fullName: primaryMember.fullName,
    nickname: primaryMember.nickname,
    location: primaryMember.location,
    occupation: primaryMember.occupation,
    ubmZone: primaryMember.ubmZone,
    ubmMembershipType: primaryMember.ubmMembershipType,
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
  const items = q === fixtures.public.negativeQuery ? [] : fixtures.public.memberList.items;
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

const adminMembersBase = [
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
];

const adminMembersResponse = (search) => {
  const q = search?.get("q") ?? "";
  const filter = search?.get("filter") ?? "";
  let members = q === "zzzzz" ? [] : adminMembersBase;
  if (filter === "published") members = members.filter((m) => m.publishState === "public");
  return { total: members.length, page: 1, pageSize: 50, members };
};

const adminMemberDetail = (memberId) => ({
  identityMemberId: memberId,
  identityEmail: `${memberId}@example.test`,
  status: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
  },
  audit: [
    {
      occurredAt: NOW,
      actor: "admin@example.test",
      action: "admin.member.status_updated",
      note: "fixture",
    },
  ],
});

const adminSchemaDiff = {
  total: 0,
  items: [],
  sections: Array.from({ length: 6 }, (_, i) => ({
    sectionKey: `section-${i + 1}`,
    title: `セクション${i + 1}`,
    fields: [],
  })),
};

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

  // ---- internal control endpoints (parse 対象外) ----
  if (req.method === "GET" && pathname === "/__test__/health") {
    return writeJson(res, 200, { ok: true });
  }
  if (req.method === "POST" && pathname === "/__test__/reset") {
    resetState();
    return writeJson(res, 200, { ok: true });
  }
  if (req.method === "POST" && pathname === "/__test__/seed-meetings") {
    const body = await readBody(req);
    if (body && Array.isArray(body.meetings)) {
      state.meetingsSeed = body;
    }
    return writeJson(res, 200, { ok: true });
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
    return writeJson(res, 200, { ok: true, pendingRequests: state.pendingRequests });
  }
  if (req.method === "POST" && pathname === "/__test__/admin-dashboard") {
    const body = await readBody(req);
    if (typeof body.unresolvedSchema === "number") {
      state.adminDashboardUnresolvedSchema = body.unresolvedSchema;
    }
    return writeJson(res, 200, {
      ok: true,
      adminDashboardUnresolvedSchema: state.adminDashboardUnresolvedSchema,
    });
  }

  // /health: status field を含む（contract test の string match 対象）
  if (req.method === "GET" && pathname === "/health") {
    return writeJson(res, 200, { ok: true, status: "ok", ts: NOW });
  }

  // ---- /me ----
  if (req.method === "GET" && pathname === "/me") {
    return safeJson(res, 200, meSession, schemas.MeResponseZ);
  }
  if (req.method === "GET" && pathname === "/me/profile") {
    return safeJson(res, 200, buildMeProfile(url), schemas.MeProfileResponseZ);
  }

  if (req.method === "POST" && pathname === "/me/visibility-request") {
    const body = await readBody(req);
    if (body.reason === "__invalid__") return writeJson(res, 422, { error: "INVALID_REQUEST" });
    if (body.reason === "__server__") return writeJson(res, 500, { error: "UPSTREAM_500" });
    if (state.pendingRequests.visibility) {
      return writeJson(res, 409, { error: "DUPLICATE_PENDING_REQUEST" });
    }
    state.pendingRequests.visibility = {
      queueId: "q1",
      status: "pending",
      createdAt: NOW,
      desiredState: "hidden",
    };
    return safeJson(
      res,
      202,
      {
        queueId: "q1",
        type: "visibility_request",
        status: "pending",
        createdAt: NOW,
      },
      schemas.MeQueueAcceptedResponseZ,
    );
  }
  if (req.method === "POST" && pathname === "/me/delete-request") {
    if (state.pendingRequests.delete) {
      return writeJson(res, 409, { error: "DUPLICATE_PENDING_REQUEST" });
    }
    state.pendingRequests.delete = {
      queueId: "q2",
      status: "pending",
      createdAt: NOW,
    };
    return safeJson(
      res,
      202,
      {
        queueId: "q2",
        type: "delete_request",
        status: "pending",
        createdAt: NOW,
      },
      schemas.MeQueueAcceptedResponseZ,
    );
  }

  // ---- /public ----
  if (req.method === "GET" && pathname === "/public/stats") {
    return safeJson(res, 200, fixtures.public.stats, schemas.PublicStatsZ);
  }
  if (req.method === "GET" && pathname === "/public/members") {
    return safeJson(res, 200, publicList(url), schemas.PublicMemberListZ);
  }
  if (req.method === "GET" && pathname.startsWith("/public/members/")) {
    const id = pathname.slice("/public/members/".length);
    if (id.startsWith("__") || id === "non-existent" || id === "definitely-not-exist") {
      return writeJson(res, 404, { error: "NOT_FOUND" });
    }
    return safeJson(res, 200, buildPublicProfile(id), schemas.PublicMemberDetailZ);
  }
  if (req.method === "GET" && pathname === "/public/form-preview") {
    return safeJson(res, 200, fixtures.public.formPreview, schemas.PublicFormPreviewZ);
  }

  // ---- /admin ----
  if (req.method === "GET" && pathname === "/admin/dashboard") {
    return safeJson(
      res,
      200,
      {
        totals: {
          totalMembers: 1,
          publicMembers: 1,
          untaggedMembers: 0,
          unresolvedSchema: state.adminDashboardUnresolvedSchema,
        },
        recentActions: [],
        generatedAt: NOW,
      },
      schemas.AdminDashboardZ,
    );
  }
  if (req.method === "GET" && pathname === "/admin/members") {
    return safeJson(res, 200, adminMembersResponse(url.searchParams), schemas.AdminMemberListZ);
  }
  {
    const detail = pathname.match(/^\/admin\/members\/([^/]+)$/);
    if (req.method === "GET" && detail?.[1]) {
      return safeJson(res, 200, adminMemberDetail(detail[1]), schemas.AdminMemberDetailZ);
    }
    if ((req.method === "PATCH" || req.method === "POST") && detail?.[1]) {
      await readBody(req);
      return safeJson(
        res,
        200,
        { memberId: detail[1], updatedAt: NOW },
        schemas.AdminMemberPatchResponseZ,
      );
    }
  }
  if (req.method === "GET" && pathname === "/admin/tags/queue") {
    return safeJson(res, 200, { total: 0, items: [] }, schemas.AdminTagQueueZ);
  }
  if (req.method === "GET" && pathname === "/admin/schema/diff") {
    return safeJson(res, 200, adminSchemaDiff, schemas.AdminSchemaDiffZ);
  }
  if (req.method === "GET" && pathname === "/admin/schema") {
    return safeJson(res, 200, adminSchemaDiff, schemas.AdminSchemaZ);
  }
  if (req.method === "GET" && pathname === "/admin/meetings") {
    return writeJson(res, 200, {
      total: state.meetingsSeed.meetings.length,
      items: state.meetingsSeed.meetings.map((meeting) => ({
        sessionId: meeting.sessionId,
        title: meeting.title,
        heldOn: meeting.heldOn,
        note: meeting.note,
        createdAt: meeting.createdAt,
        attendance: meeting.attendees,
      })),
    });
  }
  if (
    req.method === "GET" &&
    pathname.startsWith("/admin/meetings/") &&
    !pathname.endsWith("/attendance") &&
    !pathname.endsWith("/attendances")
  ) {
    const id = decodeURIComponent(pathname.slice("/admin/meetings/".length));
    const meeting = state.meetingsSeed.meetings.find((m) => m.sessionId === id);
    if (!meeting) return writeJson(res, 404, { error: "meeting_not_found" });
    return writeJson(res, 200, {
      sessionId: meeting.sessionId,
      title: meeting.title,
      heldOn: meeting.heldOn,
      candidates: meeting.candidates,
      attendees: meeting.attendees,
    });
  }
  // /attendances (plural) — new contract used by feat(attendance) wave
  {
    const match = pathname.match(/^\/admin\/meetings\/([^/]+)\/attendances$/);
    if (req.method === "POST" && match) {
      const sessionId = decodeURIComponent(match[1]);
      const body = await readBody(req);
      const memberId = body?.memberId;
      const attended = body?.attended;
      if (!memberId || typeof attended !== "boolean") {
        return writeJson(res, 400, { error: "invalid_attendance_body" });
      }
      const meeting = state.meetingsSeed.meetings.find((m) => m.sessionId === sessionId);
      if (!meeting) return writeJson(res, 404, { error: "meeting_not_found" });
      const candidate = meeting.candidates.find((m) => m.memberId === memberId);
      if (!candidate) return writeJson(res, 404, { error: "member_not_found" });
      if (candidate.isDeleted) return writeJson(res, 422, { error: "member_deleted" });
      const exists = meeting.attendees.some((a) => a.memberId === memberId);
      if (attended && exists) {
        return writeJson(res, 409, { error: "attendance_already_recorded" });
      }
      if (attended) {
        meeting.attendees = [
          ...meeting.attendees,
          { memberId, assignedAt: NOW, assignedBy: "admin-1" },
        ];
        return writeJson(res, 200, { ok: true, attended: true });
      }
      meeting.attendees = meeting.attendees.filter((a) => a.memberId !== memberId);
      return writeJson(res, 200, { ok: true, attended: false });
    }
  }
  // legacy /attendance (singular) — back-compat for older specs
  if (req.method === "POST" && pathname.startsWith("/admin/meetings/") && pathname.endsWith("/attendance")) {
    const sessionId = pathname.split("/")[3];
    const body = await readBody(req);
    const memberId = body.memberId;
    if (!memberId) return writeJson(res, 400, { error: "BAD_REQUEST" });
    const key = `${sessionId}:${memberId}`;
    if (state.attendance.has(key)) {
      return writeJson(res, 409, { error: "DUPLICATE_ATTENDANCE" });
    }
    state.attendance.add(key);
    return safeJson(
      res,
      201,
      { sessionId, memberId, registeredAt: NOW },
      schemas.AdminAttendanceResponseZ,
    );
  }
  if (req.method === "GET" && pathname === "/admin/requests") {
    return safeJson(res, 200, adminRequests, schemas.AdminRequestListZ);
  }
  if (req.method === "POST" && /\/admin\/requests\/.+\/resolve$/.test(pathname)) {
    await readBody(req);
    return safeJson(
      res,
      200,
      { resolvedAt: NOW, ok: true },
      schemas.AdminRequestResolveResponseZ,
    );
  }

  // ---- /admin/identity-conflicts ----
  if (req.method === "GET" && pathname === "/admin/identity-conflicts") {
    return safeJson(res, 200, fixtures.identityConflicts.list, schemas.IdentityConflictListZ);
  }
  {
    const mergeMatch = pathname.match(/^\/admin\/identity-conflicts\/([^/]+)\/merge$/);
    if (req.method === "POST" && mergeMatch) {
      const body = await readBody(req);
      const parsed = schemas.MergeIdentityRequestZ.safeParse(body);
      if (!parsed.success) {
        return writeJson(res, 400, { error: "invalid_body", zodIssues: parsed.error.issues });
      }
      return safeJson(
        res,
        200,
        fixtures.identityConflicts.mergeResponse,
        schemas.MergeIdentityResponseZ,
      );
    }
    const dismissMatch = pathname.match(/^\/admin\/identity-conflicts\/([^/]+)\/dismiss$/);
    if (req.method === "POST" && dismissMatch) {
      const body = await readBody(req);
      const parsed = schemas.DismissIdentityConflictRequestZ.safeParse(body);
      if (!parsed.success) {
        return writeJson(res, 400, { error: "invalid_body", zodIssues: parsed.error.issues });
      }
      return safeJson(
        res,
        200,
        fixtures.identityConflicts.dismissResponse,
        schemas.DismissIdentityConflictResponseZ,
      );
    }
  }

  if (req.method === "GET" && pathname === "/admin/audit") {
    return safeJson(res, 200, fixtures.admin.auditList, schemas.AdminAuditListZ);
  }

  // 未定義 path/method: {ok:true} fallthrough を廃止し、404 を返す
  return writeJson(res, 404, { error: "MOCK_API_NOT_FOUND", method: req.method, path: pathname });
});

server.listen(PORT, () => {
  console.log(`e2e mock API listening on http://127.0.0.1:${PORT}`);
});
