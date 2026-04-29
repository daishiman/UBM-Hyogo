// 05b: web -> api 同 origin proxy (GET /auth/gate-state)
// 不変条件 #5: web は D1 に直接アクセスしない。判定は API worker に委譲。
// 不変条件 #9: /no-access へ redirect しない。state はそのまま UI に返す。

import type { NextRequest } from "next/server";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (): string => {
  const v = process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? "";
  const upstream = `${resolveApiBase()}/auth/gate-state?email=${encodeURIComponent(email)}`;
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for");
  const headers: Record<string, string> = {};
  if (ip) headers["cf-connecting-ip"] = ip.split(",")[0]?.trim() ?? ip;
  const res = await fetch(upstream, { method: "GET", headers });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export async function POST(): Promise<Response> {
  return new Response("Method Not Allowed", { status: 405 });
}
