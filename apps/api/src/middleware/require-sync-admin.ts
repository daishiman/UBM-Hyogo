// u-04: SYNC_ADMIN_TOKEN Bearer guard。manual / backfill / audit GET 共通。
// 不変条件: 値はログに残さない / 比較は固定値 + timing-safe。

import type { MiddlewareHandler } from "hono";

export interface SyncAdminEnv {
  readonly SYNC_ADMIN_TOKEN?: string;
}

function timingSafeEqual(a: string, b: string): boolean {
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < b.length; i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export const requireSyncAdmin: MiddlewareHandler<{
  Bindings: SyncAdminEnv;
}> = async (c, next) => {
  const expected = c.env.SYNC_ADMIN_TOKEN;
  if (!expected) {
    return c.json({ ok: false, error: "SYNC_ADMIN_TOKEN not configured" }, 500);
  }
  const auth = c.req.header("authorization") ?? "";
  const prefix = "Bearer ";
  if (!auth.startsWith(prefix)) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!timingSafeEqual(auth.slice(prefix.length), expected)) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }
  await next();
  return;
};
