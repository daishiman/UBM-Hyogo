// 06c-A: GET /admin/dashboard
// AC: KPI 4 (totalMembers / publicMembers / untaggedMembers / unresolvedSchema) +
// recentActions (audit_log 直近7日, dashboard.view 除外, LIMIT 20).
// 成功時に dashboard.view を audit_log に追記する（次回以降の recentActions からは除外）。
import { Hono } from "hono";
import type { AuthSessionUser } from "@ubm-hyogo/shared";
import { AdminDashboardViewZ } from "@ubm-hyogo/shared";
import { requireAdmin } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { getTotals, listRecentActions } from "../../repository/dashboard";
import { append as appendAudit } from "../../repository/auditLog";
import {
  adminEmail,
  asAdminId,
  auditAction,
} from "../../repository/_shared/brand";
import { nowIso, normalizeIso, type AdminRouteEnv } from "./_shared";

export const createAdminDashboardRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: { authUser: AuthSessionUser };
  }>();
  app.use("*", requireAdmin);

  app.get("/dashboard", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const [totals, recent] = await Promise.all([
      getTotals(dbCtx),
      listRecentActions(dbCtx, 20),
    ]);

    const view = {
      totals,
      recentActions: recent.map((r) => ({
        auditId: r.auditId,
        actorEmail: r.actorEmail,
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        createdAt: normalizeIso(r.createdAt),
      })),
      generatedAt: nowIso(),
    };

    const parsed = AdminDashboardViewZ.safeParse(view);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }

    const authUser = c.get("authUser");
    await appendAudit(dbCtx, {
      actorId: authUser.memberId ? asAdminId(authUser.memberId) : null,
      actorEmail: authUser.email ? adminEmail(authUser.email) : null,
      action: auditAction("dashboard.view"),
      targetType: "system",
      targetId: null,
    });

    return c.json(parsed.data, 200);
  });

  return app;
};

export const adminDashboardRoute = createAdminDashboardRoute();
