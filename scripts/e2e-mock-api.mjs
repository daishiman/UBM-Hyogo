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
// 会員一覧「最終更新」列の JST 秒表記を検証する e2e
// (admin-members-timestamp-jst-identity-labels.spec.ts) は mem_alpha の
// UTC 正午 = JST「2026年5月9日 21:00:00」が一覧に一意で現れることを assert する。
// auth.ts フィクスチャと同じく base 会員ごとに異なる日付を与え、mem_alpha の
// 値が他会員・seed 会員(NOW=深夜0時)と重複しないようにする（重複すると
// getByText が strict mode violation になる）。
const MEMBER_LAST_SUBMITTED_AT = {
  alpha: "2026-05-09T12:00:00.000Z", // → 2026年5月9日 21:00:00 (e2e の一意期待値)
  beta: "2026-05-08T12:00:00.000Z", // → 2026年5月8日 21:00:00
  gamma: "2026-05-07T12:00:00.000Z", // → 2026年5月7日 21:00:00
};

const primaryMember = fixtures.public.memberList.items[0];
const publicPhotoUrl =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5NiA5NiI+PHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiByeD0iNDgiIGZpbGw9IiMwMDY0N0EiLz48Y2lyY2xlIGN4PSI0OCIgY3k9IjM2IiByPSIxOCIgZmlsbD0iI0ZGRjNGMCIvPjxwYXRoIGQ9Ik0xOCA4NGMwLTE5IDEzLTM0IDMwLTM0czMwIDE1IDMwIDM0IiBmaWxsPSIjRkZGM0YwIi8+PC9zdmc+";

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
    { memberId: "m-1", fullName: "出席候補 一郎" },
    { memberId: "m-2", fullName: "出席候補 二郎" },
    { memberId: "m-3", fullName: "出席候補 三郎" },
    { memberId: "m-5", fullName: "出席候補 五郎(削除済)", isDeleted: true },
  ],
  meetings: [
    {
      sessionId: "sess-1",
      title: "2026年5月 定例会",
      heldOn: "2026-05-15",
      note: "attendance visual smoke fixture",
      createdAt: "2026-05-15T00:00:00.000Z",
      candidates: [
        { memberId: "m-1", fullName: "出席候補 一郎" },
        { memberId: "m-2", fullName: "出席候補 二郎" },
        { memberId: "m-3", fullName: "出席候補 三郎" },
        { memberId: "m-5", fullName: "出席候補 五郎(削除済)", isDeleted: true },
      ],
      attendees: [{ memberId: "m-1", assignedAt: "2026-05-15T00:00:00.000Z" }],
    },
  ],
});

const state = {
  pendingRequests: {},
  attendance: new Set(), // `${sessionId}:${memberId}`
  adminDashboardUnresolvedSchema: 0,
  adminDashboardByZone: undefined,
  adminDashboardByStatus: undefined,
  meetingsSeed: defaultMeetingsSeed(),
  publicHomeEmpty: false,
  // admin attendance dashboard fixture scenario（auth.ts in-process mock と同一契約）
  attendanceDashboardScenario: "all-ok",
  // public member detail fixture scenario（auth.ts in-process mock と同一契約）
  publicMemberDetailScenario: "full",
};

const resetState = () => {
  state.pendingRequests = {};
  state.attendance = new Set();
  state.adminDashboardUnresolvedSchema = 0;
  state.adminDashboardByZone = undefined;
  state.adminDashboardByStatus = undefined;
  state.meetingsSeed = defaultMeetingsSeed();
  state.publicHomeEmpty = false;
  state.attendanceDashboardScenario = "all-ok";
  state.publicMemberDetailScenario = "full";
};

const defaultAdminDashboardByZone = () => [
  { key: "0to1", label: "0→1", hint: "立ち上げ", count: 3, total: 11, tone: "info" },
  { key: "1to10", label: "1→10", hint: "拡大", count: 7, total: 11, tone: "accent" },
  { key: "10to100", label: "10→100", hint: "組織化", count: 1, total: 11, tone: "ok" },
];

// ---- admin attendance dashboard fixtures（auth.ts in-process mock と同一契約）----
const attendanceFilterEcho = () => ({
  periodFrom: null,
  periodTo: null,
  zoneFilter: null,
});
const attendanceOverviewBody = () => ({
  totalSessions: 12,
  totalMembers: 30,
  overallRate: 0.75,
  uniqueAttendeeCount: 24,
  uniqueAttendanceRate: 0.8,
  filter: attendanceFilterEcho(),
  previousPeriodRate: 0.68,
});
const attendanceBySessionBody = () => {
  if (state.attendanceDashboardScenario === "by-session-empty") return [];
  return [
    {
      sessionId: "session-2026-04",
      title: "2026年4月 定例会",
      heldOn: "2026-04-10",
      attendeeCount: 24,
      rate: 0.8,
    },
    {
      sessionId: "session-2026-05",
      title: "2026年5月 定例会",
      heldOn: "2026-05-10",
      attendeeCount: 18,
      rate: 0.6,
    },
  ];
};
const attendanceRankingBody = () => [
  { memberId: "mem_alpha", displayName: "青木 太郎", attendedCount: 9, rate: 0.9 },
  { memberId: "mem_beta", displayName: "兵庫 花子", attendedCount: 7, rate: 0.7 },
  { memberId: "mem_gamma", displayName: "神戸 次郎", attendedCount: 5, rate: 0.5 },
];
const attendanceTrendBody = () => ({
  granularity: "month",
  buckets: [
    { period: "2026-04", attendeeCount: 24, sessionCount: 1, uniqueMemberCount: 24 },
    { period: "2026-05", attendeeCount: 18, sessionCount: 1, uniqueMemberCount: 18 },
  ],
  filter: attendanceFilterEcho(),
});
const attendanceZoneDistributionBody = () => ({
  rows: [
    { zone: "zone_0", attendeeCount: 6, rate: 0.2 },
    { zone: "zone_1_9", attendeeCount: 21, rate: 0.7 },
    { zone: "zone_10_99", attendeeCount: 3, rate: 0.1 },
    { zone: "zone_100_plus", attendeeCount: 0, rate: 0 },
    { zone: "unknown", attendeeCount: 0, rate: 0 },
  ],
  filter: attendanceFilterEcho(),
});
const attendanceAbsenteesBody = () => ({
  rows: [
    {
      memberId: "mem_delta",
      displayName: "西宮 三郎",
      zone: "zone_0",
      lastAttendedAt: null,
      missedCount: 3,
    },
  ],
  lastN: 3,
  filter: attendanceFilterEcho(),
});

const publicStats = () => ({
  ...fixtures.public.stats,
  publicMemberCount: state.publicHomeEmpty ? 0 : fixtures.public.stats.publicMemberCount,
  recentMeetings: state.publicHomeEmpty
    ? []
    : [
        {
          sessionId: "session-public-home-202605",
          title: "2026年5月 定例会",
          heldOn: "2026-05-09",
        },
      ],
});

// public member detail を scenario 別に構築する（auth.ts in-process mock の
// publicMemberProfileBody と同一契約）。full / message-hidden は survey 全項目を
// publicSections に充填し、sparse は profile 基本2項目のみへ縮約する。
const buildPublicProfile = (id) => {
  const scenario = state.publicMemberDetailScenario;
  const full = scenario === "full";
  const messageHidden = scenario === "message-hidden";
  const richFields =
    full || messageHidden
      ? [
          {
            stableKey: "hometown",
            label: "出身地",
            value: "兵庫県明石市",
            kind: "shortText",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "businessOverview",
            label: "ビジネス概要",
            value:
              "神戸を拠点に、中小企業向けの業務改善とWebサービス開発を支援しています。",
            kind: "paragraph",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "skills",
            label: "スキル",
            value: "TypeScript / Cloudflare Workers / 業務フロー設計",
            kind: "paragraph",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "canProvide",
            label: "提供できること",
            value: "Webアプリの要件整理、業務自動化の壁打ち、地域事業者向けDX相談",
            kind: "paragraph",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "hobbies",
            label: "趣味",
            value: "登山、コーヒー、地域イベント巡り",
            kind: "shortText",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "recentInterest",
            label: "最近の関心",
            value: "地域コミュニティとAI活用",
            kind: "shortText",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "motto",
            label: "座右の銘",
            value: "小さく試して、早く学ぶ",
            kind: "shortText",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "otherActivities",
            label: "その他の活動",
            value: "商店街の勉強会運営と学生向けプログラミング相談",
            kind: "paragraph",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "urlWebsite",
            label: "Webサイト",
            value: "https://example.test/sample-001",
            kind: "url",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "urlOthers",
            label: "その他リンク",
            value: "Podcast: https://podcast.example.test/sample-001",
            kind: "paragraph",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "selfIntroduction",
            label: "自己紹介",
            value: messageHidden
              ? ""
              : "UBM兵庫で、地域の事業者同士が実務の知恵を持ち寄れる場を育てたいです。",
            kind: "paragraph",
            visibility: "public",
            source: "forms",
          },
        ]
      : [];
  return {
    memberId: id,
    summary: {
      fullName: "佐藤 サンプル",
      nickname: "sample",
      location: "兵庫県神戸市",
      occupation: "事業開発",
      ubmZone: "Kobe",
      ubmMembershipType: "regular",
    },
    publicSections: [
      {
        key: "profile",
        title: "プロフィール",
        fields: [
          {
            stableKey: "fullName",
            label: "氏名",
            value: "佐藤 サンプル",
            kind: "shortText",
            visibility: "public",
            source: "forms",
          },
          {
            stableKey: "nickname",
            label: "ニックネーム",
            value: "sample",
            kind: "shortText",
            visibility: "public",
            source: "forms",
          },
          ...richFields,
        ],
      },
    ],
    attendance: [
      { sessionId: "session_task18", title: "2026年5月 定例会", heldOn: "2026-05-12" },
    ],
    attendanceMeta: { hasMore: false, nextCursor: null },
    tags: [{ code: "kobe", label: "Kobe", category: "zone" }],
    photoUrl: publicPhotoUrl,
  };
};

const publicList = (url) => {
  const q = url.searchParams.get("q") ?? "";
  const densityRaw = url.searchParams.get("density") ?? "comfy";
  const density = ["comfy", "dense", "list"].includes(densityRaw) ? densityRaw : "comfy";
  const items =
    state.publicHomeEmpty || q === fixtures.public.negativeQuery
      ? []
      : fixtures.public.memberList.items.map((item, index) =>
          index === 0 ? { ...item, photoUrl: publicPhotoUrl } : item,
        );
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
    topTags: [
      { code: "ai", label: "AI", count: 12 },
      { code: "design", label: "Design", count: 9 },
      { code: "startup", label: "Startup", count: 8 },
      { code: "kobe", label: "Kobe", count: 7 },
      { code: "dx", label: "DX", count: 6 },
      { code: "community", label: "Community", count: 5 },
    ],
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
    lastSubmittedAt: MEMBER_LAST_SUBMITTED_AT.alpha,
  },
  {
    memberId: "mem_beta",
    responseEmail: "beta@example.test",
    fullName: "兵庫 花子",
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "hidden",
    isDeleted: false,
    lastSubmittedAt: MEMBER_LAST_SUBMITTED_AT.beta,
  },
  {
    memberId: "mem_gamma",
    responseEmail: "gamma@example.test",
    fullName: "神戸 次郎",
    publicConsent: "unknown",
    rulesConsent: "consented",
    publishState: "member_only",
    isDeleted: false,
    lastSubmittedAt: MEMBER_LAST_SUBMITTED_AT.gamma,
  },
];

const seedMembersAsAdmin = () => {
  return (state.meetingsSeed?.members ?? []).map((m) => ({
    memberId: m.memberId,
    responseEmail: `${m.memberId}@example.test`,
    fullName: m.fullName,
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: m.isDeleted === true,
    lastSubmittedAt: NOW,
  }));
};

const adminMembersResponse = (search) => {
  const q = search?.get("q") ?? "";
  const filter = search?.get("filter") ?? "";
  let members = q === "zzzzz" ? [] : [...adminMembersBase, ...seedMembersAsAdmin()];
  if (filter === "published") members = members.filter((m) => m.publishState === "public");
  return { total: members.length, page: 1, pageSize: 50, members };
};

// 会員ドロワーの「診断情報」パネル(MemberDiagnosticsPanel)は
// GET /admin/diagnostics/member/:id を browser fetch する。route が無いと 404 で
// パネルがエラー表示になり「診断情報」見出しが描画されない
// (admin-members-timestamp-jst-identity-labels.spec.ts:99 が fail)。
// auth.ts フィクスチャの diagnosticsMemberBody と同形状で 200 を返す。
const adminMemberDiagnosis = (memberId) => ({
  capturedAt: NOW,
  memberId,
  identityMatches: {
    byEmail: true,
    byExternalId: true,
    matchedFormResponseId: `response-${memberId}`,
  },
  responseFieldCount: 29,
  expectedFieldCount: 31,
  missingFieldKeys: ["ubm_membership_type", "introduction"],
  consent: {
    publicConsent: true,
    rulesConsent: true,
  },
  publishState: {
    published: true,
    visibleOnPublicDirectory: true,
  },
  hypothesisFlags: {
    H2_identityMissing: false,
    H3_hiddenByConsentOrPublish: false,
    H4_missingFieldsNonEmpty: true,
  },
});

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

const adminSchemaDiff = () => {
  const queuedCount = state.adminDashboardUnresolvedSchema;
  return {
    total: queuedCount,
    items: Array.from({ length: queuedCount }, (_, i) => {
      const n = String(i + 1).padStart(3, "0");
      return {
        diffId: `mock_schema_${n}`,
        revisionId: "rev_mock",
        type: "unresolved",
        questionId: `q_mock_${n}`,
        stableKey: null,
        label: `Mock schema diff ${i + 1}`,
        suggestedStableKey: null,
        status: "queued",
        resolvedBy: null,
        resolvedAt: null,
        createdAt: `2026-05-10T00:${String(i).padStart(2, "0")}:00.000Z`,
      };
    }),
    sections: Array.from({ length: 6 }, (_, i) => ({
      sectionKey: `section-${i + 1}`,
      title: `セクション${i + 1}`,
      fields: [],
    })),
  };
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
  if (req.method === "POST" && pathname === "/__test__/public-home") {
    const body = await readBody(req);
    state.publicHomeEmpty = body.empty === true;
    return writeJson(res, 200, { ok: true, publicHomeEmpty: state.publicHomeEmpty });
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
    if (Array.isArray(body.byZone)) {
      state.adminDashboardByZone = body.byZone;
    }
    return writeJson(res, 200, {
      ok: true,
      adminDashboardUnresolvedSchema: state.adminDashboardUnresolvedSchema,
      adminDashboardByZone: state.adminDashboardByZone ?? defaultAdminDashboardByZone(),
    });
  }
  if (req.method === "POST" && pathname === "/__test__/admin-dashboard-by-status") {
    const body = await readBody(req);
    if (body && Array.isArray(body.slices)) {
      state.adminDashboardByStatus = body.slices;
    } else {
      state.adminDashboardByStatus = undefined;
    }
    return writeJson(res, 200, {
      ok: true,
      adminDashboardByStatus: state.adminDashboardByStatus ?? null,
    });
  }
  if (req.method === "POST" && pathname === "/__test__/attendance-dashboard") {
    const body = await readBody(req);
    const scenario = body && body.scenario;
    if (
      scenario !== "all-ok" &&
      scenario !== "overview-error" &&
      scenario !== "by-session-empty"
    ) {
      return writeJson(res, 400, { error: "invalid_attendance_dashboard_scenario" });
    }
    state.attendanceDashboardScenario = scenario;
    return writeJson(res, 200, { ok: true });
  }
  if (req.method === "POST" && pathname === "/__test__/public-member-detail") {
    const body = await readBody(req);
    const scenario = body && body.scenario;
    if (
      scenario !== "full" &&
      scenario !== "sparse" &&
      scenario !== "message-hidden"
    ) {
      return writeJson(res, 400, {
        error: "invalid_public_member_detail_scenario",
      });
    }
    state.publicMemberDetailScenario = scenario;
    return writeJson(res, 200, { ok: true, scenario: state.publicMemberDetailScenario });
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
    return safeJson(res, 200, publicStats(), schemas.PublicStatsZ);
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
        byZone: state.adminDashboardByZone ?? defaultAdminDashboardByZone(),
        ...(state.adminDashboardByStatus ? { byStatus: state.adminDashboardByStatus } : {}),
      },
      schemas.AdminDashboardZ,
    );
  }
  // admin attendance dashboard GET endpoints（auth.ts in-process mock と同一契約）
  if (req.method === "GET" && pathname === "/admin/dashboard/attendance/overview") {
    if (state.attendanceDashboardScenario === "overview-error") {
      return writeJson(res, 500, { error: "fixture_overview_error" });
    }
    return writeJson(res, 200, attendanceOverviewBody());
  }
  if (req.method === "GET" && pathname === "/admin/dashboard/attendance/by-session") {
    return writeJson(res, 200, attendanceBySessionBody());
  }
  if (req.method === "GET" && pathname === "/admin/dashboard/attendance/ranking") {
    return writeJson(res, 200, attendanceRankingBody());
  }
  if (req.method === "GET" && pathname === "/admin/dashboard/attendance/trend") {
    return writeJson(res, 200, attendanceTrendBody());
  }
  if (req.method === "GET" && pathname === "/admin/dashboard/attendance/zone-distribution") {
    return writeJson(res, 200, attendanceZoneDistributionBody());
  }
  if (req.method === "GET" && pathname === "/admin/dashboard/attendance/absentees") {
    return writeJson(res, 200, attendanceAbsenteesBody());
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
  {
    const diagnosis = pathname.match(/^\/admin\/diagnostics\/member\/([^/]+)$/);
    if (req.method === "GET" && diagnosis?.[1]) {
      return writeJson(res, 200, adminMemberDiagnosis(decodeURIComponent(diagnosis[1])));
    }
  }
  if (req.method === "GET" && pathname === "/admin/tags/queue") {
    // admin-tags-resolve-drawer.spec.ts が evidence capture で mem_alpha (queued) / mem_beta (dlq) を必要とする。
    // 同 spec 以外 (admin-pages.spec.ts / full-smoke.spec.ts) は heading 存在のみ検証するので items 有無は影響しない。
    const status = url.searchParams.get("status");
    const items = [
      {
        queueId: "tag_q_001",
        memberId: "mem_alpha",
        responseId: "res_alpha",
        status: "queued",
        suggestedTagsJson: JSON.stringify(["founder", "kobe"]),
        reason: "playwright fixture",
        createdAt: "2026-05-12T00:00:00.000Z",
        updatedAt: "2026-05-12T00:00:00.000Z",
      },
      {
        queueId: "tag_q_dlq",
        memberId: "mem_beta",
        responseId: "res_beta",
        status: "dlq",
        suggestedTagsJson: JSON.stringify(["review-required"]),
        reason: "retry limit exceeded",
        createdAt: "2026-05-12T00:10:00.000Z",
        updatedAt: "2026-05-12T00:20:00.000Z",
      },
    ];
    const filtered = status ? items.filter((it) => it.status === status) : items;
    return safeJson(res, 200, { total: filtered.length, items: filtered }, schemas.AdminTagQueueZ);
  }
  if (req.method === "GET" && pathname === "/admin/schema/diff") {
    return safeJson(res, 200, adminSchemaDiff(), schemas.AdminSchemaDiffZ);
  }
  if (req.method === "GET" && pathname === "/admin/schema") {
    return safeJson(res, 200, adminSchemaDiff(), schemas.AdminSchemaZ);
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
  // /attendance/import — CSV 一括 import (ut-07c-followup-001)
  {
    const match = pathname.match(/^\/admin\/meetings\/([^/]+)\/attendance\/import$/);
    if (req.method === "POST" && match) {
      const sessionId = decodeURIComponent(match[1]);
      const dryRun = url.searchParams.get("dryRun") !== "false";
      const body = await readBody(req);
      const rows = Array.isArray(body?.rows) ? body.rows : null;
      if (!rows) {
        return writeJson(res, 400, { ok: false, error: "invalid_body" });
      }
      if (rows.length > 500) {
        return writeJson(res, 413, { ok: false, error: "payload_too_large", maxRows: 500 });
      }
      const meeting = state.meetingsSeed.meetings.find((m) => m.sessionId === sessionId);
      if (!meeting) return writeJson(res, 404, { ok: false, error: "session_not_found" });
      const seen = new Set();
      const results = rows.map((row, index) => {
        const memberId = typeof row?.memberId === "string" ? row.memberId.trim() : "";
        const email = typeof row?.email === "string" ? row.email.trim().toLowerCase() : "";
        const resolvedId = memberId || email.replace(/@example\.test$/, "");
        if (!resolvedId) return { index, status: "invalid", message: "memberId_or_email_required" };
        const candidate = meeting.candidates.find((c) => c.memberId === resolvedId);
        if (!candidate) return { index, status: "unknown_member", message: "member_not_found" };
        if (candidate.isDeleted) {
          return { index, status: "deleted_member", memberId: candidate.memberId };
        }
        if (
          meeting.attendees.some((a) => a.memberId === candidate.memberId) ||
          seen.has(candidate.memberId)
        ) {
          return { index, status: "duplicate", memberId: candidate.memberId };
        }
        seen.add(candidate.memberId);
        return { index, status: "ok", memberId: candidate.memberId };
      });
      const summary = {
        total: results.length,
        ok: results.filter((r) => r.status === "ok").length,
        duplicate: results.filter((r) => r.status === "duplicate").length,
        deletedMember: results.filter((r) => r.status === "deleted_member").length,
        unknownMember: results.filter((r) => r.status === "unknown_member").length,
        invalid: results.filter((r) => r.status === "invalid").length,
      };
      const committed = !dryRun && summary.ok === summary.total && summary.total > 0;
      if (committed) {
        meeting.attendees = [
          ...meeting.attendees,
          ...results
            .filter((r) => r.status === "ok")
            .map((r) => ({
              memberId: r.memberId,
              assignedAt: NOW,
              assignedBy: "admin-1",
            })),
        ];
      }
      return writeJson(res, 200, { ok: true, summary, rows: results, dryRun, committed });
    }
  }
  // DELETE /admin/meetings/:sessionId/attendance/:memberId — unregister attendance
  if (req.method === "DELETE" && /^\/admin\/meetings\/[^/]+\/attendance\/[^/]+$/.test(pathname)) {
    const parts = pathname.split("/");
    const sessionId = decodeURIComponent(parts[3]);
    const memberId = decodeURIComponent(parts[5]);
    const meeting = state.meetingsSeed.meetings.find((m) => m.sessionId === sessionId);
    if (!meeting) return writeJson(res, 404, { error: "meeting_not_found" });
    const exists = meeting.attendees.some((a) => a.memberId === memberId);
    if (!exists) return writeJson(res, 404, { error: "ATTENDANCE_NOT_FOUND" });
    meeting.attendees = meeting.attendees.filter((a) => a.memberId !== memberId);
    state.attendance.delete(`${sessionId}:${memberId}`);
    return writeJson(res, 200, { sessionId, memberId, removedAt: NOW });
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
