// 04c: GET /admin/members, GET /admin/members/:memberId
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { asMemberId, asAdminId } from "../../repository/_shared/brand";
import {
  buildAdminMemberDetailView,
} from "../../repository/_shared/builder";
import { createAttendanceProvider } from "../../repository/attendance";
import { listByTarget } from "../../repository/auditLog";
import {
  AdminMemberListViewZ,
  AdminMemberDetailViewZ,
} from "@ubm-hyogo/shared";
import { normalizeIso, type AdminRouteEnv } from "./_shared";

const FilterZ = z.enum(["published", "hidden", "deleted"]).optional();

interface MemberListRow {
  member_id: string;
  response_email: string;
  last_submitted_at: string;
  answers_json: string | null;
  public_consent: string | null;
  rules_consent: string | null;
  publish_state: string | null;
  is_deleted: number | null;
}

const filterToSql = (filter?: "published" | "hidden" | "deleted"): string => {
  if (filter === "published") {
    return "WHERE COALESCE(ms.is_deleted, 0) = 0 AND COALESCE(ms.publish_state, 'member_only') = 'public'";
  }
  if (filter === "hidden") {
    return "WHERE COALESCE(ms.is_deleted, 0) = 0 AND COALESCE(ms.publish_state, 'member_only') = 'hidden'";
  }
  if (filter === "deleted") {
    return "WHERE COALESCE(ms.is_deleted, 0) = 1";
  }
  return "";
};

export const createAdminMembersRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv }>();
  app.use("*", requireAdmin);

  app.get("/members", async (c) => {
    const filterRaw = c.req.query("filter");
    const filterParse = FilterZ.safeParse(filterRaw);
    if (!filterParse.success) {
      return c.json({ ok: false, error: "invalid filter" }, 400);
    }
    const filter = filterParse.data;
    const db = ctx({ DB: c.env.DB });
    const where = filterToSql(filter);

    const r = await db.db
      .prepare(
        `SELECT mi.member_id, mi.response_email, mi.last_submitted_at,
                mr.answers_json,
                ms.public_consent, ms.rules_consent, ms.publish_state, ms.is_deleted
         FROM member_identities mi
         LEFT JOIN member_responses mr ON mr.response_id = mi.current_response_id
         LEFT JOIN member_status ms ON ms.member_id = mi.member_id
         ${where}
         ${where ? "AND" : "WHERE"} mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)
         ORDER BY mi.last_submitted_at DESC`,
      )
      .all<MemberListRow>();

    const members = (r.results ?? []).map((row) => {
      let fullName = "";
      if (row.answers_json) {
        try {
          const parsed = JSON.parse(row.answers_json) as Record<string, unknown>;
          if (typeof parsed["fullName"] === "string") fullName = parsed["fullName"];
        } catch {
          // ignore
        }
      }
      return {
        memberId: row.member_id,
        responseEmail: row.response_email,
        fullName,
        publicConsent: (row.public_consent ?? "unknown") as
          | "consented"
          | "declined"
          | "unknown",
        rulesConsent: (row.rules_consent ?? "unknown") as
          | "consented"
          | "declined"
          | "unknown",
        publishState: (row.publish_state ?? "member_only") as
          | "public"
          | "member_only"
          | "hidden",
        isDeleted: row.is_deleted === 1,
        lastSubmittedAt: normalizeIso(row.last_submitted_at),
      };
    });

    const view = { total: members.length, members };
    const parsed = AdminMemberListViewZ.safeParse(view);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  app.get("/members/:memberId", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);

    // audit log を取得
    const auditRows = await listByTarget(db, "member", memberId, 50);
    const adminAudit = auditRows.map((a) => ({
      actor: asAdminId(a.actorEmail ?? a.actorId ?? "system"),
      action: a.action as string,
      occurredAt: normalizeIso(a.createdAt),
      note: null as string | null,
    }));

    const view = await buildAdminMemberDetailView(db, mid, adminAudit, {
      attendanceProvider: createAttendanceProvider(db),
    });
    if (!view) return c.json({ ok: false, error: "not found" }, 404);

    const parsed = AdminMemberDetailViewZ.safeParse(view);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 500);
    }
    return c.json(parsed.data, 200);
  });

  return app;
};

export const adminMembersRoute = createAdminMembersRoute();
