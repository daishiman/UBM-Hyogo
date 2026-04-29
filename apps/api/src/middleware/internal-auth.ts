// 05a: apps/web → apps/api 内部経路の Worker-to-Worker 認証 middleware。
// /auth/session-resolve 等の email 列挙系 endpoint を public 公開しないために必須。
// 不変条件 #5: apps/web は D1 に直接アクセスせず、本 endpoint 経由で identity を resolve する。
import type { MiddlewareHandler } from "hono";

export interface InternalAuthEnv {
  readonly INTERNAL_AUTH_SECRET?: string;
}

const INTERNAL_AUTH_HEADER = "x-internal-auth";

export const internalAuth: MiddlewareHandler<{ Bindings: InternalAuthEnv }> = async (
  c,
  next,
) => {
  const expected = c.env.INTERNAL_AUTH_SECRET;
  if (!expected) {
    return c.json({ error: "internal misconfigured" }, 500);
  }
  const got = c.req.header(INTERNAL_AUTH_HEADER) ?? "";
  if (got !== expected) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
  return;
};
