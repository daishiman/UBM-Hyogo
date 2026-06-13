// @vitest-environment node
// Branch coverage for attendance-analytics extended functions (period/zone filters,
// trend, session detail, absentees, export, previous-period rate).
// 既存テストが未到達の分岐（period clause / zone filter / null fallback /
// previousPeriodRate / drilldown attendees vs absentees / export attended flag）を狙う。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
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
} from "../attendance-analytics";
import type { AttendanceFilter } from "../attendance-analytics";

const NO_FILTER: AttendanceFilter = { periodFrom: null, periodTo: null, zone: null };

const seedBase = async (env: InMemoryD1) => {
  // 3 sessions across 3 months (1 deleted), 3 members (1 deleted).
  await env.db.exec(
    "INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s1', 'S1', '2026-01-10', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s2', 'S2', '2026-02-10', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s4', 'S4', '2026-03-10', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO meeting_sessions (session_id, title, held_on, created_by, deleted_at) VALUES ('s3', 'S3-deleted', '2026-02-15', 'admin', '2026-03-15T00:00:00Z')",
  );

  await env.db.exec(
    "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m1', 'm1@example.com', 'r1', 'r1', '2026-01-01T00:00:00Z')",
  );
  await env.db.exec(
    "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m2', 'm2@example.com', 'r2', 'r2', '2026-01-01T00:00:00Z')",
  );
  await env.db.exec(
    "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m3', 'm3@example.com', 'r3', 'r3', '2026-01-01T00:00:00Z')",
  );

  await env.db.exec("INSERT INTO member_status (member_id, is_deleted) VALUES ('m1', 0)");
  await env.db.exec("INSERT INTO member_status (member_id, is_deleted) VALUES ('m2', 0)");
  await env.db.exec("INSERT INTO member_status (member_id, is_deleted) VALUES ('m3', 1)");

  // m1 attends s1, s2, s4 (3 -> zone_1_9); m2 attends s1 only (1 -> zone_1_9);
  // m2 also has a deleted-session row; m3 (deleted member) attends s2.
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m1', 's1', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m1', 's2', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m1', 's4', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m2', 's1', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m2', 's3', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m3', 's2', 'admin')",
  );
};

describe("attendance-analytics extended branches", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  describe("clamp helpers", () => {
    it("clampAnalyticsLimit handles undefined / invalid / over-max", () => {
      expect(clampAnalyticsLimit(undefined)).toBe(50);
      expect(clampAnalyticsLimit(0)).toBe(50);
      expect(clampAnalyticsLimit(-5)).toBe(50);
      expect(clampAnalyticsLimit(Number.NaN)).toBe(50);
      expect(clampAnalyticsLimit(10.9)).toBe(10);
      expect(clampAnalyticsLimit(9999)).toBe(200);
    });

    it("clampLastN handles undefined / invalid / over-max", () => {
      expect(clampLastN(undefined)).toBe(3);
      expect(clampLastN(0)).toBe(3);
      expect(clampLastN(-1)).toBe(3);
      expect(clampLastN(Number.NaN)).toBe(3);
      expect(clampLastN(5)).toBe(5);
      expect(clampLastN(50)).toBe(10);
    });
  });

  describe("computeAttendanceOverviewExt", () => {
    it("empty tables -> zero rates (denom guards)", async () => {
      const r = await computeAttendanceOverviewExt(env.ctx);
      expect(r.totalSessions).toBe(0);
      expect(r.totalMembers).toBe(0);
      expect(r.overallRate).toBe(0);
      expect(r.uniqueAttendanceRate).toBe(0);
      expect(r.previousPeriodRate).toBeNull();
    });

    it("computes previousPeriodRate when both period bounds are valid", async () => {
      await seedBase(env);
      const r = await computeAttendanceOverviewExt(env.ctx, {
        periodFrom: "2026-02-01",
        periodTo: "2026-03-01",
        zone: null,
      });
      // current window covers s2 only; previous window (2026-01-01..2026-02-01) covers s1.
      expect(r.previousPeriodRate).not.toBeNull();
      expect(r.filter.periodFrom).toBe("2026-02-01");
      expect(r.filter.periodTo).toBe("2026-03-01");
    });

    it("leaves previousPeriodRate null when only one bound is set", async () => {
      await seedBase(env);
      const r = await computeAttendanceOverviewExt(env.ctx, {
        periodFrom: "2026-02-01",
        periodTo: null,
        zone: null,
      });
      expect(r.previousPeriodRate).toBeNull();
    });

    it("leaves previousPeriodRate null when period bounds are invalid dates", async () => {
      await seedBase(env);
      const r = await computeAttendanceOverviewExt(env.ctx, {
        periodFrom: "not-a-date",
        periodTo: "also-bad",
        zone: null,
      });
      expect(r.previousPeriodRate).toBeNull();
    });

    it("leaves previousPeriodRate null when span is non-positive (from >= to)", async () => {
      await seedBase(env);
      const r = await computeAttendanceOverviewExt(env.ctx, {
        periodFrom: "2026-03-01",
        periodTo: "2026-02-01",
        zone: null,
      });
      expect(r.previousPeriodRate).toBeNull();
    });

    it("echoes zone filter array in the filter echo", async () => {
      await seedBase(env);
      const r = await computeAttendanceOverviewExt(env.ctx, {
        periodFrom: null,
        periodTo: null,
        zone: ["zone_1_9"],
      });
      expect(r.filter.zoneFilter).toEqual(["zone_1_9"]);
    });
  });

  describe("listSessionAttendanceStatsExt", () => {
    it("empty -> empty array", async () => {
      const r = await listSessionAttendanceStatsExt(env.ctx, NO_FILTER, 50);
      expect(r).toEqual([]);
    });

    it("applies period bounds and returns active sessions only", async () => {
      await seedBase(env);
      const r = await listSessionAttendanceStatsExt(
        env.ctx,
        { periodFrom: "2026-01-01", periodTo: "2026-03-01", zone: null },
        50,
      );
      const ids = r.map((x) => x.sessionId).sort();
      expect(ids).toEqual(["s1", "s2"]);
    });
  });

  describe("listMemberAttendanceRankingExt", () => {
    it("empty -> empty array", async () => {
      const r = await listMemberAttendanceRankingExt(env.ctx, NO_FILTER, 50);
      expect(r).toEqual([]);
    });

    it("filters out members whose computed zone is not in the zone filter", async () => {
      await seedBase(env);
      const all = await listMemberAttendanceRankingExt(env.ctx, NO_FILTER, 50);
      expect(all.map((x) => x.memberId as string).sort()).toEqual(["m1", "m2"]);

      // zone_0 filter excludes m1/m2 (both zone_1_9) -> empty.
      const filtered = await listMemberAttendanceRankingExt(
        env.ctx,
        { periodFrom: null, periodTo: null, zone: ["zone_0"] },
        50,
      );
      expect(filtered).toEqual([]);

      // matching zone keeps them.
      const kept = await listMemberAttendanceRankingExt(
        env.ctx,
        { periodFrom: null, periodTo: null, zone: ["zone_1_9"] },
        50,
      );
      expect(kept.map((x) => x.memberId as string).sort()).toEqual(["m1", "m2"]);
    });

    it("applies period clause with s2 alias rewrite in the rate subquery", async () => {
      await seedBase(env);
      const r = await listMemberAttendanceRankingExt(
        env.ctx,
        { periodFrom: "2026-01-01", periodTo: "2026-02-01", zone: null },
        50,
      );
      // only s1 in window -> m1 and m2 each attended once.
      const byId = Object.fromEntries(r.map((x) => [x.memberId as string, x.attendedCount]));
      expect(byId.m1).toBe(1);
      expect(byId.m2).toBe(1);
    });
  });

  describe("listAttendanceTrend", () => {
    it("empty -> empty buckets", async () => {
      const r = await listAttendanceTrend(env.ctx, NO_FILTER);
      expect(r.granularity).toBe("month");
      expect(r.buckets).toEqual([]);
    });

    it("groups active sessions into monthly buckets", async () => {
      await seedBase(env);
      const r = await listAttendanceTrend(env.ctx, NO_FILTER);
      const periods = r.buckets.map((b) => b.period);
      expect(periods).toEqual(["2026-01", "2026-02", "2026-03"]);
    });
  });

  describe("listZoneDistribution", () => {
    it("empty -> all zones zero, unknown filtered out", async () => {
      const r = await listZoneDistribution(env.ctx, NO_FILTER);
      expect(r.rows.every((row) => row.zone !== "unknown")).toBe(true);
      expect(r.rows.every((row) => row.attendeeCount === 0)).toBe(true);
    });

    it("buckets attendees by computed zone", async () => {
      await seedBase(env);
      const r = await listZoneDistribution(env.ctx, NO_FILTER);
      const z = Object.fromEntries(r.rows.map((row) => [row.zone, row.attendeeCount]));
      // m1 (3) and m2 (1) -> zone_1_9 has 2.
      expect(z.zone_1_9).toBe(2);
    });
  });

  describe("getSessionAttendanceDetail", () => {
    it("returns null for missing / deleted session", async () => {
      await seedBase(env);
      expect(await getSessionAttendanceDetail(env.ctx, "missing")).toBeNull();
      expect(await getSessionAttendanceDetail(env.ctx, "s3")).toBeNull();
    });

    it("splits members into attendees and absentees", async () => {
      await seedBase(env);
      const detail = await getSessionAttendanceDetail(env.ctx, "s1");
      expect(detail).not.toBeNull();
      const attendeeIds = detail!.attendees.map((a) => a.memberId).sort();
      const absenteeIds = detail!.absentees.map((a) => a.memberId).sort();
      // active members m1,m2 (m3 deleted). m1,m2 attended s1; none absent.
      expect(attendeeIds).toEqual(["m1", "m2"]);
      expect(absenteeIds).toEqual([]);

      const detail2 = await getSessionAttendanceDetail(env.ctx, "s4");
      // s4 attended only by m1 -> m2 absent.
      expect(detail2!.attendees.map((a) => a.memberId)).toEqual(["m1"]);
      expect(detail2!.absentees.map((a) => a.memberId)).toEqual(["m2"]);
    });
  });

  describe("listAbsentees", () => {
    it("empty -> empty rows with echoed lastN", async () => {
      const r = await listAbsentees(env.ctx, NO_FILTER, 3);
      expect(r.rows).toEqual([]);
      expect(r.lastN).toBe(3);
    });

    it("returns members missing >= lastN of the recent sessions", async () => {
      await seedBase(env);
      // 3 recent active sessions (s1,s2,s4). m2 attended only s1 -> missed 2.
      const r = await listAbsentees(env.ctx, NO_FILTER, 2);
      expect(r.rows.map((x) => x.memberId)).toContain("m2");
      expect(r.rows.every((x) => x.missedCount >= 2)).toBe(true);
    });

    it("applies zone filter to absentee rows", async () => {
      await seedBase(env);
      const none = await listAbsentees(
        env.ctx,
        { periodFrom: null, periodTo: null, zone: ["zone_100_plus"] },
        1,
      );
      expect(none.rows).toEqual([]);
    });
  });

  describe("listAttendanceExportRows", () => {
    it("empty -> empty array", async () => {
      const r = await listAttendanceExportRows(env.ctx, NO_FILTER);
      expect(r).toEqual([]);
    });

    it("emits one row per (active session x active member) with attended flag", async () => {
      await seedBase(env);
      const rows = await listAttendanceExportRows(env.ctx, NO_FILTER);
      // 3 active sessions x 2 active members = 6 rows.
      expect(rows).toHaveLength(6);
      const attendedS1 = rows.filter((r) => r.sessionId === "s1" && r.attended === 1);
      expect(attendedS1.map((r) => r.memberId).sort()).toEqual(["m1", "m2"]);
      const notAttendedS4 = rows.filter((r) => r.sessionId === "s4" && r.attended === 0);
      expect(notAttendedS4.map((r) => r.memberId)).toEqual(["m2"]);
    });

    it("applies zone filter to export rows", async () => {
      await seedBase(env);
      const filtered = await listAttendanceExportRows(env.ctx, {
        periodFrom: null,
        periodTo: null,
        zone: ["zone_0"],
      });
      // m1/m2 are zone_1_9 -> excluded.
      expect(filtered).toEqual([]);
    });
  });
});
