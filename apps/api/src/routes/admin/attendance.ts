// 04c: POST /admin/meetings/:sessionId/attendance, DELETE /admin/meetings/:sessionId/attendance/:memberId
// 不変条件 #15: 重複 409 / 削除済み 422 / session 未存在 404
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { asAdminId, asMemberId, adminEmail, auditAction } from "../../repository/_shared/brand";
import {
  addAttendance,
  listAttendableMembers,
  removeAttendance,
  type MemberAttendanceRow,
} from "../../repository/attendance";
import { append as auditAppend } from "../../repository/auditLog";
import { memberExists, type AdminRouteEnv } from "./_shared";

const AddBodyZ = z.object({ memberId: z.string().min(1) });

const toAttendanceResponse = (row: MemberAttendanceRow) => ({
  meetingSessionId: row.sessionId,
  memberId: row.memberId,
  attendedAt: row.assignedAt,
  createdAt: row.assignedAt,
  assignedBy: row.assignedBy,
});

export const createAdminAttendanceRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv; Variables: RequireAuthVariables }>();
  app.use("*", requireAdmin);

  app.get("/meetings/:sessionId/attendance/candidates", async (c) => {
    const sessionId = c.req.param("sessionId");
    if (!sessionId) return c.json({ ok: false, error: "missing sessionId" }, 400);
    const db = ctx({ DB: c.env.DB });
    const session = await c.env.DB
      .prepare("SELECT session_id FROM meeting_sessions WHERE session_id = ?")
      .bind(sessionId)
      .first<{ session_id: string }>();
    if (!session) return c.json({ ok: false, error: "session_not_found" }, 404);
    const rows = await listAttendableMembers(db, sessionId);
    return c.json({ ok: true, items: rows }, 200);
  });

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
    const authUser = c.get("authUser");
    if (!(await memberExists(c.env.DB, parsed.data.memberId))) {
      return c.json({ ok: false, error: "member not found" }, 404);
    }
    const result = await addAttendance(db, memberId, sessionId, authUser.email);
    if (!result.ok && result.reason === "session_not_found") {
      return c.json({ ok: false, error: "session_not_found" }, 404);
    }
    if (!result.ok && result.reason === "deleted_member") {
      return c.json({ ok: false, error: "member_is_deleted" }, 422);
    }
    if (!result.ok && result.reason === "duplicate") {
      return c.json(
        {
          ok: false,
          error: "attendance_already_recorded",
          existing: toAttendanceResponse(result.existing),
        },
        409,
      );
    }
    if (!result.ok) {
      return c.json({ ok: false, error: "attendance add failed" }, 500);
    }
    await auditAppend(db, {
      actorId: asAdminId(authUser.memberId),
      actorEmail: adminEmail(authUser.email),
      action: auditAction("attendance.add"),
      targetType: "meeting",
      targetId: sessionId,
      before: null,
      after: toAttendanceResponse(result.row),
    });
    return c.json({ ok: true, attendance: toAttendanceResponse(result.row) }, 201);
  });

  app.delete("/meetings/:sessionId/attendance/:memberId", async (c) => {
    const sessionId = c.req.param("sessionId");
    const memberId = c.req.param("memberId");
    if (!sessionId || !memberId) {
      return c.json({ ok: false, error: "missing path params" }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    const authUser = c.get("authUser");
    const removed = await removeAttendance(db, asMemberId(memberId), sessionId);
    if (!removed) {
      return c.json({ ok: false, error: "attendance_not_found" }, 404);
    }
    await auditAppend(db, {
      actorId: asAdminId(authUser.memberId),
      actorEmail: adminEmail(authUser.email),
      action: auditAction("attendance.remove"),
      targetType: "meeting",
      targetId: sessionId,
      before: toAttendanceResponse(removed),
      after: null,
    });
    return c.json({ ok: true, attendance: toAttendanceResponse(removed) }, 200);
  });

  return app;
};

export const adminAttendanceRoute = createAdminAttendanceRoute();
