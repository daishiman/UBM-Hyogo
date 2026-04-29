// 05b: web -> api 同 origin proxy (POST /auth/magic-link/verify)
// 不変条件 #5: web は D1 に直接アクセスしない。

import type { NextRequest } from "next/server";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (): string => {
  const v = process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};

export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.text();
  const upstream = `${resolveApiBase()}/auth/magic-link/verify`;
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (ip) headers["cf-connecting-ip"] = ip.split(",")[0]?.trim() ?? ip;
  const res = await fetch(upstream, { method: "POST", headers, body });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export async function GET(): Promise<Response> {
  return new Response("Method Not Allowed", { status: 405 });
}
