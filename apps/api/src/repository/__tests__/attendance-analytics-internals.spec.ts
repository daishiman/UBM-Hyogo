import { describe, it, expect } from "vitest";
import {
  __testInternals,
  clampAnalyticsLimit,
  clampLastN,
} from "../attendance-analytics";

const { zoneFromCount, normalizeZone, sessionPeriodClause } = __testInternals;

describe("attendance-analytics internals", () => {
  it("zoneFromCount: boundaries", () => {
    expect(zoneFromCount(-1)).toBe("unknown");
    expect(zoneFromCount(Number.NaN)).toBe("unknown");
    expect(zoneFromCount(0)).toBe("zone_0");
    expect(zoneFromCount(1)).toBe("zone_1_9");
    expect(zoneFromCount(9)).toBe("zone_1_9");
    expect(zoneFromCount(10)).toBe("zone_10_99");
    expect(zoneFromCount(99)).toBe("zone_10_99");
    expect(zoneFromCount(100)).toBe("zone_100_plus");
  });

  it("normalizeZone: supports new keys and legacy arrow values", () => {
    expect(normalizeZone(null)).toBe("unknown");
    expect(normalizeZone("zone_100_plus")).toBe("zone_100_plus");
    expect(normalizeZone("0→1")).toBe("zone_0");
    expect(normalizeZone("1→10")).toBe("zone_1_9");
    expect(normalizeZone("10→100")).toBe("zone_10_99");
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
