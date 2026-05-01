// 04c + 07a: GET /admin/tags/queue, POST /admin/tags/queue/:queueId/resolve
// 不変条件 #13: tag は queue resolve 経由のみ。直接更新 endpoint なし。
// resolve の状態遷移ロジックは 07a workflow (tagQueueResolve) に委譲する。
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { adminEmail, asAdminId } from "../../repository/_shared/brand";
import { listQueue, type TagQueueStatus } from "../../repository/tagQueue";
import { tagQueueResolveBodySchema } from "@ubm-hyogo/shared";
import {
  TagQueueResolveError,
  tagQueueResolve,
} from "../../workflows/tagQueueResolve";
import type { AdminRouteEnv } from "./_shared";

const StatusFilterZ = z
  .enum(["queued", "reviewing", "resolved", "rejected"])
  .optional();

const ERROR_TO_STATUS: Record<string, number> = {
  queue_not_found: 404,
  state_conflict: 409,
  member_deleted: 422,
  unknown_tag_code: 422,
  idempotent_payload_mismatch: 409,
  race_lost: 409,
  missing_tag_codes: 400,
  missing_reason: 400,
};

export const createAdminTagsQueueRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv; Variables: RequireAuthVariables }>();
  app.use("*", requireAdmin);

  app.get("/tags/queue", async (c) => {
    const statusRaw = c.req.query("status");
    const parsed = StatusFilterZ.safeParse(statusRaw);
    if (!parsed.success) {
      return c.json({ ok: false, error: "invalid status" }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    const rows = await listQueue(db, parsed.data as TagQueueStatus | undefined);
    return c.json({ total: rows.length, items: rows }, 200);
  });

  app.post("/tags/queue/:queueId/resolve", async (c) => {
    const queueId = c.req.param("queueId");
    if (!queueId) return c.json({ ok: false, error: "missing queueId" }, 400);

    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json body" }, 400);
    }
    const parsed = tagQueueResolveBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: "validation_error", details: parsed.error.issues }, 400);
    }

    const authUser = c.get("authUser");
    const db = ctx({ DB: c.env.DB });

    try {
      const result = await tagQueueResolve(db, {
        queueId,
        actorUserId: authUser.memberId ? asAdminId(String(authUser.memberId)) : null,
        actorEmail: authUser.email ? adminEmail(authUser.email) : null,
        action: parsed.data.action,
        ...(parsed.data.action === "confirmed"
          ? { tagCodes: parsed.data.tagCodes }
          : { reason: parsed.data.reason }),
      });
      return c.json({ ok: true, result }, 200);
    } catch (err) {
      if (err instanceof TagQueueResolveError) {
        const status = ERROR_TO_STATUS[err.code] ?? 500;
        return c.json(
          { ok: false, error: err.code, message: err.message },
          status as 400 | 404 | 409 | 422 | 500,
        );
      }
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ ok: false, error: "internal_error", message: msg }, 500);
    }
  });

  return app;
};

export const adminTagsQueueRoute = createAdminTagsQueueRoute();
