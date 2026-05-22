import { describe, expect, it } from "vitest";
import { hourlyCounts, offHoursRatio, trimmedP95 } from "../baseline.ts";
import type { AuditLogEvent } from "../types.ts";

describe("baseline helpers", () => {
  it("trimmedP95 of empty is 0", () => {
    expect(trimmedP95([])).toBe(0);
  });

  it("trimmedP95 of constant array equals constant", () => {
    expect(trimmedP95([2, 2, 2, 2, 2])).toBe(2);
  });

  it("trimmedP95 ignores top/bottom 5%", () => {
    const arr = Array.from({ length: 100 }, (_, i) => i + 1);
    const v = trimmedP95(arr);
    expect(v).toBeGreaterThanOrEqual(80);
    expect(v).toBeLessThanOrEqual(99);
  });

  it("hourlyCounts buckets by hour and result", () => {
    const e: AuditLogEvent[] = [
      mk("2026-05-06T00:10:00Z", "success"),
      mk("2026-05-06T00:50:00Z", "success"),
      mk("2026-05-06T01:00:00Z", "success"),
      mk("2026-05-06T00:20:00Z", "failure"),
    ];
    expect(hourlyCounts(e, "success").sort()).toEqual([1, 2]);
    expect(hourlyCounts(e, "failure")).toEqual([1]);
  });

  it("offHoursRatio counts JST <9 / >=22", () => {
    const e: AuditLogEvent[] = [
      mk("2026-05-06T00:00:00Z", "success"), // JST 09 → in
      mk("2026-05-06T13:00:00Z", "success"), // JST 22 → off
      mk("2026-05-06T18:00:00Z", "success"), // JST 03 → off
    ];
    expect(offHoursRatio(e)).toBeCloseTo(2 / 3, 3);
  });
});

function mk(when: string, result: "success" | "failure"): AuditLogEvent {
  return {
    id: when,
    when,
    actor: { email: "x@y" },
    action: { type: "t", result, ...(result === "failure" ? { result_code: 403 } : {}) },
  };
}
