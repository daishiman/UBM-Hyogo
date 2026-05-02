// 06b-B: client (browser) → 同一 origin route handler → API Worker proxy。
// 不変条件 #5: D1 直接禁止 → 必ず fetchAuthed (API Worker 経由) を通す。
// route handler は server runtime のため `next/headers` 経由で cookie を透過させる。

import { NextResponse } from "next/server";
import {
  AuthRequiredError,
  FetchAuthedError,
  fetchAuthed,
} from "../../../../src/lib/fetch/authed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 422 });
  }

  try {
    const accepted = await fetchAuthed<unknown>("/me/visibility-request", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
    return NextResponse.json(accepted, { status: 202 });
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (err instanceof FetchAuthedError) {
      // API Worker のエラー body と status をそのままパススルー（client helper の status mapping を温存）。
      const text = err.bodyText && err.bodyText.length > 0 ? err.bodyText : `{"error":"UPSTREAM_${err.status}"}`;
      return new Response(text, {
        status: err.status,
        headers: { "content-type": "application/json" },
      });
    }
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
