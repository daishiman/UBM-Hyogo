// UT-09: 手動同期エンドポイント。SYNC_ADMIN_TOKEN による Bearer 認証必須。
// scheduled() と同じ runSync() を呼ぶことで、運用経路を一本化する。

import { Hono } from "hono";
import { runSync, type SyncEnv } from "../../jobs/sync-sheets-to-d1";

interface AdminSyncEnv extends SyncEnv {
  readonly SYNC_ADMIN_TOKEN?: string;
}

export const adminSyncRoute = new Hono<{ Bindings: AdminSyncEnv }>();

adminSyncRoute.post("/sync", async (c) => {
  const expected = c.env.SYNC_ADMIN_TOKEN;
  if (!expected) {
    return c.json({ ok: false, error: "SYNC_ADMIN_TOKEN not configured" }, 500);
  }
  const auth = c.req.header("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }
  const result = await runSync(c.env, { trigger: "admin" });
  const httpStatus = result.status === "failed" ? 500 : 200;
  return c.json({ ok: result.status !== "failed", result }, httpStatus);
});
