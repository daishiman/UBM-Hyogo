// 06c: /api/admin/* → backend /admin/* proxy
// admin gate は (admin) layout で済んでいるが、proxy 自体でも session を検証して
// 非 admin が API に到達しないようにする。
// 不変条件 #5: D1 直接アクセスはせず、backend Worker 経由のみ。

import type { NextRequest } from "next/server";
import { getAuth } from "../../../../src/lib/auth";
import { getAuthEnv } from "../../../../src/lib/env";

const LOCAL_DEV_FALLBACK = "http://127.0.0.1:8787";

type AuthEnv = ReturnType<typeof getAuthEnv>;

const isTestOrPlaywright = (env: AuthEnv): boolean =>
  process.env["NODE_ENV"] === "test" || process.env["PLAYWRIGHT_TEST"] === "1" || env.ENVIRONMENT === "local";

const apiBase = (env: AuthEnv): string | null => {
  const v = env.INTERNAL_API_BASE_URL;
  if (v && v.length > 0) return v.replace(/\/$/, "");
  // local dev (`pnpm dev`) で env が無いケースのみ fallback を許可。
  // staging / production は wrangler.toml で [vars] を必ず注入しているため、
  // ここに到達したら設定不備として fail-fast する。
  if (process.env["NODE_ENV"] !== "production" && process.env["ENVIRONMENT"] !== "staging") {
    return LOCAL_DEV_FALLBACK;
  }
  return null;
};

const internalSecret = (env: AuthEnv): string => env.INTERNAL_AUTH_SECRET ?? "";
const syncAdminToken = (env: AuthEnv): string | undefined => env.SYNC_ADMIN_TOKEN;

function adminServiceBinding(env: AuthEnv): AuthEnv["API_SERVICE"] {
  if (isTestOrPlaywright(env) && env.INTERNAL_API_BASE_URL) return undefined;
  return env.API_SERVICE;
}

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
  const env = getAuthEnv();
  const url = new URL(req.url);
  const upstreamPath = `/admin/${path.join("/")}${url.search}`;

  const headers: Record<string, string> = {
    "x-internal-auth": internalSecret(env),
  };
  const cookie = req.headers.get("cookie");
  if (cookie) headers.cookie = cookie;
  const authorization = req.headers.get("authorization");
  if (needsSyncAdminBearer(path)) {
    const token = syncAdminToken(env);
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
  const binding = adminServiceBinding(env);
  let upstream: Response;
  if (binding) {
    upstream = await binding.fetch(`https://service-binding.local${upstreamPath}`, init);
  } else {
    const base = apiBase(env);
    if (base === null) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "internal_api_base_url_missing",
          message: "INTERNAL_API_BASE_URL is not configured for this environment",
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
    upstream = await fetch(`${base}${upstreamPath}`, init);
  }
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
