// 05a で sync 系専用 (cron / 自動化) middleware として隔離。
// 既存挙動 (Bearer SYNC_ADMIN_TOKEN 一致なら 200) を維持し、
// 人間の admin 操作向け gate は require-admin.ts (JWT + admin_users) に分離した。
//
// - `requireSyncAdmin`: 新名称（cron / 同期 endpoint 用）
// - `adminGate`: 後方互換 alias。今後の新規 import は `requireSyncAdmin` を使う。
import type { MiddlewareHandler } from "hono";

export interface AdminGateEnv {
  readonly SYNC_ADMIN_TOKEN?: string;
}

export const requireSyncAdmin: MiddlewareHandler<{ Bindings: AdminGateEnv }> = async (
  c,
  next,
) => {
  const expected = c.env.SYNC_ADMIN_TOKEN;
  if (!expected) {
    return c.json({ ok: false, error: "SYNC_ADMIN_TOKEN not configured" }, 500);
  }
  const auth = c.req.header("authorization") ?? "";
  if (!auth) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }
  if (auth !== `Bearer ${expected}`) {
    return c.json({ ok: false, error: "forbidden" }, 403);
  }
  await next();
  return;
};

/** @deprecated 05a で `requireSyncAdmin` にリネーム。新規 import は禁止。 */
export const adminGate = requireSyncAdmin;
