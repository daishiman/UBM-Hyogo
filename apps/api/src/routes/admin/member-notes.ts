// 04c: POST /admin/members/:memberId/notes, PATCH /admin/members/:memberId/notes/:noteId
// 不変条件 #12: admin_member_notes は detail view にのみ含まれる。list view には混ぜない。
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "../../middleware/require-admin";
import { asMemberId } from "../../repository/_shared/brand";
import { adminEmail, auditAction } from "../../repository/_shared/brand";
import {
  writeTagNoteProviderMiddleware,
  type WriteTagNoteProviderVariables,
} from "../../middleware/repository-providers";
import { requireProvider } from "../../repository/_shared/provider-context";
import { memberExists, type AdminRouteEnv } from "./_shared";

const CreateNoteBodyZ = z.object({ body: z.string().min(1) });
const UpdateNoteBodyZ = z.object({ body: z.string().min(1) });

const SYSTEM_ADMIN_EMAIL = adminEmail("system@admin.local");

export const createAdminMemberNotesRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: Partial<WriteTagNoteProviderVariables>;
  }>();
  app.use("*", requireAdmin);
  app.use("*", writeTagNoteProviderMiddleware);

  app.post("/members/:memberId/notes", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = CreateNoteBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    if (!(await memberExists(c.env.DB, memberId))) {
      return c.json({ ok: false, error: "member not found" }, 404);
    }
    const adminNotesProvider = requireProvider(c.var.adminNotesProvider, "adminNotesProvider");
    const auditLogProvider = requireProvider(c.var.auditLogProvider, "auditLogProvider");
    const created = await adminNotesProvider.create({
      memberId: asMemberId(memberId),
      body: parsed.data.body,
      createdBy: SYSTEM_ADMIN_EMAIL,
    });
    await auditLogProvider.append({
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.member.note_created"),
      targetType: "member",
      targetId: memberId,
      after: { noteId: created.noteId, body: created.body },
    });
    return c.json({ ok: true, note: created }, 201);
  });

  app.patch("/members/:memberId/notes/:noteId", async (c) => {
    const memberId = c.req.param("memberId");
    const noteId = c.req.param("noteId");
    if (!memberId || !noteId) {
      return c.json({ ok: false, error: "missing path params" }, 400);
    }
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = UpdateNoteBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const adminNotesProvider = requireProvider(c.var.adminNotesProvider, "adminNotesProvider");
    const auditLogProvider = requireProvider(c.var.auditLogProvider, "auditLogProvider");
    const before = await adminNotesProvider.findById(noteId);
    if (!before) return c.json({ ok: false, error: "note not found" }, 404);
    if (before.memberId !== memberId) {
      return c.json({ ok: false, error: "note member mismatch" }, 404);
    }
    const updated = await adminNotesProvider.update(
      noteId,
      parsed.data.body,
      SYSTEM_ADMIN_EMAIL,
    );
    if (!updated) return c.json({ ok: false, error: "update failed" }, 404);
    await auditLogProvider.append({
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.member.note_updated"),
      targetType: "member",
      targetId: memberId,
      before: { body: before.body },
      after: { body: updated.body },
    });
    return c.json({ ok: true, note: updated }, 200);
  });

  return app;
};

export const adminMemberNotesRoute = createAdminMemberNotesRoute();
