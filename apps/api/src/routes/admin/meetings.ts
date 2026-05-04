// 04c / 06c-E: GET/POST/PATCH/export admin meetings
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { asAdminId, asMemberId, adminEmail, auditAction } from "../../repository/_shared/brand";
import {
  listMeetings,
  insertMeeting,
  updateMeeting,
  listMeetingAttendanceForExport,
  type MeetingAttendanceExportRow,
} from "../../repository/meetings";
import { addAttendance, listAttendanceBySession, removeAttendance } from "../../repository/attendance";
import { append as auditAppend } from "../../repository/auditLog";
import type { AdminRouteEnv } from "./_shared";

const CreateMeetingBodyZ = z.object({
  title: z.string().min(1),
  heldOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().nullable().optional(),
});

const ListQueryZ = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const UpdateMeetingBodyZ = z.object({
  title: z.string().min(1).optional(),
  heldOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().nullable().optional(),
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

const AttendanceBodyZ = z.object({
  memberId: z.string().min(1),
  attended: z.boolean(),
});

const csvEscape = (value: string): string => {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

const toCsv = (rows: MeetingAttendanceExportRow[]): string => {
  const header = ["meetingId", "heldOn", "memberId", "displayName", "attended"];
  return [
    header.join(","),
    ...rows.map((row) =>
      [row.meetingId, row.heldOn, row.memberId, row.displayName, row.attended]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\r\n");
};

export const createAdminMeetingsRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv; Variables: RequireAuthVariables }>();
  app.use("*", requireAdmin);

  app.get("/meetings", async (c) => {
    const parsed = ListQueryZ.safeParse({
      limit: c.req.query("limit"),
      offset: c.req.query("offset"),
    });
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const { limit, offset } = parsed.data;
    const db = ctx({ DB: c.env.DB });
    const items = await listMeetings(db, limit, offset);
    const itemsWithAttendance = await Promise.all(
      items.map(async (item) => ({
        ...item,
        attendance: (await listAttendanceBySession(db, item.sessionId)).map((a) => ({
          memberId: a.memberId,
          assignedAt: a.assignedAt,
          assignedBy: a.assignedBy,
        })),
      })),
    );
    return c.json({ total: itemsWithAttendance.length, items: itemsWithAttendance }, 200);
  });

  app.post("/meetings", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = CreateMeetingBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    const sessionId = crypto.randomUUID();
    const created = await insertMeeting(db, {
      sessionId,
      title: parsed.data.title,
      heldOn: parsed.data.heldOn,
      note: parsed.data.note ?? null,
      createdBy: "system",
    });
    await auditAppend(db, {
      actorId: asAdminId(c.get("authUser").memberId),
      actorEmail: adminEmail(c.get("authUser").email),
      action: auditAction("admin.meeting.created"),
      targetType: "meeting",
      targetId: sessionId,
      after: { title: created.title, heldOn: created.heldOn },
    });
    return c.json({ ok: true, meeting: created }, 201);
  });

  app.patch("/meetings/:id", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = UpdateMeetingBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 422);
    }
    const db = ctx({ DB: c.env.DB });
    const updated = await updateMeeting(db, c.req.param("id"), parsed.data);
    if (!updated) return c.json({ ok: false, error: "not_found" }, 404);
    const authUser = c.get("authUser");
    await auditAppend(db, {
      actorId: asAdminId(authUser.memberId),
      actorEmail: adminEmail(authUser.email),
      action: auditAction(parsed.data.deletedAt ? "meetings.delete" : "meetings.update"),
      targetType: "meeting",
      targetId: updated.sessionId,
      after: {
        title: updated.title,
        heldOn: updated.heldOn,
        note: updated.note,
        deletedAt: updated.deletedAt,
      },
    });
    return c.json({ ok: true, meeting: updated }, 200);
  });

  app.post("/meetings/:id/attendances", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = AttendanceBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 422);
    }
    const db = ctx({ DB: c.env.DB });
    const authUser = c.get("authUser");
    const sessionId = c.req.param("id");
    if (parsed.data.attended) {
      const result = await addAttendance(db, asMemberId(parsed.data.memberId), sessionId, authUser.email);
      if (!result.ok && result.reason === "session_not_found") {
        return c.json({ ok: false, error: "session_not_found" }, 404);
      }
      if (!result.ok && result.reason === "member_not_found") {
        return c.json({ ok: false, error: "member_not_found" }, 404);
      }
      if (!result.ok && result.reason === "deleted_member") {
        return c.json({ ok: false, error: "member_is_deleted" }, 422);
      }
      if (!result.ok && result.reason === "duplicate") {
        return c.json({ ok: false, error: "attendance_already_recorded" }, 409);
      }
      if (!result.ok) return c.json({ ok: false, error: "attendance add failed" }, 500);
      await auditAppend(db, {
        actorId: asAdminId(authUser.memberId),
        actorEmail: adminEmail(authUser.email),
        action: auditAction("attendance.add"),
        targetType: "meeting",
        targetId: sessionId,
        after: { memberId: parsed.data.memberId },
      });
      return c.json({ ok: true, attended: true }, 200);
    }
    const removed = await removeAttendance(db, asMemberId(parsed.data.memberId), sessionId);
    if (!removed) return c.json({ ok: false, error: "attendance_not_found" }, 404);
    await auditAppend(db, {
      actorId: asAdminId(authUser.memberId),
      actorEmail: adminEmail(authUser.email),
      action: auditAction("attendance.remove"),
      targetType: "meeting",
      targetId: sessionId,
      before: { memberId: parsed.data.memberId },
    });
    return c.json({ ok: true, attended: false }, 200);
  });

  app.get("/meetings/:id/export.csv", async (c) => {
    const rows = await listMeetingAttendanceForExport(ctx({ DB: c.env.DB }), c.req.param("id"));
    if (!rows) return c.json({ ok: false, error: "not_found" }, 404);
    const filename = `meeting-${c.req.param("id")}.csv`;
    return new Response(`\uFEFF${toCsv(rows)}\r\n`, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  });

  return app;
};

export const adminMeetingsRoute = createAdminMeetingsRoute();
