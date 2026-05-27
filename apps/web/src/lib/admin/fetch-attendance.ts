import "server-only";
import {
  AttendanceOverviewExtZ,
  SessionAttendanceRowsZ,
  MemberAttendanceRankingRowsZ,
  AttendanceTrendZ,
  AttendanceZoneDistributionZ,
  AttendanceSessionDetailZ,
  AttendanceAbsenteeListZ,
  type AttendanceZone,
  type AttendanceOverviewExt,
  type AttendanceTrend,
  type AttendanceZoneDistribution,
  type AttendanceSessionDetail,
  type AttendanceAbsenteeList,
  type SessionAttendanceRowView,
  type MemberAttendanceRankingView,
} from "@ubm-hyogo/shared";
import { safeServerFetch } from "./safe-server-fetch";
import type { SafeResult } from "../result";

export interface AttendanceFiltersDTO {
  readonly periodFrom: string | null;
  readonly periodTo: string | null;
  readonly zones: readonly AttendanceZone[] | null;
  readonly limit?: number;
  readonly lastN?: number;
}

export interface AttendanceAnalyticsBundle {
  readonly overview: SafeResult<AttendanceOverviewExt>;
  readonly bySession: SafeResult<SessionAttendanceRowView[]>;
  readonly ranking: SafeResult<MemberAttendanceRankingView[]>;
  readonly trend: SafeResult<AttendanceTrend>;
  readonly zoneDistribution: SafeResult<AttendanceZoneDistribution>;
  readonly absentees: SafeResult<AttendanceAbsenteeList>;
}

const buildQuery = (f: AttendanceFiltersDTO, extra?: Record<string, string | number | undefined>): string => {
  const params = new URLSearchParams();
  if (f.periodFrom) params.set("periodFrom", f.periodFrom);
  if (f.periodTo) params.set("periodTo", f.periodTo);
  if (f.zones && f.zones.length > 0) params.set("zone", f.zones.join(","));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined) params.set(k, String(v));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
};

const parsed = <T>(input: SafeResult<unknown>, schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } }): SafeResult<T> => {
  if (!input.ok) return input;
  const p = schema.safeParse(input.data);
  if (p.success && p.data !== undefined) return { ok: true, data: p.data };
  return { ok: false, error: { code: "ADMIN_FETCH_SCHEMA", message: "schema parse failed" } };
};

export async function fetchAttendanceAnalyticsBundle(
  f: AttendanceFiltersDTO,
): Promise<AttendanceAnalyticsBundle> {
  const limitQ = f.limit ? { limit: f.limit } : undefined;
  const lastNQ = f.lastN ? { lastN: f.lastN } : undefined;

  const [overview, bySession, ranking, trend, zone, absentees] = await Promise.all([
    safeServerFetch<unknown>(`/admin/dashboard/attendance/overview${buildQuery(f)}`),
    safeServerFetch<unknown>(`/admin/dashboard/attendance/by-session${buildQuery(f, limitQ)}`),
    safeServerFetch<unknown>(`/admin/dashboard/attendance/ranking${buildQuery(f, limitQ)}`),
    safeServerFetch<unknown>(`/admin/dashboard/attendance/trend${buildQuery(f)}`),
    safeServerFetch<unknown>(`/admin/dashboard/attendance/zone-distribution${buildQuery(f)}`),
    safeServerFetch<unknown>(`/admin/dashboard/attendance/absentees${buildQuery(f, lastNQ)}`),
  ]);

  return {
    overview: parsed<AttendanceOverviewExt>(overview, AttendanceOverviewExtZ),
    bySession: parsed<SessionAttendanceRowView[]>(bySession, SessionAttendanceRowsZ),
    ranking: parsed<MemberAttendanceRankingView[]>(ranking, MemberAttendanceRankingRowsZ),
    trend: parsed<AttendanceTrend>(trend, AttendanceTrendZ),
    zoneDistribution: parsed<AttendanceZoneDistribution>(zone, AttendanceZoneDistributionZ),
    absentees: parsed<AttendanceAbsenteeList>(absentees, AttendanceAbsenteeListZ),
  };
}

export async function fetchAttendanceSessionDetail(
  sessionId: string,
): Promise<SafeResult<AttendanceSessionDetail>> {
  const r = await safeServerFetch<unknown>(
    `/admin/dashboard/attendance/sessions/${encodeURIComponent(sessionId)}/attendees`,
  );
  return parsed<AttendanceSessionDetail>(r, AttendanceSessionDetailZ);
}

export function buildAttendanceExportUrl(f: AttendanceFiltersDTO): string {
  return `/api/admin/dashboard/attendance/export${buildQuery(f)}`;
}

export const __testInternals = { buildQuery };
