// 05b: web -> api 同 origin proxy (POST /auth/magic-link)
// 不変条件 #5: web は D1 に直接アクセスしない。判定 + token 発行は API worker に委譲する。
// 不変条件 #9: /no-access へ redirect しない。response の `state` をそのまま UI が解釈する。

import type { NextRequest } from "next/server";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (): string => {
  // INTERNAL_API_BASE_URL: API worker の同 zone エンドポイント (本番は service binding 経由を推奨)
  const v = process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};

export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.text();
  const upstream = `${resolveApiBase()}/auth/magic-link`;
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (ip) headers["cf-connecting-ip"] = ip.split(",")[0]?.trim() ?? ip;
  const res = await fetch(upstream, {
    method: "POST",
    headers,
    body,
  });
  // ステータス + body をそのまま返す。/no-access へ redirect しない (不変条件 #9)。
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

// GET / その他は 405
export async function GET(): Promise<Response> {
  return new Response("Method Not Allowed", { status: 405 });
}
