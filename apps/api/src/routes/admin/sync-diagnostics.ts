// members-not-displaying-form-sync-investigation Task A:
// `requireSyncAdmin` 配下で `getFormsPipelineSnapshot` を返す CLI 用 endpoint。
// 既存の `/admin/diagnostics/forms-pipeline` は Auth.js admin 専用なので、
// SYNC_ADMIN_TOKEN bearer で叩く CLI / runbook 経路として並立させる。

import { Hono } from "hono";
import {
  requireSyncAdmin,
  type SyncAdminEnv,
} from "../../middleware/require-sync-admin";
import { getFormsPipelineSnapshot } from "../../diagnostics/forms-pipeline";
import type { Env } from "../../env";

type SyncDiagnosticsEnv = Env & SyncAdminEnv;

export const adminSyncDiagnosticsRoute = new Hono<{
  Bindings: SyncDiagnosticsEnv;
}>();

adminSyncDiagnosticsRoute.get(
  "/diagnostics/forms-pipeline",
  requireSyncAdmin,
  async (c) => {
    const snapshot = await getFormsPipelineSnapshot(c.env);
    return c.json(snapshot, 200);
  },
);
