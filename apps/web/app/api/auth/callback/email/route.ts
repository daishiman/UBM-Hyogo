// 05b-B: Magic Link メール本文のリンク (`/api/auth/callback/email?token=&email=`) を受ける GET handler。
// 1. query を validation
// 2. API worker `POST /auth/magic-link/verify` を呼んで token 消費
// 3. 成功時のみ Auth.js Credentials provider (id="magic-link") で session cookie を確立
// 4. 失敗時は /login?error=<mapped> へ redirect (cookie 未設定)
//
// 不変条件 #5: web は D1 を直接参照しない。verify は API worker 経由のみ。

import type { NextRequest } from "next/server";
import { signIn } from "../../../../../src/lib/auth";
import {
  verifyMagicLink,
  mapVerifyReasonToLoginError,
} from "../../../../../src/lib/auth/verify-magic-link";

const isValidEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

const isHexToken = (v: string): boolean => /^[0-9a-f]{64}$/.test(v);

const loginUrl = (req: NextRequest, error: string): string => {
  const u = new URL("/login", req.url);
  u.searchParams.set("error", error);
  return u.toString();
};

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const email = url.searchParams.get("email") ?? "";

  if (!token) return Response.redirect(loginUrl(req, "missing_token"), 303);
  if (!email) return Response.redirect(loginUrl(req, "missing_email"), 303);
  if (!isHexToken(token) || !isValidEmail(email)) {
    return Response.redirect(loginUrl(req, "invalid_link"), 303);
  }

  const result = await verifyMagicLink({ token, email });
  if (!result.ok) {
    return Response.redirect(
      loginUrl(req, mapVerifyReasonToLoginError(result.reason)),
      303,
    );
  }

  // Credentials provider に「検証済みユーザー」を渡し session cookie を確立。
  // signIn は redirect: true で next-auth が Response.redirect を throw する。
  return await signIn("magic-link", {
    verifiedUser: JSON.stringify(result.user),
    redirect: true,
    redirectTo: "/",
  });
}

export async function POST(): Promise<Response> {
  return new Response("Method Not Allowed", { status: 405 });
}
