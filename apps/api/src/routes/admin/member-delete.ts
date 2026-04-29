// 04c: POST /admin/members/:memberId/delete, POST /admin/members/:memberId/restore
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { asMemberId, asAdminId, auditAction } from "../../repository/_shared/brand";
import { getStatus, setDeleted } from "../../repository/status";
import { append as auditAppend } from "../../repository/auditLog";
import { memberExists, type AdminRouteEnv } from "./_shared";

const DeleteBodyZ = z.object({ reason: z.string().min(1) });

const SYSTEM_ADMIN = asAdminId("system");

export const createAdminMemberDeleteRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv }>();
  app.use("*", requireAdmin);

  app.post("/members/:memberId/delete", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      raw = {};
    }
    const parsed = DeleteBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);
    if (!(await memberExists(c.env.DB, memberId))) {
      return c.json({ ok: false, error: "member not found" }, 404);
    }
    const before = await getStatus(db, mid);
    await setDeleted(db, mid, SYSTEM_ADMIN, parsed.data.reason);
    const after = await getStatus(db, mid);
    await auditAppend(db, {
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.member.deleted"),
      targetType: "member",
      targetId: memberId,
      before: before as unknown as Record<string, unknown> | null,
      after: after as unknown as Record<string, unknown> | null,
    });
    return c.json({ ok: true }, 200);
  });

  app.post("/members/:memberId/restore", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);
    if (!(await memberExists(c.env.DB, memberId))) {
      return c.json({ ok: false, error: "member not found" }, 404);
    }
    const before = await getStatus(db, mid);
    if (!before) return c.json({ ok: false, error: "not found" }, 404);

    await db.db
      .prepare(
        `UPDATE member_status SET is_deleted = 0, updated_at = datetime('now') WHERE member_id = ?1`,
      )
      .bind(mid)
      .run();
    await db.db
      .prepare("DELETE FROM deleted_members WHERE member_id = ?1")
      .bind(mid)
      .run();

    const after = await getStatus(db, mid);
    await auditAppend(db, {
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.member.restored"),
      targetType: "member",
      targetId: memberId,
      before: before as unknown as Record<string, unknown> | null,
      after: after as unknown as Record<string, unknown> | null,
    });
    return c.json({ ok: true }, 200);
  });

  return app;
};

export const adminMemberDeleteRoute = createAdminMemberDeleteRoute();
