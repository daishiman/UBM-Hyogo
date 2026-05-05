// 04c: POST /admin/members/:memberId/delete, POST /admin/members/:memberId/restore
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { asMemberId, asAdminId, adminEmail, auditAction } from "../../repository/_shared/brand";
import { getStatus } from "../../repository/status";
import { memberExists, normalizeIso, type AdminRouteEnv } from "./_shared";

const DeleteBodyZ = z.object({ reason: z.string().trim().min(1).max(500) });

const auditInsert = (
  db: D1Database,
  entry: {
    actorId: string;
    actorEmail: string;
    action: string;
    targetId: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    createdAt: string;
  },
) =>
  db
    .prepare(
      "INSERT INTO audit_log (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
    )
    .bind(
      crypto.randomUUID(),
      entry.actorId,
      entry.actorEmail,
      entry.action,
      "member",
      entry.targetId,
      entry.before ? JSON.stringify(entry.before) : null,
      entry.after ? JSON.stringify(entry.after) : null,
      entry.createdAt,
    );

export const createAdminMemberDeleteRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv; Variables: RequireAuthVariables }>();
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
      return c.json({ ok: false, error: parsed.error.message }, 422);
    }
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);
    if (!(await memberExists(c.env.DB, memberId))) {
      return c.json({ ok: false, error: "member not found" }, 404);
    }
    const before = await getStatus(db, mid);
    if (before?.is_deleted === 1) {
      return c.json({ ok: false, error: "member_already_deleted" }, 409);
    }
    const authUser = c.get("authUser");
    const actorId = asAdminId(authUser.memberId);
    const now = new Date().toISOString();
    const after = {
      ...(before as unknown as Record<string, unknown> | null),
      member_id: memberId,
      is_deleted: 1,
      updated_by: actorId,
      updated_at: now,
    };
    await c.env.DB.batch([
      c.env.DB
        .prepare(
          `INSERT INTO member_status (member_id, is_deleted, updated_by, updated_at)
           VALUES (?1, 1, ?2, ?3)
           ON CONFLICT(member_id) DO UPDATE SET
             is_deleted = 1,
             updated_by = excluded.updated_by,
             updated_at = excluded.updated_at`,
        )
        .bind(mid, actorId, now),
      c.env.DB
        .prepare(
          `INSERT INTO deleted_members (member_id, deleted_by, deleted_at, reason)
           VALUES (?1, ?2, ?3, ?4)
           ON CONFLICT(member_id) DO UPDATE SET
             deleted_by = excluded.deleted_by,
             deleted_at = excluded.deleted_at,
             reason = excluded.reason`,
        )
        .bind(mid, actorId, now, parsed.data.reason),
      auditInsert(c.env.DB, {
        actorId,
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.member.deleted"),
        targetId: memberId,
        before: before as unknown as Record<string, unknown> | null,
        after,
        createdAt: now,
      }),
    ]);
    const deletedRow = await db.db
      .prepare("SELECT deleted_at FROM deleted_members WHERE member_id = ?1 LIMIT 1")
      .bind(mid)
      .first<{ deleted_at: string }>();
    return c.json(
      {
        id: memberId,
        isDeleted: true,
        deletedAt: normalizeIso(deletedRow?.deleted_at ?? now),
      },
      200,
    );
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
    if (before.is_deleted !== 1) {
      return c.json({ ok: false, error: "member_not_deleted" }, 409);
    }
    const authUser = c.get("authUser");

    const actorId = asAdminId(authUser.memberId);
    const now = new Date().toISOString();
    const after = {
      ...(before as unknown as Record<string, unknown> | null),
      is_deleted: 0,
      updated_by: actorId,
      updated_at: now,
    };
    await c.env.DB.batch([
      c.env.DB
        .prepare(
          "UPDATE member_status SET is_deleted = 0, updated_by = ?2, updated_at = ?3 WHERE member_id = ?1",
        )
        .bind(mid, actorId, now),
      c.env.DB.prepare("DELETE FROM deleted_members WHERE member_id = ?1").bind(mid),
      auditInsert(c.env.DB, {
        actorId,
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.member.restored"),
        targetId: memberId,
        before: before as unknown as Record<string, unknown> | null,
        after,
        createdAt: now,
      }),
    ]);
    return c.json(
      {
        id: memberId,
        restoredAt: normalizeIso(now),
      },
      200,
    );
  });

  return app;
};

export const adminMemberDeleteRoute = createAdminMemberDeleteRoute();
