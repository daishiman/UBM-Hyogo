// 03a: 最小 admin gate スタブ。
// 本格的な admin 認証（Auth.js + admin_users table 照合）は後続 wave で差し替える前提。
// MVP は Bearer SYNC_ADMIN_TOKEN 一致で 200、未設定なら 500、未一致なら 401 / 403 を返す。
import type { MiddlewareHandler } from "hono";

export interface AdminGateEnv {
  readonly SYNC_ADMIN_TOKEN?: string;
}

export const adminGate: MiddlewareHandler<{ Bindings: AdminGateEnv }> = async (c, next) => {
  const expected = c.env.SYNC_ADMIN_TOKEN;
  if (!expected) {
    return c.json({ ok: false, error: "SYNC_ADMIN_TOKEN not configured" }, 500);
  }
  const auth = c.req.header("authorization") ?? "";
  if (!auth) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }
  if (auth !== `Bearer ${expected}`) {
    // 形式は合っているが不一致 → forbidden（一般会員相当）
    return c.json({ ok: false, error: "forbidden" }, 403);
  }
  await next();
  return;
};
