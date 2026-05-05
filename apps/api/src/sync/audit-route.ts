// u-04: GET /admin/sync/audit?limit=N (default 20, max 100)

import { Hono } from "hono";
import { listRecent } from "./audit";
import { requireSyncAdmin, type SyncAdminEnv } from "../middleware/require-sync-admin";
import type { SyncEnvBase } from "./types";

interface AuditEnv extends SyncEnvBase, SyncAdminEnv {}

export const auditQueryRoute = new Hono<{ Bindings: AuditEnv }>();

auditQueryRoute.get("/admin/sync/audit", requireSyncAdmin, async (c) => {
  const raw = c.req.query("limit");
  const parsed = raw ? Number.parseInt(raw, 10) : 20;
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    return c.json({ ok: false, error: "invalid_limit" }, 400);
  }
  const items = await listRecent(c.env.DB, parsed);
  return c.json({ ok: true, items });
});
