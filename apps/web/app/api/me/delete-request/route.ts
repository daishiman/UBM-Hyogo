// 06b-B: client (browser) → 同一 origin route handler → API Worker proxy。
// 不変条件 #5: D1 直接禁止 → 必ず fetchAuthed (API Worker 経由) を通す。

import { NextResponse } from "next/server";
import {
  AuthRequiredError,
  FetchAuthedError,
  fetchAuthed,
} from "../../../../src/lib/fetch/authed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: unknown = {};
  try {
    const text = await req.text();
    body = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 422 });
  }

  try {
    const accepted = await fetchAuthed<unknown>("/me/delete-request", {
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
      const text = err.bodyText && err.bodyText.length > 0 ? err.bodyText : `{"error":"UPSTREAM_${err.status}"}`;
      return new Response(text, {
        status: err.status,
        headers: { "content-type": "application/json" },
      });
    }
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
