// 04c: POST /admin/meetings/:sessionId/attendance, DELETE /admin/meetings/:sessionId/attendance/:memberId
// 不変条件 #15: 重複 409 / 削除済み 422 / session 未存在 404
import { Hono } from "hono";
import { z } from "zod";
import { adminGate } from "../../middleware/admin-gate";
import { ctx } from "../../repository/_shared/db";
import { asMemberId, auditAction } from "../../repository/_shared/brand";
import {
  addAttendance,
  removeAttendance,
} from "../../repository/attendance";
import { append as auditAppend } from "../../repository/auditLog";
import { memberExists, type AdminRouteEnv } from "./_shared";

const AddBodyZ = z.object({ memberId: z.string().min(1) });

export const createAdminAttendanceRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv }>();
  app.use("*", adminGate);

  app.post("/meetings/:sessionId/attendance", async (c) => {
    const sessionId = c.req.param("sessionId");
    if (!sessionId) return c.json({ ok: false, error: "missing sessionId" }, 400);
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = AddBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    const memberId = asMemberId(parsed.data.memberId);
    if (!(await memberExists(c.env.DB, parsed.data.memberId))) {
      return c.json({ ok: false, error: "member not found" }, 404);
    }
    const result = await addAttendance(db, memberId, sessionId, "system");
    if (!result.ok) {
      if (result.reason === "session_not_found") {
        return c.json({ ok: false, error: "session not found" }, 404);
      }
      if (result.reason === "deleted_member") {
        return c.json({ ok: false, error: "member is deleted" }, 422);
      }
      if (result.reason === "duplicate") {
        return c.json({ ok: false, error: "already attended" }, 409);
      }
    }
    await auditAppend(db, {
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.attendance.added"),
      targetType: "meeting",
      targetId: sessionId,
      after: { memberId: parsed.data.memberId },
    });
    return c.json({ ok: true }, 200);
  });

  app.delete("/meetings/:sessionId/attendance/:memberId", async (c) => {
    const sessionId = c.req.param("sessionId");
    const memberId = c.req.param("memberId");
    if (!sessionId || !memberId) {
      return c.json({ ok: false, error: "missing path params" }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    await removeAttendance(db, asMemberId(memberId), sessionId);
    await auditAppend(db, {
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.attendance.removed"),
      targetType: "meeting",
      targetId: sessionId,
      before: { memberId },
    });
    return c.json({ ok: true }, 200);
  });

  return app;
};

export const adminAttendanceRoute = createAdminAttendanceRoute();
