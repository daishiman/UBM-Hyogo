// 04c: PATCH /admin/members/:memberId/status
// publishState / hiddenReason 更新（不変条件 #11: admin 用 setter 経由）
import { Hono } from "hono";
import { z } from "zod";
import { adminGate } from "../../middleware/admin-gate";
import { ctx } from "../../repository/_shared/db";
import { asMemberId, asAdminId } from "../../repository/_shared/brand";
import { getStatus, setPublishState } from "../../repository/status";
import { append as auditAppend } from "../../repository/auditLog";
import { auditAction } from "../../repository/_shared/brand";
import { PublishStateZ } from "@ubm-hyogo/shared";
import type { AdminRouteEnv } from "./_shared";

const PatchBodyZ = z
  .object({
    publishState: PublishStateZ.optional(),
    hiddenReason: z.string().nullable().optional(),
  })
  .refine((b) => b.publishState !== undefined || b.hiddenReason !== undefined, {
    message: "at least one of publishState/hiddenReason required",
  });

const SYSTEM_ADMIN = asAdminId("system");

export const createAdminMemberStatusRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv }>();
  app.use("*", adminGate);

  app.patch("/members/:memberId/status", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = PatchBodyZ.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);
    const before = await getStatus(db, mid);
    if (!before) return c.json({ ok: false, error: "not found" }, 404);

    if (parsed.data.publishState !== undefined) {
      await setPublishState(db, mid, parsed.data.publishState, SYSTEM_ADMIN);
    }
    if (parsed.data.hiddenReason !== undefined) {
      await db.db
        .prepare(
          `UPDATE member_status SET hidden_reason = ?1, updated_at = datetime('now') WHERE member_id = ?2`,
        )
        .bind(parsed.data.hiddenReason, mid)
        .run();
    }
    const after = await getStatus(db, mid);

    await auditAppend(db, {
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.member.status_updated"),
      targetType: "member",
      targetId: memberId,
      before: before as unknown as Record<string, unknown>,
      after: after as unknown as Record<string, unknown> | null,
    });

    return c.json({ ok: true, status: after }, 200);
  });

  return app;
};

export const adminMemberStatusRoute = createAdminMemberStatusRoute();
