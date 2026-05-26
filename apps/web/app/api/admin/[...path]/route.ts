// 06c: /api/admin/* → backend /admin/* proxy
// admin gate は (admin) layout で済んでいるが、proxy 自体でも session を検証して
// 非 admin が API に到達しないようにする。
// 不変条件 #5: D1 直接アクセスはせず、backend Worker 経由のみ。

import type { NextRequest } from "next/server";
import { getAuth } from "../../../../src/lib/auth";

// followup-001 T-5.1: INTERNAL_API_BASE_URL fallback を撤去し fail-fast 化する。
// 旧実装は `http://127.0.0.1:8787` に fallback していたため、staging で env が
// 漏れると pass-through proxy が localhost に空打ちし `ADMIN_FETCH_404` が発生していた。
// 未設定なら 500 を明示返却して、UI 側で「設定不備」として表面化させる。
const LOCAL_DEV_FALLBACK = "http://127.0.0.1:8787";

const apiBase = (): string | null => {
  const v = process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  // local dev (`pnpm dev`) で env が無いケースのみ fallback を許可。
  // staging / production は wrangler.toml で [vars] を必ず注入しているため、
  // ここに到達したら設定不備として fail-fast する。
  if (process.env["NODE_ENV"] !== "production" && process.env["ENVIRONMENT"] !== "staging") {
    return LOCAL_DEV_FALLBACK;
  }
  return null;
};

const internalSecret = (): string => process.env["INTERNAL_AUTH_SECRET"] ?? "";

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
  const base = apiBase();
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
  const url = new URL(req.url);
  const target = `${base}/admin/${path.join("/")}${url.search}`;

  const headers: Record<string, string> = {
    "x-internal-auth": internalSecret(),
  };
  const cookie = req.headers.get("cookie");
  if (cookie) headers.cookie = cookie;
  const authorization = req.headers.get("authorization");
  if (authorization) headers.authorization = authorization;
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "DELETE") {
    init.body = await req.text();
  }
  const upstream = await fetch(target, init);
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
