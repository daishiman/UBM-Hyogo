// 05a: Auth.js v5 standard handlers (GET / POST) を export する route handler。
// `/api/auth/signin/google`, `/api/auth/callback/google`, `/api/auth/session`, `/api/auth/signout` 等を
// 自動的に提供する。
import type { NextRequest } from "next/server";
import { getAuth } from "../../../../src/lib/auth";

export async function GET(req: NextRequest): Promise<Response> {
  const { handlers } = await getAuth();
  return handlers.GET(req);
}

export async function POST(req: NextRequest): Promise<Response> {
  const { handlers } = await getAuth();
  return handlers.POST(req);
}
