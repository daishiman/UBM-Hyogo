// 06c: Server Component から admin API を呼ぶ helper。
// 不変条件 #5: web は D1 へ直接アクセスしない。INTERNAL_API_BASE_URL 経由のみ。
// admin gate は layout.tsx で実施済みなので、ここでは worker-to-worker 認証を載せる。

import { cookies } from "next/headers";
import {
  AdminMemberListViewZ,
  ListIdentityConflictsResponseZ,
} from "@ubm-hyogo/shared";
import { getAdminFetchEnv, getEnv } from "../env";
import {
  resolveServiceBinding,
  selectAndFetch,
  stripTrailingSlash,
} from "../fetch/transport-select";
import type { AdminAuditListResponse } from "./types";

interface AdminFetchErrorOptions {
  readonly path: string;
  readonly status: number;
  readonly responseBody?: string | null;
}

const RESPONSE_BODY_EMAIL_PATTERN =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const RESPONSE_BODY_PHONE_PATTERN =
  /(?:\+?\d[\d\s().-]{7,}\d)/g;

function redactAdminFetchResponseBody(body: string): string {
  return body
    .replace(RESPONSE_BODY_EMAIL_PATTERN, "[masked-email]")
    .replace(RESPONSE_BODY_PHONE_PATTERN, "[masked-phone]");
}

export class AdminFetchError extends Error {
  readonly path: string;
  readonly status: number;
  readonly responseBodySnippet: string | null;

  constructor({ path, status, responseBody }: AdminFetchErrorOptions) {
    const safeResponseBody =
      responseBody === null || responseBody === undefined
        ? null
        : redactAdminFetchResponseBody(responseBody);
    const messageBody = safeResponseBody
      ? ` body=${safeResponseBody.slice(0, 256)}`
      : "";
    super(`admin api ${path} failed: ${status}${messageBody}`);
    this.name = "AdminFetchError";
    this.path = path;
    this.status = status;
    this.responseBodySnippet =
      safeResponseBody === null ? null : safeResponseBody.slice(0, 500);
  }
}

export function isAdminFetchError(error: unknown): error is AdminFetchError {
  const candidate = error as {
    readonly name?: unknown;
    readonly path?: unknown;
    readonly status?: unknown;
  };
  return (
    error instanceof AdminFetchError ||
    (error instanceof Error &&
      candidate.name === "AdminFetchError" &&
      typeof candidate.path === "string" &&
      typeof candidate.status === "number")
  );
}

const resolveApiBase = (): string => {
  return stripTrailingSlash(
    getAdminFetchEnv().INTERNAL_API_BASE_URL ?? getEnv().INTERNAL_API_BASE_URL,
  );
};

const resolveInternalSecret = (): string =>
  getEnv().INTERNAL_AUTH_SECRET ?? "";

function isTestOrPlaywright(): boolean {
  const env = getAdminFetchEnv();
  return env.NODE_ENV === "test" || env.PLAYWRIGHT_TEST === "1";
}

function getAdminServiceBinding(): { fetch: typeof fetch } | undefined {
  const env = getAdminFetchEnv();
  return resolveServiceBinding({
    binding: env.API_SERVICE,
    disableBinding: isTestOrPlaywright() && Boolean(env.INTERNAL_API_BASE_URL),
  });
}

async function buildAdminRequestHeaders(
  opts: AdminFetchOptions,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "x-internal-auth": resolveInternalSecret(),
    accept: "application/json",
  };
  const cookieHeader = (await cookies()).toString();
  if (cookieHeader) headers.cookie = cookieHeader;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  return headers;
}

function logAdminTransport(
  transport: "service-binding" | "http-fallback",
  path: string,
  status: number,
): void {
  console.log({
    transport,
    scope: "admin",
    path: path.split("?")[0],
    status,
  });
}

export interface AdminFetchOptions {
  readonly method?: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: unknown;
}

const adminRequestsFixture = () => ({
  ok: true,
  items: ["alpha", "beta", "gamma"].map((suffix, index) => ({
    noteId: `req_${String(index + 1).padStart(3, "0")}`,
    memberId: `mem_${suffix}`,
    noteType: "visibility_request",
    requestStatus: "pending",
    requestedAt: "2026-05-01T00:00:00.000Z",
    requestedReason: null,
    requestedPayload: { desiredState: "public" },
    memberSummary: {
      memberId: `mem_${suffix}`,
      publicHandle: suffix,
      publishState: "private",
      isDeleted: false,
    },
  })),
  nextCursor: null,
  appliedFilters: { status: "pending", type: "visibility_request" },
});

// 2b-admin-identity-conflicts-spec: Playwright E2E 用の inline fixture。
// browser `page.route()` で server-side fetch を捕捉できないため、
// `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1` 時のみ固定 2 件を返す。
const adminIdentityConflictsFixture = () => ({
  items: [
    {
      conflictId: "m_src_01__m_dst_01",
      sourceMemberId: "m_src_01",
      candidateTargetMemberId: "m_dst_01",
      matchedFields: ["name", "affiliation"],
      detectedAt: "2026-05-08T00:00:00Z",
      responseEmailMasked: "t***@example.com",
      syncJobId: "sync_001",
    },
    {
      conflictId: "m_src_02__m_dst_02",
      sourceMemberId: "m_src_02",
      candidateTargetMemberId: "m_dst_02",
      matchedFields: ["name"],
      detectedAt: "2026-05-08T01:00:00Z",
      responseEmailMasked: "h***@example.com",
      syncJobId: null,
    },
  ],
  nextCursor: null,
});

const adminMemberDeleteFixture = (path: string) => {
  const url = new URL(path, "http://fixture.local");
  const filter = url.searchParams.get("filter");
  const members = [
    {
      memberId: "mem_001",
      responseEmail: "active@example.test",
      fullName: "削除対象 太郎",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      lastSubmittedAt: "2026-05-09T00:00:00.000Z",
    },
    {
      memberId: "mem_002",
      responseEmail: "deleted@example.test",
      fullName: "削除済み 花子",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "hidden",
      isDeleted: true,
      lastSubmittedAt: "2026-05-08T00:00:00.000Z",
    },
  ];
  const filtered =
    filter === "deleted" ? members.filter((m) => m.isDeleted) : members;
  return {
    total: filtered.length,
    members: filtered,
    page: 1,
    pageSize: 20,
  };
};

const adminMemberDeleteAuditFixture = (): AdminAuditListResponse => ({
  items: [
    {
      auditId: "aud_member_delete_001",
      actorEmail: "admin@example.test",
      action: "admin.member.deleted",
      targetType: "member",
      targetId: "mem_001",
      maskedBefore: { is_deleted: 0 },
      maskedAfter: { is_deleted: 1 },
      parseError: false,
      createdAt: "2026-05-10T00:00:00.000Z",
    },
  ],
  nextCursor: null,
  appliedFilters: {
    action: "admin.member.deleted",
    limit: 50,
  },
});

const task17SchemaFixture = () => ({
  total: 4,
  items: [
    {
      diffId: "schema_added_001",
      revisionId: "rev_task17",
      type: "added",
      questionId: "q_new_department",
      stableKey: null,
      label: "所属部署",
      suggestedStableKey: "member_department",
      status: "queued",
      resolvedBy: null,
      resolvedAt: null,
      createdAt: "2026-05-10T00:00:00.000Z",
    },
    {
      diffId: "schema_changed_001",
      revisionId: "rev_task17",
      type: "changed",
      questionId: "q_display_name",
      stableKey: "member_display_name",
      label: "表示名（旧: 氏名）",
      suggestedStableKey: "member_display_name",
      status: "queued",
      resolvedBy: null,
      resolvedAt: null,
      createdAt: "2026-05-10T00:01:00.000Z",
    },
    {
      diffId: "schema_removed_001",
      revisionId: "rev_task17",
      type: "removed",
      questionId: "q_legacy_zone",
      stableKey: "member_legacy_zone",
      label: "旧地区",
      suggestedStableKey: null,
      status: "resolved",
      resolvedBy: "admin@example.com",
      resolvedAt: "2026-05-10T00:10:00.000Z",
      createdAt: "2026-05-10T00:02:00.000Z",
    },
    {
      diffId: "schema_unresolved_001",
      revisionId: "rev_task17",
      type: "unresolved",
      questionId: null,
      stableKey: null,
      label: "自由記述メモ",
      suggestedStableKey: null,
      status: "queued",
      resolvedBy: null,
      resolvedAt: null,
      createdAt: "2026-05-10T00:03:00.000Z",
    },
  ],
});

const issue776SchemaBulkFixture = () => ({
  total: 30,
  items: Array.from({ length: 30 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    const type = i % 2 === 0 ? "unresolved" : "changed";
    return {
      diffId: `issue776_${n}`,
      revisionId: "rev_issue776",
      type,
      questionId: `q_issue776_${n}`,
      stableKey: type === "changed" ? `existing_key_${n}` : null,
      label: `Issue 776 bulk row ${n}`,
      suggestedStableKey: `issue776_key_${n}`,
      status: "queued",
      resolvedBy: null,
      resolvedAt: null,
      createdAt: `2026-05-18T00:${n}:00.000Z`,
    };
  }),
});

const task17DashboardFixture = () => ({
  totals: {
    totalMembers: 128,
    publicMembers: 76,
    untaggedMembers: 9,
    unresolvedSchema: 3,
  },
  recentActions: [
    {
      auditId: "audit_task17_001",
      actorEmail: "admin@example.test",
      action: "admin.member.status_updated",
      targetType: "member",
      targetId: "mem_alpha",
      createdAt: "2026-05-10T01:00:00.000Z",
    },
    {
      auditId: "audit_task17_002",
      actorEmail: "system@example.test",
      action: "schema.alias.assign",
      targetType: "schema_question",
      targetId: "q_display_name",
      createdAt: "2026-05-10T00:30:00.000Z",
    },
  ],
  generatedAt: "2026-05-10T01:05:00.000Z",
  byStatus: [
    { status: "public", count: 76 },
    { status: "member_only", count: 31 },
    { status: "hidden", count: 21 },
  ],
});


const task17AuditFixture = (path: string) => {
  const url = new URL(path, "http://internal.test");
  const isEmpty = url.searchParams.get("targetType") === "empty";
  const isFiltered = url.searchParams.has("actorEmail") || url.searchParams.has("targetType");
  return {
    items: isEmpty
      ? []
      : [
          {
            auditId: isFiltered ? "audit_filtered_001" : "audit_default_001",
            actorEmail: isFiltered ? "manjumoto.daishi@senpai-lab.com" : "admin@example.com",
            action: isFiltered ? "schema.alias.assign" : "identity.merge",
            targetType: isFiltered ? "schema_question" : "member",
            targetId: isFiltered ? "q_display_name" : "m_dst_01",
            maskedBefore: { email: "old@example.com", displayName: "Old Name" },
            maskedAfter: { email: "new@example.com", displayName: "New Name" },
            createdAt: "2026-05-10T00:00:00.000Z",
          },
        ],
    nextCursor: isEmpty ? null : "cursor-task17-next",
  };
};

// issue-1116: /admin/tag-master の SSR list。full e2e の並列実行では mock API
// (port 8787) への SSR fetch が稀に 404 化するため、PLAYWRIGHT_TEST=1 時は
// schema/diff（下記）と同じく fetchAdmin 側で決定的に固定 list を返す。
const adminTagMasterFixture = () => ({
  total: 3,
  items: [
    { tagId: "tag_mentor", code: "mentor", label: "メンター", category: "role" },
    { tagId: "tag_vip", code: "vip", label: "VIP会員", category: "membership" },
    { tagId: "tag_kobe", code: "kobe", label: "神戸", category: "area" },
  ],
});

const task18TagQueueFixture = () => ({
  total: 2,
  items: [
    {
      queueId: "tag_q_001",
      memberId: "mem_alpha",
      responseId: "res_alpha",
      status: "queued",
      suggestedTagsJson: JSON.stringify(["founder", "kobe"]),
      reason: "task18 smoke fixture",
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
  ],
});

const task18MeetingsFixture = () => ({
  total: 1,
  items: [
    {
      sessionId: "session_task18",
      title: "2026年5月 定例会",
      heldOn: "2026-05-12",
      note: "task18 smoke fixture",
      createdAt: "2026-05-12T00:00:00.000Z",
      attendance: [{ memberId: "mem_alpha", assignedAt: "2026-05-12T00:00:00.000Z" }],
    },
  ],
});

const task18MembersFixture = () => ({
  total: 2,
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
      lastSubmittedAt: "2026-05-11T00:00:00.000Z",
    },
    {
      memberId: "mem_beta",
      responseEmail: "beta@example.test",
      fullName: "兵庫 花子",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "hidden",
      isDeleted: false,
      lastSubmittedAt: "2026-05-10T00:00:00.000Z",
    },
  ],
});

export async function fetchAdmin<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<T> {
  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TASK18_SMOKE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/tags/queue")
  ) {
    return task18TagQueueFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TASK18_SMOKE"] === "1" &&
    opts.method === undefined &&
    (path === "/admin/meetings" || path.startsWith("/admin/meetings?"))
  ) {
    return task18MeetingsFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TASK18_SMOKE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/members")
  ) {
    return task18MembersFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/requests")
  ) {
    return adminRequestsFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/identity-conflicts")
  ) {
    return ListIdentityConflictsResponseZ.parse(adminIdentityConflictsFixture()) as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/members")
  ) {
    return AdminMemberListViewZ.parse(adminMemberDeleteFixture(path)) as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/audit")
  ) {
    return adminMemberDeleteAuditFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_ISSUE776_SCHEMA_BULK_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/schema/diff")
  ) {
    return issue776SchemaBulkFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TASK17_ADMIN_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path === "/admin/dashboard"
  ) {
    return task17DashboardFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TASK17_ADMIN_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/members")
  ) {
    return task18MembersFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TASK17_ADMIN_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/schema/diff")
  ) {
    return task17SchemaFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TEST"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/schema/diff")
  ) {
    return task17SchemaFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TEST"] === "1" &&
    opts.method === undefined &&
    (path === "/admin/tags" || path.startsWith("/admin/tags?"))
  ) {
    return adminTagMasterFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TASK17_ADMIN_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/audit")
  ) {
    return task17AuditFixture(path) as T;
  }

  const headers = await buildAdminRequestHeaders(opts);
  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers,
    cache: "no-store",
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  };
  const transportResult = await selectAndFetch(
    {
      binding: getAdminServiceBinding(),
      resolveBase: resolveApiBase,
      log: logAdminTransport,
    },
    path,
    init,
  );
  if (transportResult.kind === "base-unavailable") {
    throw new AdminFetchError({ path, status: 500 });
  }
  const res = transportResult.response;
  if (!res.ok) {
    let responseBody: string | null = null;
    try {
      responseBody = await res.text();
    } catch {
      // body 読み取り失敗は致命的でない（status だけで切り分け可能）
    }
    if (process.env["NODE_ENV"] !== "production" && res.status === 404) {
      let host = "<invalid>";
      try {
        host = new URL(resolveApiBase()).host;
      } catch {
        host = "<invalid>";
      }
      console.warn("[admin/server-fetch] 404", {
        host,
        path,
        status: res.status,
      });
    }
    throw new AdminFetchError({ path, status: res.status, responseBody });
  }
  return (await res.json()) as T;
}
