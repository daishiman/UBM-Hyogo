// 06c: Server Component から admin API を呼ぶ helper。
// 不変条件 #5: web は D1 へ直接アクセスしない。INTERNAL_API_BASE_URL 経由のみ。
// admin gate は layout.tsx で実施済みなので、ここでは worker-to-worker 認証を載せる。

import { cookies } from "next/headers";
import {
  AdminMemberListViewZ,
  ListIdentityConflictsResponseZ,
} from "@ubm-hyogo/shared";
import type { AdminAuditListResponse } from "./types";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (): string => {
  const v = process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};

const resolveInternalSecret = (): string =>
  process.env["INTERNAL_AUTH_SECRET"] ?? "";

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

const task18TagQueueFixture = () => ({
  total: 1,
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
    path.startsWith("/admin/meetings")
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
    process.env["PLAYWRIGHT_TASK17_ADMIN_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/schema/diff")
  ) {
    return task17SchemaFixture() as T;
  }

  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["PLAYWRIGHT_TASK17_ADMIN_FIXTURE"] === "1" &&
    opts.method === undefined &&
    path.startsWith("/admin/audit")
  ) {
    return task17AuditFixture(path) as T;
  }

  const url = `${resolveApiBase()}${path}`;
  const headers: Record<string, string> = {
    "x-internal-auth": resolveInternalSecret(),
    accept: "application/json",
  };
  const cookieHeader = (await cookies()).toString();
  if (cookieHeader) headers.cookie = cookieHeader;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    cache: "no-store",
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });
  if (!res.ok) {
    throw new Error(`admin api ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
