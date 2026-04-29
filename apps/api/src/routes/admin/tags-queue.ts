// 04c: GET /admin/tags/queue, POST /admin/tags/queue/:queueId/resolve
// 不変条件 #13: tag は queue resolve 経由のみ。直接更新 endpoint なし。
import { Hono } from "hono";
import { z } from "zod";
import { adminGate } from "../../middleware/admin-gate";
import { ctx } from "../../repository/_shared/db";
import { auditAction } from "../../repository/_shared/brand";
import {
  listQueue,
  findQueueById,
  transitionStatus,
  type TagQueueStatus,
} from "../../repository/tagQueue";
import { assignTagsToMember } from "../../repository/memberTags";
import type { TagId } from "../../repository/_shared/brand";
import { append as auditAppend } from "../../repository/auditLog";
import type { AdminRouteEnv } from "./_shared";

const StatusFilterZ = z.enum(["queued", "reviewing", "resolved"]).optional();
const ResolveBodyZ = z.object({}).passthrough().optional();

export const createAdminTagsQueueRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv }>();
  app.use("*", adminGate);

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
    let raw: unknown = {};
    try {
      raw = await c.req.json();
    } catch {
      // body 任意
    }
    const _parsed = ResolveBodyZ.safeParse(raw);
    if (!_parsed.success) {
      return c.json({ ok: false, error: _parsed.error.message }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    const before = await findQueueById(db, queueId);
    if (!before) return c.json({ ok: false, error: "queue not found" }, 404);

    let tagIds: TagId[] = [];
    try {
      const parsedTags = JSON.parse(before.suggestedTagsJson) as unknown;
      if (Array.isArray(parsedTags)) {
        tagIds = parsedTags.filter((tag): tag is TagId => typeof tag === "string") as TagId[];
      }
    } catch {
      return c.json({ ok: false, error: "invalid suggested tags" }, 500);
    }

    try {
      // queued -> reviewing -> resolved を経由必須
      let current = before.status;
      if (current === "queued") {
        await transitionStatus(db, queueId, "reviewing");
        current = "reviewing";
      }
      if (current === "reviewing") {
        await transitionStatus(db, queueId, "resolved");
      } else if (current === "resolved") {
        return c.json({ ok: false, error: "already resolved" }, 409);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return c.json({ ok: false, error: msg }, 409);
    }
    const appliedTagCount = await assignTagsToMember(
      db,
      before.memberId,
      tagIds,
      "system",
    );
    const after = await findQueueById(db, queueId);
    await auditAppend(db, {
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.tag.queue_resolved"),
      targetType: "tag_queue",
      targetId: queueId,
      before: { status: before.status },
      after: { status: after?.status ?? null, appliedTagCount },
    });
    return c.json({ ok: true, queue: after, appliedTagCount }, 200);
  });

  return app;
};

export const adminTagsQueueRoute = createAdminTagsQueueRoute();
