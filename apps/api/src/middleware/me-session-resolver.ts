// 06b-A: /me/* 用 session resolver。
// - production / staging: Auth.js cookie / Bearer JWT を AUTH_SECRET で verify する
//   (apps/web の Auth.js v5 が encodeAuthSessionJwt で発行した HS256 JWT)。
// - development: 既存の dev-only header `x-ubm-dev-session: 1` + Bearer "session:<email>:<memberId>"
//   経路を維持する (production では無効)。
//
// 不変条件 #5: D1 直接アクセスは行わない。lookup は sessionGuard 側 / session-resolve 側で完結。
// 不変条件 #7: claims.memberId のみ参照。responseId は読まない。
// 不変条件 #15: dev 経路と production 経路を厳密に分離する。

import { verifySessionJwt } from "@ubm-hyogo/shared";
import type { SessionResolver, SessionGuardEnv } from "./session-guard";
import { extractJwt } from "./require-admin";

const DEV_HEADER = "x-ubm-dev-session";
const DEV_TOKEN_RE = /^Bearer\s+session:([^:]+):(.+)$/;

const resolveDevSession: SessionResolver = async (req, env) => {
  if (env?.ENVIRONMENT !== "development") return null;
  if (req.headers.get(DEV_HEADER) !== "1") return null;
  const auth = req.headers.get("authorization") ?? "";
  const m = DEV_TOKEN_RE.exec(auth);
  if (!m) return null;
  const [, email, memberId] = m;
  if (!email || !memberId) return null;
  return { email, memberId };
};

export interface MeSessionResolverEnv extends SessionGuardEnv {
  readonly AUTH_SECRET?: string;
}

export type MeSessionResolver = (
  req: Request,
  env?: MeSessionResolverEnv,
) => Promise<{ email: string; memberId: string } | null>;

export const createMeSessionResolver = (): MeSessionResolver & SessionResolver => {
  const fn: MeSessionResolver = async (
    req,
    env,
  ) => {
    const dev = await resolveDevSession(req, env);
    if (dev) return dev;

    const secret = env?.AUTH_SECRET;
    if (!secret) return null;

    const token = extractJwt({ header: (k) => req.headers.get(k) ?? undefined });
    if (!token) return null;

    const claims = await verifySessionJwt(token, secret);
    if (!claims) return null;
    if (!claims.memberId || !claims.email) return null;
    return { email: claims.email, memberId: claims.memberId };
  };
  return fn as MeSessionResolver & SessionResolver;
};
