// 03b: 手動 response 同期 endpoint。SYNC_ADMIN_TOKEN による Bearer 認証必須。
// scheduled() / 手動 POST 双方から runResponseSync() を呼ぶ。
//
// AC-5: ?fullSync=true / ?cursor=... を受け付ける
// AC-6: 二重起動は 409 Conflict（runResponseSync が status='skipped' を返した場合）

import { Hono } from "hono";
import {
  previewResponseSync,
  runResponseSync,
  type ResponseSyncEnv,
} from "../../jobs/sync-forms-responses";
import type { GoogleFormsClient } from "@ubm-hyogo/integrations";

interface AdminResponsesSyncEnv extends ResponseSyncEnv {
  readonly SYNC_ADMIN_TOKEN?: string;
}

export interface AdminResponsesSyncDeps {
  readonly buildClient: (env: AdminResponsesSyncEnv) => GoogleFormsClient;
}

export function createAdminResponsesSyncRoute(
  deps: AdminResponsesSyncDeps,
): Hono<{ Bindings: AdminResponsesSyncEnv }> {
  const route = new Hono<{ Bindings: AdminResponsesSyncEnv }>();

  route.post("/sync/responses", async (c) => {
    const expected = c.env.SYNC_ADMIN_TOKEN;
    if (!expected) {
      return c.json(
        { ok: false, error: "SYNC_ADMIN_TOKEN not configured" },
        500,
      );
    }
    const auth = c.req.header("authorization") ?? "";
    if (auth !== `Bearer ${expected}`) {
      return c.json({ ok: false, error: "unauthorized" }, 401);
    }

    const dryRun = c.req.query("dryRun") === "true";
    const fullSync = c.req.query("fullSync") === "true";
    const cursor = c.req.query("cursor");

    const client = deps.buildClient(c.env);

    // issue-1089: dry-run 影響件数プレビュー（count-only・read-only）。
    // 既存 run 経路（?fullSync/?cursor）は不変（後方互換: dryRun 未指定で従来挙動）。
    if (dryRun) {
      try {
        const preview = await previewResponseSync(c.env, {
          client,
          ...(fullSync ? { fullSync: true } : {}),
          ...(cursor !== undefined ? { cursor } : {}),
        });
        return c.json({ ok: true, preview }, 200);
      } catch {
        // PII を出さない固定文言（不変条件 #7）
        return c.json({ ok: false, error: "preview_failed" }, 500);
      }
    }

    const opts = {
      trigger: "admin" as const,
      client,
      ...(fullSync ? { fullSync: true } : {}),
      ...(cursor !== undefined ? { cursor } : {}),
    };
    const result = await runResponseSync(c.env, opts);

    if (result.status === "skipped") {
      return c.json({ ok: false, result }, 409);
    }
    if (result.status === "failed") {
      return c.json({ ok: false, result }, 500);
    }
    return c.json({ ok: true, result }, 200);
  });

  return route;
}
