import type { AuthSessionUser, SessionJwtClaims } from "@ubm-hyogo/shared";
import { verifySessionJwt } from "@ubm-hyogo/shared";
import type { MiddlewareHandler } from "hono";

import { validateAuthSecretEnv } from "../env";
import { authSessionUserFromClaims, extractJwt } from "./require-admin";

export interface RequirePublicAccessEnv {
  readonly AUTH_SECRET?: string;
  readonly INTERNAL_AUTH_SECRET?: string;
}

export type RequirePublicAccessVariables = {
  authUser: AuthSessionUser;
  authClaims: SessionJwtClaims;
};

const INTERNAL_AUTH_HEADER = "x-internal-auth";

function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

async function verifyMemberSession(
  token: string | null,
  secret: string | undefined,
): Promise<SessionJwtClaims | null> {
  if (!token) return null;
  try {
    const parsed = validateAuthSecretEnv({ AUTH_SECRET: secret });
    return verifySessionJwt(token, parsed.AUTH_SECRET);
  } catch {
    return null;
  }
}

function isInternalRequest(
  provided: string | undefined,
  expected: string | undefined,
): boolean {
  if (!expected || !provided) return false;
  return timingSafeEqual(provided, expected);
}

export const requirePublicAccess: MiddlewareHandler<{
  Bindings: RequirePublicAccessEnv;
  Variables: RequirePublicAccessVariables;
}> = async (c, next) => {
  const token = extractJwt({ header: (k) => c.req.header(k) });
  const claims = await verifyMemberSession(token, c.env.AUTH_SECRET);
  if (claims) {
    c.set("authClaims", claims);
    c.set("authUser", authSessionUserFromClaims(claims));
    await next();
    return;
  }

  if (
    isInternalRequest(
      c.req.header(INTERNAL_AUTH_HEADER),
      c.env.INTERNAL_AUTH_SECRET,
    )
  ) {
    await next();
    return;
  }

  return c.json({ error: "unauthorized" }, 401);
};
