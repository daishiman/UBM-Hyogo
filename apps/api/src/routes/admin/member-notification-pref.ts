// Issue #55: PATCH /admin/members/:memberId/notification-pref
// admin operator が member の通知オプトアウトを切り替える endpoint。
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { updateNotificationOptOut } from "../../repository/memberNotificationPreference";
import type { AdminRouteEnv } from "./_shared";

const PatchBodyZ = z.object({
  notificationOptOut: z.boolean(),
});

export const createAdminMemberNotificationPrefRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: RequireAuthVariables;
  }>();
  app.use("*", requireAdmin);

  app.patch("/members/:memberId/notification-pref", async (c) => {
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
    const nowIso = new Date().toISOString();
    const updatedBy = c.get("authUser")?.email ?? "system";
    const next = await updateNotificationOptOut(db, {
      memberId,
      notificationOptOut: parsed.data.notificationOptOut,
      updatedBy,
      updatedAt: nowIso,
    });

    return c.json(
      { ok: true, memberId, notificationOptOut: next },
      200,
    );
  });

  return app;
};

export const adminMemberNotificationPrefRoute =
  createAdminMemberNotificationPrefRoute();
