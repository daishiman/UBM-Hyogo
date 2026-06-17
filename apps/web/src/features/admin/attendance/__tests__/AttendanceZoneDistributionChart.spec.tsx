import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AttendanceZoneDistribution } from "@ubm-hyogo/shared";
import { AttendanceZoneDistributionChart } from "../components/AttendanceZoneDistributionChart";

afterEach(() => cleanup());

describe("AttendanceZoneDistributionChart", () => {
  it("renders the attendance count band legend and labels", () => {
    const data: AttendanceZoneDistribution = {
      rows: [
        { zone: "zone_0", attendeeCount: 2, rate: 0 },
        { zone: "zone_1_9", attendeeCount: 8, rate: 0.4 },
      ],
      filter: { periodFrom: null, periodTo: null, zoneFilter: null },
    };

    render(<AttendanceZoneDistributionChart data={data} />);

    expect(screen.getByRole("group", { name: "出席回数べつの人数" })).toBeTruthy();
    expect(screen.getByText(/各メンバーがこれまでに参加した合計回数/)).toBeTruthy();
    expect(screen.getByText("0 回（未出席）")).toBeTruthy();
    expect(screen.getByText("1〜9 回")).toBeTruthy();
  });

  it("allows a zero-width bar for zero percent rows", () => {
    const data: AttendanceZoneDistribution = {
      rows: [{ zone: "zone_0", attendeeCount: 0, rate: 0 }],
      filter: { periodFrom: null, periodTo: null, zoneFilter: null },
    };

    const { container } = render(<AttendanceZoneDistributionChart data={data} />);
    const foregroundBar = container.querySelectorAll(".attendance-zone-bar rect")[1];

    expect(foregroundBar?.getAttribute("width")).toBe("0");
  });
});
