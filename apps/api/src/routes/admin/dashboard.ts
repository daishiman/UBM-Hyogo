// 06c-A: GET /admin/dashboard
// AC: KPI 4 (totalMembers / publicMembers / untaggedMembers / unresolvedSchema) +
// recentActions (audit_log 直近7日, dashboard.view 除外, LIMIT 20).
// 成功時に dashboard.view を audit_log に追記する（次回以降の recentActions からは除外）。
import { Hono } from "hono";
import type { AuthSessionUser } from "@ubm-hyogo/shared";
import {
  AdminDashboardViewZ,
  AttendanceOverviewExtZ,
  SessionAttendanceRowsZ,
  MemberAttendanceRankingRowsZ,
  AttendanceTrendZ,
  AttendanceZoneDistributionZ,
  AttendanceSessionDetailZ,
  AttendanceAbsenteeListZ,
} from "@ubm-hyogo/shared";
import { requireAdmin } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { getStatusDistribution, getTotals, listRecentActions } from "../../repository/dashboard";
import {
  computeAttendanceOverviewExt,
  listSessionAttendanceStatsExt,
  listMemberAttendanceRankingExt,
  listAttendanceTrend,
  listZoneDistribution,
  getSessionAttendanceDetail,
  listAbsentees,
  listAttendanceExportRows,
  clampAnalyticsLimit,
  clampLastN,
} from "../../repository/attendance-analytics";
import { parseAttendanceFilter } from "../../lib/parse-attendance-filter";
import { buildCsv, csvFilename } from "../../lib/csv-export";
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

const resolveLimit = (raw: string | undefined): { ok: true; value: number } | { ok: false } => {
  if (raw === undefined || raw === "") return { ok: true, value: clampAnalyticsLimit(undefined) };
  if (!/^\d+$/.test(raw)) return { ok: false };
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0 || n > 200) return { ok: false };
  return { ok: true, value: n };
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
    const [totals, byStatus, recent] = await Promise.all([
      getTotals(dbCtx),
      getStatusDistribution(dbCtx),
      listRecentActions(dbCtx, 20),
    ]);

    const view = {
      totals,
      byStatus,
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
    const filter = parseAttendanceFilter((k) => c.req.query(k));
    const overview = await computeAttendanceOverviewExt(dbCtx, filter);
    const parsed = AttendanceOverviewExtZ.safeParse(overview);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  app.get("/dashboard/attendance/by-session", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const filter = parseAttendanceFilter((k) => c.req.query(k));
    const limit = resolveLimit(c.req.query("limit"));
    if (!limit.ok) return c.json({ ok: false, error: "invalid_limit" }, 400);
    const rows = await listSessionAttendanceStatsExt(dbCtx, filter, limit.value);
    const parsed = SessionAttendanceRowsZ.safeParse(rows);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  app.get("/dashboard/attendance/ranking", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const filter = parseAttendanceFilter((k) => c.req.query(k));
    const limit = resolveLimit(c.req.query("limit"));
    if (!limit.ok) return c.json({ ok: false, error: "invalid_limit" }, 400);
    const rows = await listMemberAttendanceRankingExt(dbCtx, filter, limit.value);
    const parsed = MemberAttendanceRankingRowsZ.safeParse(rows);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  // ── Extended analytics endpoints (admin-attendance-analytics-redesign) ──

  app.get("/dashboard/attendance/trend", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const filter = parseAttendanceFilter((k) => c.req.query(k));
    const trend = await listAttendanceTrend(dbCtx, filter);
    const parsed = AttendanceTrendZ.safeParse(trend);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  app.get("/dashboard/attendance/zone-distribution", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const filter = parseAttendanceFilter((k) => c.req.query(k));
    const dist = await listZoneDistribution(dbCtx, filter);
    const parsed = AttendanceZoneDistributionZ.safeParse(dist);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  app.get("/dashboard/attendance/sessions/:sessionId/attendees", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const sessionId = c.req.param("sessionId");
    const detail = await getSessionAttendanceDetail(dbCtx, sessionId);
    if (!detail) return c.json({ code: "ADMIN_FETCH_404", message: "session_not_found" }, 404);
    const parsed = AttendanceSessionDetailZ.safeParse(detail);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  app.get("/dashboard/attendance/absentees", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const filter = parseAttendanceFilter((k) => c.req.query(k));
    const lastN = clampLastN(Number(c.req.query("lastN")));
    const data = await listAbsentees(dbCtx, filter, lastN);
    const parsed = AttendanceAbsenteeListZ.safeParse(data);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  app.get("/dashboard/attendance/export", async (c) => {
    const dbCtx = ctx({ DB: c.env.DB });
    const filter = parseAttendanceFilter((k) => c.req.query(k));
    const rows = await listAttendanceExportRows(dbCtx, filter);
    const csv = buildCsv(
      ["sessionId", "title", "heldOn", "memberId", "displayName", "zone", "attended"],
      rows as unknown as Array<Record<string, unknown>>,
    );
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${csvFilename("attendance", filter.periodFrom, filter.periodTo)}"`,
      },
    });
  });

  return app;
};

export const adminDashboardRoute = createAdminDashboardRoute();
