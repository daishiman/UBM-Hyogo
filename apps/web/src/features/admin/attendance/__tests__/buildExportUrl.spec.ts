import { describe, it, expect } from "vitest";
import { buildAttendanceExportUrlClient } from "../components/buildExportUrlClient";

describe("buildAttendanceExportUrlClient", () => {
  it("no filters returns plain path", () => {
    expect(
      buildAttendanceExportUrlClient({ periodFrom: null, periodTo: null, zones: [] }),
    ).toBe("/api/admin/dashboard/attendance/export");
  });

  it("includes period + zones", () => {
    const url = buildAttendanceExportUrlClient({
      periodFrom: "2026-01-01",
      periodTo: "2026-06-01",
      zones: ["zone_1_9", "zone_10_99"],
    });
    expect(url).toContain("periodFrom=2026-01-01");
    expect(url).toContain("periodTo=2026-06-01");
    expect(url).toContain("zone=zone_1_9%2Czone_10_99");
  });
});
