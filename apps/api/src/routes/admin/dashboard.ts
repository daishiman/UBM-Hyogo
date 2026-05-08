// 06c-A: GET /admin/dashboard
// AC: KPI 4 (totalMembers / publicMembers / untaggedMembers / unresolvedSchema) +
// recentActions (audit_log 直近7日, dashboard.view 除外, LIMIT 20).
// 成功時に dashboard.view を audit_log に追記する（次回以降の recentActions からは除外）。
import { Hono } from "hono";
import type { AuthSessionUser } from "@ubm-hyogo/shared";
import {
  AdminDashboardViewZ,
  AttendanceOverviewZ,
  SessionAttendanceRowsZ,
  MemberAttendanceRankingRowsZ,
} from "@ubm-hyogo/shared";
import { requireAdmin } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { getTotals, listRecentActions } from "../../repository/dashboard";
import {
  computeAttendanceOverview,
  listSessionAttendanceStats,
  listMemberAttendanceRanking,
} from "../../repository/attendance";
import {
  writeTagNoteProviderMiddleware,
  type WriteTagNoteProviderVariables,
} from "../../middleware/repository-providers";
import { requireProvider } from "../../repository/_shared/provider-context";
import {
  adminEmail,
  asAdminId,
  auditAction,
} from "../../repository/_shared/brand";
import { nowIso, normalizeIso, type AdminRouteEnv } from "./_shared";

const parseAnalyticsLimit = (raw: string | undefined): { ok: true; limit?: number } | { ok: false } => {
  if (raw === undefined) return { ok: true };
  if (!/^[1-9]\d*$/.test(raw)) return { ok: false };
  const limit = Number(raw);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) return { ok: false };
  return { ok: true, limit };
};

export const createAdminDashboardRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: { authUser: AuthSessionUser } & Partial<WriteTagNoteProviderVariables>;
  }>();
  app.use("*", requireAdmin);
  app.use("*", writeTagNoteProviderMiddleware);

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
    await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
      actorId: authUser.memberId ? asAdminId(authUser.memberId) : null,
      actorEmail: authUser.email ? adminEmail(authUser.email) : null,
      action: auditAction("dashboard.view"),
      targetType: "system",
      targetId: null,
    });

    return c.json(parsed.data, 200);
  });

  // ut-02a-followup-002: attendance analytics endpoints
  // GROUP BY 単発クエリで完結する aggregate path（chunk pattern 非流用）
  app.get("/dashboard/attendance/overview", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const overview = await computeAttendanceOverview(dbCtx);
    const parsed = AttendanceOverviewZ.safeParse(overview);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  app.get("/dashboard/attendance/by-session", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const limit = parseAnalyticsLimit(c.req.query("limit"));
    if (!limit.ok) return c.json({ ok: false, error: "invalid_limit" }, 400);
    const rows = await listSessionAttendanceStats(dbCtx, limit.limit ? { limit: limit.limit } : {});
    const parsed = SessionAttendanceRowsZ.safeParse(rows);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  app.get("/dashboard/attendance/ranking", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const limit = parseAnalyticsLimit(c.req.query("limit"));
    if (!limit.ok) return c.json({ ok: false, error: "invalid_limit" }, 400);
    const rows = await listMemberAttendanceRanking(dbCtx, limit.limit ? { limit: limit.limit } : {});
    const parsed = MemberAttendanceRankingRowsZ.safeParse(rows);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  return app;
};

export const adminDashboardRoute = createAdminDashboardRoute();
