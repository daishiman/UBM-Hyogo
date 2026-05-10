// 06c: Server Component から admin API を呼ぶ helper。
// 不変条件 #5: web は D1 へ直接アクセスしない。INTERNAL_API_BASE_URL 経由のみ。
// admin gate は layout.tsx で実施済みなので、ここでは worker-to-worker 認証を載せる。

import { cookies } from "next/headers";
import { ListIdentityConflictsResponseZ } from "@ubm-hyogo/shared";

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

export async function fetchAdmin<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<T> {
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
