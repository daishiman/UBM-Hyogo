// 06b-B: /api/me/* → backend /me/* proxy (browser からの client-side request 用)
// 不変条件 #5: D1 直接アクセス禁止。backend Worker 経由のみ。
// 不変条件 #11: path は session.memberId に依存。ここでは path tail を素通しするだけで
//                memberId を URL に組み込まない。
//
// session 検証は backend `sessionGuard` に委譲する。本 proxy は cookie の forward のみを担う。

import type { NextRequest } from "next/server";
import { getAuth } from "../../../../src/lib/auth";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const apiBase = (): string => {
  const v = process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};

async function requireSession(): Promise<Response | null> {
  const { auth } = await getAuth();
  const session = await auth();
  const u = session?.user as { memberId?: string } | undefined;
  if (!u || !u.memberId) {
    return new Response(JSON.stringify({ code: "UNAUTHENTICATED" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const denied = await requireSession();
  if (denied) return denied;

  const { path } = await ctx.params;
  const url = new URL(req.url);
  const target = `${apiBase()}/me/${path.join("/")}${url.search}`;

  const headers: Record<string, string> = {};
  const cookie = req.headers.get("cookie");
  if (cookie) headers.cookie = cookie;
  const authorization = req.headers.get("authorization");
  if (authorization) headers.authorization = authorization;
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;
  const devSession = req.headers.get("x-ubm-dev-session");
  if (devSession) headers["x-ubm-dev-session"] = devSession;

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "DELETE") {
    init.body = await req.text();
  }
  const upstream = await fetch(target, init);
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
