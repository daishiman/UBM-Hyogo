// 06c: /api/admin/* → backend /admin/* proxy
// admin gate は (admin) layout で済んでいるが、proxy 自体でも session を検証して
// 非 admin が API に到達しないようにする。
// 不変条件 #5: D1 直接アクセスはせず、backend Worker 経由のみ。

import type { NextRequest } from "next/server";
import { getAuth } from "../../../../src/lib/auth";
import { getAuthEnv, getEnvironment, getTransportRuntimeIsTest } from "../../../../src/lib/env";
import { fetchViaApiTransport, resolveApiFetch } from "../../../../src/lib/fetch/transport";

const internalSecret = (): string => getAuthEnv().INTERNAL_AUTH_SECRET ?? "";
const syncAdminToken = (): string | undefined => getAuthEnv().SYNC_ADMIN_TOKEN;

function needsSyncAdminBearer(path: readonly string[]): boolean {
  if (path[0] !== "sync") return false;
  return (
    path[1] === "schema" ||
    path[1] === "responses" ||
    path[1] === "backfill-publish-state" ||
    path[1] === "diagnostics"
  );
}

async function requireAdmin(): Promise<Response | null> {
  const { auth } = await getAuth();
  const session = await auth();
  const u = session?.user as { isAdmin?: boolean; memberId?: string } | undefined;
  if (!u || u.isAdmin !== true) {
    return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { path } = await ctx.params;
  const authEnv = getAuthEnv();
  let transport: ReturnType<typeof resolveApiFetch>;
  try {
    transport = resolveApiFetch({
      API_SERVICE: authEnv.API_SERVICE,
      baseUrl: authEnv.INTERNAL_API_BASE_URL,
      environment: getEnvironment(),
      isTest: getTransportRuntimeIsTest(),
    });
  } catch {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "internal_api_base_url_missing",
        message: "INTERNAL_API_BASE_URL is not configured for this environment",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  const url = new URL(req.url);
  const targetPath = `/admin/${path.join("/")}${url.search}`;

  const headers: Record<string, string> = {
    "x-internal-auth": internalSecret(),
  };
  const cookie = req.headers.get("cookie");
  if (cookie) headers.cookie = cookie;
  const authorization = req.headers.get("authorization");
  if (needsSyncAdminBearer(path)) {
    const token = syncAdminToken();
    if (!token) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "sync_admin_token_missing",
          message: "SYNC_ADMIN_TOKEN is not configured for this environment",
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
    headers.authorization = `Bearer ${token}`;
  } else if (authorization) headers.authorization = authorization;
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "DELETE") {
    init.body = await req.text();
  }
  const upstream = await fetchViaApiTransport(transport, targetPath, init);
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
