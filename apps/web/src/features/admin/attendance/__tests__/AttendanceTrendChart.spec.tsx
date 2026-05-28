import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AttendanceTrend } from "@ubm-hyogo/shared";
import { AttendanceTrendChart } from "../components/AttendanceTrendChart";

afterEach(() => cleanup());

describe("AttendanceTrendChart", () => {
  it("renders empty placeholder when no buckets", () => {
    const trend: AttendanceTrend = {
      granularity: "month",
      buckets: [],
      filter: { periodFrom: null, periodTo: null, zoneFilter: null },
    };
    render(<AttendanceTrendChart trend={trend} />);
    expect(screen.getByTestId("attendance-trend-empty")).toBeTruthy();
  });

  it("renders polyline with buckets", () => {
    const trend: AttendanceTrend = {
      granularity: "month",
      buckets: [
        { period: "2026-01", attendeeCount: 10, sessionCount: 1, uniqueMemberCount: 10 },
        { period: "2026-02", attendeeCount: 25, sessionCount: 2, uniqueMemberCount: 22 },
        { period: "2026-03", attendeeCount: 18, sessionCount: 2, uniqueMemberCount: 15 },
      ],
      filter: { periodFrom: null, periodTo: null, zoneFilter: null },
    };
    const { container } = render(<AttendanceTrendChart trend={trend} />);
    expect(screen.getByTestId("attendance-trend-chart")).toBeTruthy();
    expect(container.querySelector("polyline")).toBeTruthy();
    expect(container.querySelectorAll("circle").length).toBe(3);
  });
});
