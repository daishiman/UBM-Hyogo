// 04c: GET /admin/meetings, POST /admin/meetings
import { Hono } from "hono";
import { z } from "zod";
import { adminGate } from "../../middleware/admin-gate";
import { ctx } from "../../repository/_shared/db";
import { auditAction } from "../../repository/_shared/brand";
import { listMeetings, insertMeeting } from "../../repository/meetings";
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

export const createAdminMeetingsRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv }>();
  app.use("*", adminGate);

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
    return c.json({ total: items.length, items }, 200);
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
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.meeting.created"),
      targetType: "meeting",
      targetId: sessionId,
      after: { title: created.title, heldOn: created.heldOn },
    });
    return c.json({ ok: true, meeting: created }, 201);
  });

  return app;
};

export const adminMeetingsRoute = createAdminMeetingsRoute();
