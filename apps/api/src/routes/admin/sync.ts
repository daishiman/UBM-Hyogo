// u-04: 互換 mount。旧 POST /admin/sync は新しい sync layer (runManualSync) に委譲する。
// 正本は POST /admin/sync/run（manualSyncRoute）。本ハンドラは互換のため残す。

import { Hono } from "hono";
import { runManualSync } from "../../sync/manual";
import { requireSyncAdmin, type SyncAdminEnv } from "../../middleware/require-sync-admin";
import type { SyncEnvBase } from "../../sync/types";

interface AdminSyncEnv extends SyncEnvBase, SyncAdminEnv {}

export const adminSyncRoute = new Hono<{ Bindings: AdminSyncEnv }>();

adminSyncRoute.post("/sync", requireSyncAdmin, async (c) => {
  const result = await runManualSync(c.env);
  if (result.status === "skipped") {
    return c.json(
      { ok: false, error: "sync_in_progress", auditId: result.auditId },
      409,
    );
  }
  const httpStatus = result.status === "failed" ? 500 : 200;
  return c.json({ ok: result.status !== "failed", result }, httpStatus);
});
