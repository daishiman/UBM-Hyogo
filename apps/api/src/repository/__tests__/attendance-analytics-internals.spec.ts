import { describe, it, expect } from "vitest";
import {
  __testInternals,
  clampAnalyticsLimit,
  clampLastN,
} from "../attendance-analytics";

const { zoneFromCount, normalizeZone, sessionPeriodClause } = __testInternals;

describe("attendance-analytics internals", () => {
  it("zoneFromCount: boundaries", () => {
    expect(zoneFromCount(0)).toBe("0→1");
    expect(zoneFromCount(1)).toBe("1→10");
    expect(zoneFromCount(9)).toBe("1→10");
    expect(zoneFromCount(10)).toBe("10→100");
    expect(zoneFromCount(99)).toBe("10→100");
    expect(zoneFromCount(100)).toBe("unknown");
  });

  it("normalizeZone: garbage → unknown", () => {
    expect(normalizeZone(null)).toBe("unknown");
    expect(normalizeZone("0→1")).toBe("0→1");
    expect(normalizeZone("bogus")).toBe("unknown");
  });

  it("sessionPeriodClause: builds clause + binds", () => {
    const r1 = sessionPeriodClause({ periodFrom: null, periodTo: null, zone: null });
    expect(r1.sql).toBe("");
    expect(r1.binds).toEqual([]);

    const r2 = sessionPeriodClause({
      periodFrom: "2026-01-01",
      periodTo: "2026-06-01",
      zone: null,
    });
    expect(r2.sql).toContain("held_on >= ?");
    expect(r2.sql).toContain("held_on < ?");
    expect(r2.binds).toEqual(["2026-01-01", "2026-06-01"]);
  });

  it("clampAnalyticsLimit", () => {
    expect(clampAnalyticsLimit(undefined)).toBe(50);
    expect(clampAnalyticsLimit(0)).toBe(50);
    expect(clampAnalyticsLimit(99999)).toBe(200);
    expect(clampAnalyticsLimit(20)).toBe(20);
  });

  it("clampLastN", () => {
    expect(clampLastN(undefined)).toBe(3);
    expect(clampLastN(-1)).toBe(3);
    expect(clampLastN(99)).toBe(10);
    expect(clampLastN(5)).toBe(5);
  });
});
