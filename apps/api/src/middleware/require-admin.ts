// 05a: 人間の admin 操作向け二段防御の API 側 gate。
// - 第1段: apps/web/middleware.ts (UI gate, /admin/:path*)
// - 第2段: 本 middleware (API gate, app.use("/admin/*", requireAdmin))
//
// JWT (HS256 + AUTH_SECRET) を verify し、claims.isAdmin が true なら通す。
// 既存 sync 系 (cron) は別 middleware `requireSyncAdmin` が担当する。
//
// JWT extract 順序:
//   1. Authorization: Bearer <jwt>
//   2. Cookie: __Secure-authjs.session-token / authjs.session-token
//
// 不変条件 #11: bypass 不可。token 無し → 401, claims.isAdmin=false → 403。
// 不変条件 #5: 本 middleware は D1 を一切触らない。lookup は session 発行時に session-resolve で済ませる。
// 不変条件 #7: claims.memberId のみ context に積み、responseId は読み込まない。

import type { MiddlewareHandler } from "hono";
import type { SessionJwtClaims, AuthSessionUser } from "@ubm-hyogo/shared";
import { verifySessionJwt } from "@ubm-hyogo/shared";
import type { MemberId } from "@ubm-hyogo/shared";

export interface RequireAuthEnv {
  readonly AUTH_SECRET?: string;
}

export type RequireAuthVariables = {
  authUser: AuthSessionUser;
  authClaims: SessionJwtClaims;
};

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  // next-auth v4 互換 (移行時の保険)
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

const parseCookie = (cookieHeader: string, name: string): string | null => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return null;
};

export const extractJwt = (request: Request | { header: (k: string) => string | undefined }): string | null => {
  const get = (k: string): string =>
    typeof (request as Request).headers?.get === "function"
      ? ((request as Request).headers.get(k) ?? "")
      : ((request as { header: (k: string) => string | undefined }).header(k) ?? "");

  const auth = get("authorization");
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    if (token) return token;
  }
  const cookieHeader = get("cookie");
  for (const name of SESSION_COOKIE_NAMES) {
    const v = parseCookie(cookieHeader, name);
    if (v) return v;
  }
  return null;
};

export const requireAuth: MiddlewareHandler<{
  Bindings: RequireAuthEnv;
  Variables: RequireAuthVariables;
}> = async (c, next) => {
  const secret = c.env.AUTH_SECRET;
  if (!secret) {
    return c.json({ error: "auth misconfigured" }, 500);
  }
  const token = extractJwt({ header: (k) => c.req.header(k) });
  if (!token) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const claims = await verifySessionJwt(token, secret);
  if (!claims) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const sessionUser: AuthSessionUser = {
    memberId: claims.memberId as MemberId,
    email: claims.email,
    isAdmin: claims.isAdmin,
    ...(claims.name !== undefined ? { name: claims.name } : {}),
  };
  c.set("authUser", sessionUser);
  c.set("authClaims", claims);
  await next();
  return;
};

export const requireAdmin: MiddlewareHandler<{
  Bindings: RequireAuthEnv;
  Variables: RequireAuthVariables;
}> = async (c, next) => {
  // 認証部分は requireAuth と同等の処理を inline で実行（hono の middleware は
  // 直接 await できないため、共通の verify ロジックを取り出して呼ぶ）。
  const secret = c.env.AUTH_SECRET;
  if (!secret) {
    return c.json({ error: "auth misconfigured" }, 500);
  }
  const token = extractJwt({ header: (k) => c.req.header(k) });
  if (!token) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const claims = await verifySessionJwt(token, secret);
  if (!claims) {
    return c.json({ error: "unauthorized" }, 401);
  }
  if (!claims.isAdmin) {
    // 不変条件 #11: admin 機能の存在を 403 として明示
    return c.json({ error: "forbidden" }, 403);
  }
  const sessionUser: AuthSessionUser = {
    memberId: claims.memberId as MemberId,
    email: claims.email,
    isAdmin: claims.isAdmin,
    ...(claims.name !== undefined ? { name: claims.name } : {}),
  };
  c.set("authUser", sessionUser);
  c.set("authClaims", claims);
  await next();
  return;
};
