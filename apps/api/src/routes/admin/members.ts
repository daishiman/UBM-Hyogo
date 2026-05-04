// 04c / 06c-B: GET /admin/members, GET /admin/members/:memberId
// 12-search-tags の検索パラメータ (q / zone / tag(repeated) / sort / density / page)
// と既存 filter (published|hidden|deleted) を組合せて返す。
import { Hono } from "hono";
import { requireAdmin } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { asMemberId, asAdminId } from "../../repository/_shared/brand";
import { buildAdminMemberDetailView } from "../../repository/_shared/builder";
import { createAttendanceProvider } from "../../repository/attendance";
import { listByTarget } from "../../repository/auditLog";
import {
  ADMIN_DENSITY_VALUES,
  ADMIN_SEARCH_LIMITS,
  ADMIN_SORT_VALUES,
  ADMIN_ZONE_VALUES,
  AdminMemberListViewZ,
  AdminMemberDetailViewZ,
  STABLE_KEY,
  type AdminDensity,
  type AdminFilter,
  type AdminSort,
  type AdminZone,
} from "@ubm-hyogo/shared";
import { normalizeIso, type AdminRouteEnv } from "./_shared";

const FILTER_VALUES = ["published", "hidden", "deleted"] as const;
const isOneOf = <T extends readonly string[]>(
  value: string,
  values: T,
): value is T[number] => (values as readonly string[]).includes(value);

const normalizeQ = (raw: string): string =>
  raw.trim().replace(/\s+/g, " ");

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

const filterToSql = (filter?: AdminFilter): string => {
  if (filter === "published") {
    return "COALESCE(ms.is_deleted, 0) = 0 AND COALESCE(ms.publish_state, 'member_only') = 'public'";
  }
  if (filter === "hidden") {
    return "COALESCE(ms.is_deleted, 0) = 0 AND COALESCE(ms.publish_state, 'member_only') = 'hidden'";
  }
  if (filter === "deleted") {
    return "COALESCE(ms.is_deleted, 0) = 1";
  }
  return "1=1";
};

interface ParsedSearch {
  filter: AdminFilter | undefined;
  q: string;
  zone: AdminZone;
  tags: string[];
  sort: AdminSort;
  density: AdminDensity;
  page: number;
}

const parseSearchOrError = (
  query: Record<string, string | undefined>,
  rawQueries: { tag: string[] },
): { ok: true; value: ParsedSearch } | { ok: false; status: 400 | 422; error: string } => {
  // filter: 旧 contract 互換のため空は undefined（全件）。値がある場合のみ enum 検証
  let filter: ParsedSearch["filter"] = undefined;
  if (query.filter !== undefined && query.filter !== "") {
    if (!isOneOf(query.filter, FILTER_VALUES)) {
      return { ok: false, status: 400, error: "invalid filter" };
    }
    filter = query.filter;
  }

  const qRaw = query.q ?? "";
  if (qRaw.length > ADMIN_SEARCH_LIMITS.Q_LIMIT * 4) {
    // バッファとして 4 倍までは accept（trim 前判定）
    return { ok: false, status: 422, error: "q too long" };
  }
  const q = normalizeQ(qRaw);
  if (q.length > ADMIN_SEARCH_LIMITS.Q_LIMIT) {
    return { ok: false, status: 422, error: "q too long" };
  }

  const zoneRaw = query.zone ?? "all";
  if (!isOneOf(zoneRaw, ADMIN_ZONE_VALUES)) {
    return { ok: false, status: 422, error: "invalid zone" };
  }

  const sortRaw = query.sort ?? "recent";
  if (!isOneOf(sortRaw, ADMIN_SORT_VALUES)) {
    return { ok: false, status: 422, error: "invalid sort" };
  }

  const densityRaw = query.density ?? "comfy";
  if (!isOneOf(densityRaw, ADMIN_DENSITY_VALUES)) {
    return { ok: false, status: 422, error: "invalid density" };
  }

  const tags = rawQueries.tag.filter((t) => t && t.length > 0);
  if (tags.length > ADMIN_SEARCH_LIMITS.TAG_LIMIT) {
    return { ok: false, status: 422, error: "too many tags" };
  }

  let page = 1;
  if (query.page !== undefined && query.page !== "") {
    const n = Number(query.page);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      return { ok: false, status: 422, error: "invalid page" };
    }
    page = n;
  }

  return {
    ok: true,
    value: {
      filter,
      q,
      zone: zoneRaw,
      tags,
      sort: sortRaw,
      density: densityRaw,
      page,
    },
  };
};

interface BuiltQuery {
  whereSql: string;
  joinSql: string;
  havingSql: string;
  groupBySql: string;
  binds: unknown[];
}

const buildSearchSql = (s: ParsedSearch): BuiltQuery => {
  const where: string[] = [filterToSql(s.filter)];
  const joins: string[] = [];
  const binds: unknown[] = [];

  if (s.q) {
    // response_email + answers_json の主要キーを LIKE 検索。
    const like = `%${s.q.replace(/[%_]/g, (c) => `\\${c}`)}%`;
    where.push(
      "(LOWER(mi.response_email) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.fullName'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.nickname'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.occupation'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.location'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.businessOverview'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.skills'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.canProvide'), '')) LIKE LOWER(?) ESCAPE '\\' " +
        "OR LOWER(COALESCE(json_extract(mr.answers_json, '$.selfIntroduction'), '')) LIKE LOWER(?) ESCAPE '\\')",
    );
    for (let i = 0; i < 9; i++) binds.push(like);
  }

  if (s.zone !== "all") {
    where.push("COALESCE(json_extract(mr.answers_json, '$.ubmZone'), '') = ?");
    binds.push(s.zone);
  }

  // tag AND: 各 tag を別 EXISTS で wrap して AND 条件にする
  for (const tag of s.tags) {
    where.push(
      "EXISTS (SELECT 1 FROM member_tags mt JOIN tag_definitions td ON td.tag_id = mt.tag_id WHERE mt.member_id = mi.member_id AND td.code = ?)",
    );
    binds.push(tag);
  }

  return {
    whereSql: `WHERE ${where.join(" AND ")}`,
    joinSql: joins.join(" "),
    havingSql: "",
    groupBySql: "",
    binds,
  };
};

const sortToSql = (sort: AdminSort): string => {
  if (sort === "name") {
    return "ORDER BY COALESCE(json_extract(mr.answers_json, '$.fullName'), '') ASC, mi.last_submitted_at DESC";
  }
  return "ORDER BY mi.last_submitted_at DESC";
};

export const createAdminMembersRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv }>();
  app.use("*", requireAdmin);

  app.get("/members", async (c) => {
    const queries = c.req.queries();
    const single: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(queries)) {
      single[k] = v[0];
    }
    const tagArr = queries.tag ?? [];

    const parsed = parseSearchOrError(single, { tag: tagArr });
    if (!parsed.ok) {
      return c.json({ ok: false, error: parsed.error }, parsed.status);
    }
    const s = parsed.value;
    const built = buildSearchSql(s);

    const db = ctx({ DB: c.env.DB });

    // total count
    const countRow = await db.db
      .prepare(
        `SELECT COUNT(DISTINCT mi.member_id) AS n
         FROM member_identities mi
         LEFT JOIN member_responses mr ON mr.response_id = mi.current_response_id
         LEFT JOIN member_status ms ON ms.member_id = mi.member_id
         ${built.joinSql}
         ${built.whereSql} AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)`,
      )
      .bind(...built.binds)
      .first<{ n: number }>();
    const total = countRow?.n ?? 0;

    const offset = (s.page - 1) * ADMIN_SEARCH_LIMITS.PAGE_SIZE;
    const r = await db.db
      .prepare(
        `SELECT mi.member_id, mi.response_email, mi.last_submitted_at,
                mr.answers_json,
                ms.public_consent, ms.rules_consent, ms.publish_state, ms.is_deleted
         FROM member_identities mi
         LEFT JOIN member_responses mr ON mr.response_id = mi.current_response_id
         LEFT JOIN member_status ms ON ms.member_id = mi.member_id
         ${built.joinSql}
         ${built.whereSql} AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)
         ${sortToSql(s.sort)}
         LIMIT ? OFFSET ?`,
      )
      .bind(...built.binds, ADMIN_SEARCH_LIMITS.PAGE_SIZE, offset)
      .all<MemberListRow>();

    const members = (r.results ?? []).map((row) => {
      let fullName = "";
      if (row.answers_json) {
        try {
          const p = JSON.parse(row.answers_json) as Record<string, unknown>;
          const fn = p[STABLE_KEY.fullName];
          if (typeof fn === "string") fullName = fn;
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

    const view = {
      total,
      members,
      page: s.page,
        pageSize: ADMIN_SEARCH_LIMITS.PAGE_SIZE,
    };
    const parsedView = AdminMemberListViewZ.safeParse(view);
    if (!parsedView.success) {
      return c.json({ ok: false, error: parsedView.error.message }, 500);
    }
    return c.json(parsedView.data, 200);
  });

  app.get("/members/:memberId", async (c) => {
    const memberId = c.req.param("memberId");
    if (!memberId) return c.json({ ok: false, error: "missing memberId" }, 400);
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(memberId);

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
