// @vitest-environment node
// Branch coverage recovery for attendance-analytics repository.
// Targets the remaining uncovered fallback/edge branches not hit by the existing
// extended spec:
//  - fetchOverviewRow `row?.field ?? 0` fallbacks (L133-136) via stub first() -> null row
//  - previousPeriodRate `prevDenom > 0 ? : 0` false branch (L164) via real D1 empty prev window
//  - `r.results ?? []` fallbacks across list functions (L220/L271/L314/L356/L415/L477/L536) via stub
//  - `row.display_name ?? ""` fallbacks (L276/L418/L482/L544) via stub rows with null display_name
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./__tests__/_setup";
import type { DbCtx } from "./_shared/db";
import {
  computeAttendanceOverviewExt,
  getSessionAttendanceDetail,
  listAbsentees,
  listAttendanceExportRows,
  listAttendanceTrend,
  listMemberAttendanceRankingExt,
  listSessionAttendanceStatsExt,
  listZoneDistribution,
} from "./attendance-analytics";
import type { AttendanceFilter } from "./attendance-analytics";

const NO_FILTER: AttendanceFilter = { periodFrom: null, periodTo: null, zone: null };

// Stub ctx where `.first()` returns `firstRow` and `.all()` returns `allShape`.
// allShape defaults to `{}` (missing `results`) to exercise the `?? []` fallback.
const stubCtx = (opts: {
  firstRow?: unknown;
  allShape?: unknown;
}): DbCtx => ({
  db: {
    prepare: () => {
      const stmt = {
        bind: () => stmt,
        first: async () => (opts.firstRow ?? null) as never,
        all: async () => (opts.allShape ?? {}) as never,
        run: async () => ({ success: true, meta: { changes: 0, last_row_id: 0 } }),
      };
      return stmt;
    },
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as DbCtx["db"],
});

describe("attendance-analytics branch recovery", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("computeAttendanceOverviewExt falls back to 0 when row fields are missing (L133-136)", async () => {
    // first() returns a row object that lacks the aggregate fields -> `?? 0`.
    const ctx = stubCtx({ firstRow: {} });
    const r = await computeAttendanceOverviewExt(ctx);
    expect(r.totalSessions).toBe(0);
    expect(r.totalMembers).toBe(0);
    expect(r.uniqueAttendeeCount).toBe(0);
    expect(r.overallRate).toBe(0);
    expect(r.uniqueAttendanceRate).toBe(0);
    expect(r.previousPeriodRate).toBeNull();
  });

  it("previousPeriodRate is 0 when the previous window has no sessions/members (L164 false)", async () => {
    // Seed a single session/member only inside the current window so the previous
    // window (immediately before periodFrom) is completely empty -> prevDenom === 0.
    await env.db.exec(
      "INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s_cur', 'Cur', '2026-06-10', 'admin')",
    );
    await env.db.exec(
      "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('mc', 'mc@x.com', 'rc', 'rc', '2026-06-01T00:00:00Z')",
    );
    await env.db.exec("INSERT INTO member_status (member_id, is_deleted) VALUES ('mc', 0)");
    await env.db.exec(
      "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('mc', 's_cur', 'admin')",
    );

    const r = await computeAttendanceOverviewExt(env.ctx, {
      periodFrom: "2026-06-01",
      periodTo: "2026-06-30",
      zone: null,
    });
    // current window has data; previous window (2026-05-02..2026-06-01) is empty.
    expect(r.previousPeriodRate).toBe(0);
  });

  it("list functions return [] when results array is missing (`?? []` fallbacks)", async () => {
    const ctx = stubCtx({ allShape: {} });
    expect(await listSessionAttendanceStatsExt(ctx, NO_FILTER, 50)).toEqual([]);
    expect(await listMemberAttendanceRankingExt(ctx, NO_FILTER, 50)).toEqual([]);
    expect((await listAttendanceTrend(ctx, NO_FILTER)).buckets).toEqual([]);
    // zone distribution maps over results ?? [] (L356) -> all-zero counts.
    const zd = await listZoneDistribution(ctx, NO_FILTER);
    expect(zd.rows.every((row) => row.attendeeCount === 0)).toBe(true);
    expect(await listAttendanceExportRows(ctx, NO_FILTER)).toEqual([]);
  });

  it("getSessionAttendanceDetail member loop tolerates missing results array (L415)", async () => {
    // first() returns a session row (non-null) so we pass the null guard; the
    // member-rows `.all()` returns `{}` -> `?? []` -> no attendees/absentees.
    const ctx = stubCtx({
      firstRow: { session_id: "sx", title: "T", held_on: "2026-01-01" },
      allShape: {},
    });
    const detail = await getSessionAttendanceDetail(ctx, "sx");
    expect(detail).not.toBeNull();
    expect(detail!.attendees).toEqual([]);
    expect(detail!.absentees).toEqual([]);
  });

  it("display_name null coalesces to empty string across functions (`?? \"\"`)", async () => {
    // ranking (L276): one ranking row with null display_name.
    const ranking = await listMemberAttendanceRankingExt(
      stubCtx({
        allShape: {
          results: [
            { member_id: "m1", display_name: null, attended_count: 2, rate: 0.5, last_attended_at: null },
          ],
        },
      }),
      NO_FILTER,
      50,
    );
    expect(ranking[0]!.displayName).toBe("");

    // session detail attendees/absentees (L418): null display_name member rows.
    const detail = await getSessionAttendanceDetail(
      stubCtx({
        firstRow: { session_id: "sx", title: "T", held_on: "2026-01-01" },
        allShape: {
          results: [
            { member_id: "ma", display_name: null, attended_count: 1, attended: 1 },
            { member_id: "mb", display_name: null, attended_count: 0, attended: 0 },
          ],
        },
      }),
      "sx",
    );
    expect(detail!.attendees[0]!.displayName).toBe("");
    expect(detail!.absentees[0]!.displayName).toBe("");

    // absentees (L482): null display_name.
    const absentees = await listAbsentees(
      stubCtx({
        allShape: {
          results: [
            {
              member_id: "mz",
              display_name: null,
              attended_count: 0,
              last_attended_at: null,
              missed_count: 3,
            },
          ],
        },
      }),
      NO_FILTER,
      3,
    );
    expect(absentees.rows[0]!.displayName).toBe("");

    // export rows (L544): null display_name.
    const exportRows = await listAttendanceExportRows(
      stubCtx({
        allShape: {
          results: [
            {
              session_id: "s1",
              title: "T",
              held_on: "2026-01-01",
              member_id: "me",
              display_name: null,
              attended_count: 5,
              attended: 0,
            },
          ],
        },
      }),
      NO_FILTER,
    );
    expect(exportRows[0]!.displayName).toBe("");
    expect(exportRows[0]!.attended).toBe(0);
  });
});
