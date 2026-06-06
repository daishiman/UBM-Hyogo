// 05b: web -> api 同 origin proxy (POST /auth/magic-link/verify)
// 不変条件 #5: web は D1 に直接アクセスしない。

import type { NextRequest } from "next/server";

import { getAuthEnv, getEnvironment, getTransportRuntimeIsTest } from "@/lib/env";
import { fetchViaApiTransport, resolveApiFetch } from "@/lib/fetch/transport";

export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.text();
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (ip) headers["cf-connecting-ip"] = ip.split(",")[0]?.trim() ?? ip;
  const env = getAuthEnv();
  const res = await fetchViaApiTransport(
    resolveApiFetch({
      API_SERVICE: env.API_SERVICE,
      baseUrl: env.INTERNAL_API_BASE_URL,
      environment: getEnvironment(),
      isTest: getTransportRuntimeIsTest(),
    }),
    "/auth/magic-link/verify",
    { method: "POST", headers, body },
  );
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export async function GET(): Promise<Response> {
  return new Response("Method Not Allowed", { status: 405 });
}
