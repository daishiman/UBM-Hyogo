// issue-1031: client (browser) → 同一 origin route handler → API Worker /me/photo proxy。
// 不変条件 #5: D1 / R2 直接禁止 → 必ず fetchAuthed（API Worker 経由）を通す。
// 不変条件 #11: memberId は path に出さない。API Worker 側が session.memberId で解決する。
// route handler は server runtime のため cookie を fetchAuthed が透過させる。

import { NextResponse } from "next/server";
import {
  AuthRequiredError,
  FetchAuthedError,
  fetchAuthed,
} from "../../../../src/lib/fetch/authed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const passthrough = (err: unknown): Response => {
  if (err instanceof AuthRequiredError) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (err instanceof FetchAuthedError) {
    // API Worker のエラー body と status をそのままパススルー（client helper の status mapping を温存）。
    const text =
      err.bodyText && err.bodyText.length > 0
        ? err.bodyText
        : `{"error":"UPSTREAM_${err.status}"}`;
    return new Response(text, {
      status: err.status,
      headers: { "content-type": "application/json" },
    });
  }
  return NextResponse.json({ error: "SERVER" }, { status: 500 });
};

export async function POST(req: Request): Promise<Response> {
  // multipart body を再構築して API Worker へ転送する（fetch が新規 boundary で content-type を付与）。
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  try {
    const accepted = await fetchAuthed<unknown>("/me/photo", {
      method: "POST",
      body: form,
    });
    return NextResponse.json(accepted, { status: 200 });
  } catch (err) {
    return passthrough(err);
  }
}

export async function DELETE(): Promise<Response> {
  try {
    const accepted = await fetchAuthed<unknown>("/me/photo", {
      method: "DELETE",
    });
    return NextResponse.json(accepted, { status: 200 });
  } catch (err) {
    return passthrough(err);
  }
}
