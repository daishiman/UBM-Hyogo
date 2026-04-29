// 04c: GET /admin/dashboard
import { Hono } from "hono";
import { requireAdmin } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import {
  getTotals,
  listRecentSubmissions,
  getCurrentSchemaState,
} from "../../repository/dashboard";
import { AdminDashboardViewZ } from "@ubm-hyogo/shared";
import { nowIso, normalizeIso, type AdminRouteEnv } from "./_shared";

export const createAdminDashboardRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv }>();
  app.use("*", requireAdmin);

  app.get("/dashboard", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const [totals, recent, schemaState] = await Promise.all([
      getTotals(dbCtx),
      listRecentSubmissions(dbCtx, 10),
      getCurrentSchemaState(dbCtx),
    ]);

    const view = {
      totals,
      recentSubmissions: recent.map((r) => ({
        responseId: r.responseId,
        memberId: r.memberId,
        submittedAt: normalizeIso(r.submittedAt),
        fullName: r.fullName,
      })),
      schemaState,
      generatedAt: nowIso(),
    };

    const parsed = AdminDashboardViewZ.safeParse(view);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  return app;
};

export const adminDashboardRoute = createAdminDashboardRoute();
