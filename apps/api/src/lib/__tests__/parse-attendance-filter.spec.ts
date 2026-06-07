import { describe, it, expect } from "vitest";
import {
  parseAttendanceFilter,
  parseIsoDateOrNull,
  parseZones,
  clampIntQuery,
} from "../parse-attendance-filter";

describe("parse-attendance-filter", () => {
  it("parseIsoDateOrNull accepts YYYY-MM-DD only", () => {
    expect(parseIsoDateOrNull("2026-05-26")).toBe("2026-05-26");
    expect(parseIsoDateOrNull("2026-5-26")).toBeNull();
    expect(parseIsoDateOrNull("garbage")).toBeNull();
    expect(parseIsoDateOrNull("")).toBeNull();
    expect(parseIsoDateOrNull(undefined)).toBeNull();
  });

  it("parseZones filters unknown, dedupes, and accepts legacy arrow values", () => {
    expect(parseZones("zone_0,zone_1_9,zone_10_99,zone_100_plus,bogus")).toEqual([
      "zone_0",
      "zone_1_9",
      "zone_10_99",
      "zone_100_plus",
    ]);
    expect(parseZones("0→1,1→10,10→100")).toEqual([
      "zone_0",
      "zone_1_9",
      "zone_10_99",
    ]);
    expect(parseZones("zone_0,0→1")).toEqual(["zone_0"]);
    expect(parseZones("bogus")).toBeNull();
    expect(parseZones(undefined)).toBeNull();
  });

  it("parseAttendanceFilter combines all", () => {
    const f = parseAttendanceFilter({
      periodFrom: "2026-01-01",
      periodTo: "2026-06-01",
      zone: "zone_1_9",
    });
    expect(f).toEqual({
      periodFrom: "2026-01-01",
      periodTo: "2026-06-01",
      zone: ["zone_1_9"],
    });
  });

  it("clampIntQuery: invalid → default, bounds enforced", () => {
    expect(clampIntQuery(undefined, 50, 1, 200)).toBe(50);
    expect(clampIntQuery("abc", 50, 1, 200)).toBe(50);
    expect(clampIntQuery("99999", 50, 1, 200)).toBe(200);
    expect(clampIntQuery("0", 50, 1, 200)).toBe(1);
    expect(clampIntQuery("42.7", 50, 1, 200)).toBe(42);
  });
});
