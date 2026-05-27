// Phase 5 — admin-attendance-analytics-redesign
// Extended analytics with period + zone filtering, trend buckets, zone distribution,
// session drilldown, absentee tracking, CSV export. read-only.
import type { DbCtx } from "./_shared/db";
import type {
  AttendanceZone,
  AttendanceOverviewExt,
  AttendanceTrend,
  AttendanceTrendBucket,
  AttendanceZoneDistribution,
  AttendanceSessionDetail,
  AttendanceAbsenteeList,
  AttendanceMemberRef,
} from "@ubm-hyogo/shared";
import type {
  AttendanceOverview,
  SessionAttendanceRow,
  MemberAttendanceRanking,
} from "./attendance";

export interface AttendanceFilter {
  readonly periodFrom: string | null;
  readonly periodTo: string | null;
  readonly zone: readonly AttendanceZone[] | null;
}

const EMPTY_FILTER: AttendanceFilter = {
  periodFrom: null,
  periodTo: null,
  zone: null,
};

const ANALYTICS_DEFAULT_LIMIT = 50;
const ANALYTICS_MAX_LIMIT = 200;

export const clampAnalyticsLimit = (raw: number | undefined): number => {
  const n = raw ?? ANALYTICS_DEFAULT_LIMIT;
  if (!Number.isFinite(n) || n <= 0) return ANALYTICS_DEFAULT_LIMIT;
  return Math.min(Math.floor(n), ANALYTICS_MAX_LIMIT);
};

export const clampLastN = (raw: number | undefined): number => {
  const n = raw ?? 3;
  if (!Number.isFinite(n) || n <= 0) return 3;
  return Math.min(Math.floor(n), 10);
};

const zoneFromCount = (count: number): AttendanceZone => {
  if (count <= 0) return "0→1";
  if (count <= 9) return "1→10";
  if (count <= 99) return "10→100";
  return "unknown";
};

const normalizeZone = (raw: unknown): AttendanceZone => {
  if (raw === "0→1" || raw === "1→10" || raw === "10→100") return raw;
  return "unknown";
};

const sessionPeriodClause = (
  f: AttendanceFilter,
  alias = "s",
): { sql: string; binds: (string | number)[] } => {
  const binds: (string | number)[] = [];
  let sql = "";
  if (f.periodFrom) {
    sql += ` AND ${alias}.held_on >= ?`;
    binds.push(f.periodFrom);
  }
  if (f.periodTo) {
    sql += ` AND ${alias}.held_on < ?`;
    binds.push(f.periodTo);
  }
  return { sql, binds };
};

const filterEcho = (f: AttendanceFilter) => ({
  periodFrom: f.periodFrom,
  periodTo: f.periodTo,
  zoneFilter: f.zone ? [...f.zone] : null,
});

// ── Overview (extended) ─────────────────────────────────────────────
interface OverviewRow {
  totalSessions: number;
  totalMembers: number;
  attendCount: number;
}

const fetchOverviewRow = async (
  c: DbCtx,
  f: AttendanceFilter,
): Promise<OverviewRow> => {
  const period = sessionPeriodClause(f);
  const row = await c.db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM meeting_sessions s WHERE s.deleted_at IS NULL${period.sql}) AS totalSessions,
         (SELECT COUNT(*) FROM member_identities mi
            LEFT JOIN member_status ms ON ms.member_id = mi.member_id
            WHERE COALESCE(ms.is_deleted, 0) = 0) AS totalMembers,
         (SELECT COUNT(*) FROM member_attendance ma
            JOIN meeting_sessions s ON s.session_id = ma.session_id
            JOIN member_identities mi ON mi.member_id = ma.member_id
            LEFT JOIN member_status ms ON ms.member_id = mi.member_id
            WHERE s.deleted_at IS NULL AND COALESCE(ms.is_deleted, 0) = 0${period.sql}) AS attendCount
      `,
    )
    .bind(...period.binds, ...period.binds)
    .first<OverviewRow>();
  return {
    totalSessions: row?.totalSessions ?? 0,
    totalMembers: row?.totalMembers ?? 0,
    attendCount: row?.attendCount ?? 0,
  };
};

export async function computeAttendanceOverviewExt(
  c: DbCtx,
  f: AttendanceFilter = EMPTY_FILTER,
): Promise<AttendanceOverviewExt> {
  const cur = await fetchOverviewRow(c, f);
  const denom = cur.totalSessions * cur.totalMembers;
  const overallRate = denom > 0 ? cur.attendCount / denom : 0;

  let previousPeriodRate: number | null = null;
  if (f.periodFrom && f.periodTo) {
    const from = new Date(f.periodFrom);
    const to = new Date(f.periodTo);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      const span = to.getTime() - from.getTime();
      if (span > 0) {
        const prevFrom = new Date(from.getTime() - span);
        const prev = await fetchOverviewRow(c, {
          periodFrom: prevFrom.toISOString().slice(0, 10),
          periodTo: f.periodFrom,
          zone: f.zone,
        });
        const prevDenom = prev.totalSessions * prev.totalMembers;
        previousPeriodRate = prevDenom > 0 ? prev.attendCount / prevDenom : 0;
      }
    }
  }

  return {
    totalSessions: cur.totalSessions,
    totalMembers: cur.totalMembers,
    overallRate: Math.min(1, Math.max(0, overallRate)),
    previousPeriodRate,
    filter: filterEcho(f),
  };
}

// ── By-session (extended) ──────────────────────────────────────────
interface SessionStatsRow {
  session_id: string;
  title: string;
  held_on: string;
  attendee_count: number;
  rate: number;
}

export async function listSessionAttendanceStatsExt(
  c: DbCtx,
  f: AttendanceFilter,
  limit: number,
): Promise<SessionAttendanceRow[]> {
  const period = sessionPeriodClause(f);
  const r = await c.db
    .prepare(
      `SELECT
         s.session_id,
         s.title,
         s.held_on,
         COUNT(CASE WHEN mi.member_id IS NOT NULL AND COALESCE(ms.is_deleted, 0) = 0 THEN mi.member_id END) AS attendee_count,
         COALESCE(
           CAST(COUNT(CASE WHEN mi.member_id IS NOT NULL AND COALESCE(ms.is_deleted, 0) = 0 THEN mi.member_id END) AS REAL) /
             NULLIF((SELECT COUNT(*) FROM member_identities mi2
                       LEFT JOIN member_status ms2 ON ms2.member_id = mi2.member_id
                       WHERE COALESCE(ms2.is_deleted, 0) = 0), 0),
           0
         ) AS rate
       FROM meeting_sessions s
       LEFT JOIN member_attendance ma ON ma.session_id = s.session_id
       LEFT JOIN member_identities mi ON mi.member_id = ma.member_id
       LEFT JOIN member_status ms ON ms.member_id = mi.member_id
       WHERE s.deleted_at IS NULL${period.sql}
       GROUP BY s.session_id, s.title, s.held_on
       ORDER BY s.held_on DESC, s.session_id ASC
       LIMIT ?`,
    )
    .bind(...period.binds, limit)
    .all<SessionStatsRow>();
  return (r.results ?? []).map((row) => ({
    sessionId: row.session_id,
    title: row.title,
    heldOn: row.held_on,
    attendeeCount: row.attendee_count,
    rate: row.rate,
  }));
}

// ── Ranking (extended) ─────────────────────────────────────────────
interface RankingExtRow {
  member_id: string;
  display_name: string | null;
  attended_count: number;
  rate: number;
  last_attended_at: string | null;
}

export async function listMemberAttendanceRankingExt(
  c: DbCtx,
  f: AttendanceFilter,
  limit: number,
): Promise<MemberAttendanceRanking[]> {
  const period = sessionPeriodClause(f);
  const r = await c.db
    .prepare(
      `SELECT
         mi.member_id,
         mi.response_email AS display_name,
         COUNT(s.session_id) AS attended_count,
         COALESCE(
           CAST(COUNT(s.session_id) AS REAL) /
             NULLIF((SELECT COUNT(*) FROM meeting_sessions s2 WHERE s2.deleted_at IS NULL${
               period.sql ? period.sql.replace(/s\./g, "s2.") : ""
             }), 0),
           0
         ) AS rate,
         MAX(s.held_on) AS last_attended_at
       FROM member_identities mi
       LEFT JOIN member_status ms ON ms.member_id = mi.member_id
       LEFT JOIN member_attendance ma ON ma.member_id = mi.member_id
       LEFT JOIN meeting_sessions s ON s.session_id = ma.session_id AND s.deleted_at IS NULL${period.sql}
       WHERE COALESCE(ms.is_deleted, 0) = 0
       GROUP BY mi.member_id, mi.response_email
       ORDER BY attended_count DESC, mi.member_id ASC
       LIMIT ?`,
    )
    .bind(...period.binds, ...period.binds, limit)
    .all<RankingExtRow>();

  const rows: MemberAttendanceRanking[] = [];
  for (const row of r.results ?? []) {
    const zone = zoneFromCount(row.attended_count);
    if (f.zone && f.zone.length > 0 && !f.zone.includes(zone)) continue;
    rows.push({
      memberId: row.member_id as MemberAttendanceRanking["memberId"],
      displayName: row.display_name ?? "",
      attendedCount: row.attended_count,
      rate: Math.min(1, Math.max(0, row.rate)),
    });
  }
  return rows;
}

// ── Trend (monthly buckets) ────────────────────────────────────────
interface TrendDbRow {
  period: string;
  attendee_count: number;
  session_count: number;
  unique_member_count: number;
}

export async function listAttendanceTrend(
  c: DbCtx,
  f: AttendanceFilter,
): Promise<AttendanceTrend> {
  const period = sessionPeriodClause(f);
  const r = await c.db
    .prepare(
      `SELECT
         substr(s.held_on, 1, 7) AS period,
         COUNT(CASE WHEN mi.member_id IS NOT NULL AND COALESCE(ms.is_deleted, 0) = 0 THEN 1 END) AS attendee_count,
         COUNT(DISTINCT s.session_id) AS session_count,
         COUNT(DISTINCT CASE WHEN COALESCE(ms.is_deleted, 0) = 0 THEN mi.member_id END) AS unique_member_count
       FROM meeting_sessions s
       LEFT JOIN member_attendance ma ON ma.session_id = s.session_id
       LEFT JOIN member_identities mi ON mi.member_id = ma.member_id
       LEFT JOIN member_status ms ON ms.member_id = mi.member_id
       WHERE s.deleted_at IS NULL${period.sql}
       GROUP BY substr(s.held_on, 1, 7)
       ORDER BY period ASC`,
    )
    .bind(...period.binds)
    .all<TrendDbRow>();
  const buckets: AttendanceTrendBucket[] = (r.results ?? []).map((row) => ({
    period: row.period,
    attendeeCount: row.attendee_count,
    sessionCount: row.session_count,
    uniqueMemberCount: row.unique_member_count,
  }));
  return {
    granularity: "month",
    buckets,
    filter: filterEcho(f),
  };
}

// ── Zone distribution ──────────────────────────────────────────────
interface MemberAttendDbRow {
  member_id: string;
  attended_count: number;
}

export async function listZoneDistribution(
  c: DbCtx,
  f: AttendanceFilter,
): Promise<AttendanceZoneDistribution> {
  const period = sessionPeriodClause(f);
  const r = await c.db
    .prepare(
      `SELECT mi.member_id,
              COUNT(s.session_id) AS attended_count
       FROM member_identities mi
       LEFT JOIN member_status ms ON ms.member_id = mi.member_id
       LEFT JOIN member_attendance ma ON ma.member_id = mi.member_id
       LEFT JOIN meeting_sessions s ON s.session_id = ma.session_id AND s.deleted_at IS NULL${period.sql}
       WHERE COALESCE(ms.is_deleted, 0) = 0
       GROUP BY mi.member_id`,
    )
    .bind(...period.binds)
    .all<MemberAttendDbRow>();

  const counts: Record<AttendanceZone, number> = {
    "0→1": 0,
    "1→10": 0,
    "10→100": 0,
    unknown: 0,
  };
  let total = 0;
  for (const row of r.results ?? []) {
    const zone = zoneFromCount(row.attended_count);
    counts[zone] += 1;
    total += 1;
  }
  const zones: AttendanceZone[] = ["0→1", "1→10", "10→100", "unknown"];
  const rows = zones
    .map((zone) => ({
      zone,
      attendeeCount: counts[zone],
      rate: total > 0 ? counts[zone] / total : 0,
    }))
    .filter((row) => row.zone !== "unknown" || row.attendeeCount > 0);
  return { rows, filter: filterEcho(f) };
}

// ── Session detail (drilldown) ─────────────────────────────────────
interface SessionRow {
  session_id: string;
  title: string;
  held_on: string;
}
interface AttendeeRow {
  member_id: string;
  display_name: string | null;
  attended_count: number;
}

export async function getSessionAttendanceDetail(
  c: DbCtx,
  sessionId: string,
): Promise<AttendanceSessionDetail | null> {
  const session = await c.db
    .prepare(
      `SELECT s.session_id, s.title, s.held_on
       FROM meeting_sessions s
       WHERE s.session_id = ? AND s.deleted_at IS NULL`,
    )
    .bind(sessionId)
    .first<SessionRow>();
  if (!session) return null;

  const memberRows = await c.db
    .prepare(
      `SELECT mi.member_id,
              mi.response_email AS display_name,
              (SELECT COUNT(*) FROM member_attendance ma2
                 JOIN meeting_sessions s2 ON s2.session_id = ma2.session_id AND s2.deleted_at IS NULL
                 WHERE ma2.member_id = mi.member_id) AS attended_count,
              EXISTS(SELECT 1 FROM member_attendance ma WHERE ma.member_id = mi.member_id AND ma.session_id = ?) AS attended
       FROM member_identities mi
       LEFT JOIN member_status ms ON ms.member_id = mi.member_id
       WHERE COALESCE(ms.is_deleted, 0) = 0
       ORDER BY mi.member_id ASC`,
    )
    .bind(sessionId)
    .all<AttendeeRow & { attended: number }>();

  const attendees: AttendanceMemberRef[] = [];
  const absentees: AttendanceMemberRef[] = [];
  for (const row of memberRows.results ?? []) {
    const ref: AttendanceMemberRef = {
      memberId: row.member_id,
      displayName: row.display_name ?? "",
      zone: zoneFromCount(row.attended_count),
    };
    if (row.attended) attendees.push(ref);
    else absentees.push(ref);
  }
  return {
    sessionId: session.session_id,
    title: session.title,
    heldOn: session.held_on,
    attendees,
    absentees,
  };
}

// ── Absentees (recent N missed) ────────────────────────────────────
interface AbsenteeDbRow {
  member_id: string;
  display_name: string | null;
  attended_count: number;
  last_attended_at: string | null;
  missed_count: number;
}

export async function listAbsentees(
  c: DbCtx,
  f: AttendanceFilter,
  lastN: number,
): Promise<AttendanceAbsenteeList> {
  const period = sessionPeriodClause(f);
  const r = await c.db
    .prepare(
      `WITH recent_sessions AS (
         SELECT session_id FROM meeting_sessions s
         WHERE s.deleted_at IS NULL${period.sql}
         ORDER BY s.held_on DESC, s.session_id ASC
         LIMIT ?
       )
       SELECT mi.member_id,
              mi.response_email AS display_name,
              (SELECT COUNT(*) FROM member_attendance ma2
                 JOIN meeting_sessions s2 ON s2.session_id = ma2.session_id AND s2.deleted_at IS NULL
                 WHERE ma2.member_id = mi.member_id) AS attended_count,
              (SELECT MAX(s3.held_on) FROM member_attendance ma3
                 JOIN meeting_sessions s3 ON s3.session_id = ma3.session_id AND s3.deleted_at IS NULL
                 WHERE ma3.member_id = mi.member_id) AS last_attended_at,
              ((SELECT COUNT(*) FROM recent_sessions) - COUNT(rs.session_id)) AS missed_count
       FROM member_identities mi
       LEFT JOIN member_status ms ON ms.member_id = mi.member_id
       LEFT JOIN member_attendance ma ON ma.member_id = mi.member_id
       LEFT JOIN recent_sessions rs ON rs.session_id = ma.session_id
       WHERE COALESCE(ms.is_deleted, 0) = 0
       GROUP BY mi.member_id, mi.response_email
       HAVING missed_count >= ?
       ORDER BY missed_count DESC, mi.member_id ASC`,
    )
    .bind(...period.binds, lastN, lastN)
    .all<AbsenteeDbRow>();

  const rows = (r.results ?? [])
    .map((row) => {
      const zone = zoneFromCount(row.attended_count);
      return {
        memberId: row.member_id,
        displayName: row.display_name ?? "",
        zone,
        lastAttendedAt: row.last_attended_at,
        missedCount: row.missed_count,
      };
    })
    .filter((row) => !f.zone || f.zone.length === 0 || f.zone.includes(row.zone));

  return { rows, lastN, filter: filterEcho(f) };
}

// ── CSV export rows ────────────────────────────────────────────────
export interface AttendanceExportRow {
  sessionId: string;
  title: string;
  heldOn: string;
  memberId: string;
  displayName: string;
  zone: AttendanceZone;
  attended: 0 | 1;
}

interface ExportDbRow {
  session_id: string;
  title: string;
  held_on: string;
  member_id: string;
  display_name: string | null;
  attended_count: number;
  attended: number;
}

export async function listAttendanceExportRows(
  c: DbCtx,
  f: AttendanceFilter,
): Promise<AttendanceExportRow[]> {
  const period = sessionPeriodClause(f);
  const r = await c.db
    .prepare(
      `SELECT s.session_id, s.title, s.held_on,
              mi.member_id, mi.response_email AS display_name,
              (SELECT COUNT(*) FROM member_attendance ma2
                 JOIN meeting_sessions s2 ON s2.session_id = ma2.session_id AND s2.deleted_at IS NULL
                 WHERE ma2.member_id = mi.member_id) AS attended_count,
              EXISTS(SELECT 1 FROM member_attendance ma WHERE ma.member_id = mi.member_id AND ma.session_id = s.session_id) AS attended
       FROM meeting_sessions s
       CROSS JOIN member_identities mi
       LEFT JOIN member_status ms ON ms.member_id = mi.member_id
       WHERE s.deleted_at IS NULL AND COALESCE(ms.is_deleted, 0) = 0${period.sql}
       ORDER BY s.held_on DESC, s.session_id ASC, mi.member_id ASC`,
    )
    .bind(...period.binds)
    .all<ExportDbRow>();
  const rows: AttendanceExportRow[] = [];
  for (const row of r.results ?? []) {
    const zone = zoneFromCount(row.attended_count);
    if (f.zone && f.zone.length > 0 && !f.zone.includes(zone)) continue;
    rows.push({
      sessionId: row.session_id,
      title: row.title,
      heldOn: row.held_on,
      memberId: row.member_id,
      displayName: row.display_name ?? "",
      zone,
      attended: row.attended ? 1 : 0,
    });
  }
  return rows;
}

// Re-exports from legacy attendance.ts for downstream consumers
export type {
  AttendanceOverview,
  SessionAttendanceRow,
  MemberAttendanceRanking,
} from "./attendance";

export const __testInternals = {
  zoneFromCount,
  normalizeZone,
  sessionPeriodClause,
};
