import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AttendanceOverviewExt } from "@ubm-hyogo/shared";
import { KpiPanel } from "../components/KpiPanel";

afterEach(() => cleanup());

const baseOverview: AttendanceOverviewExt = {
  totalSessions: 10,
  totalMembers: 50,
  overallRate: 0.42,
  uniqueAttendeeCount: 30,
  uniqueAttendanceRate: 0.6,
  previousPeriodRate: 0.35,
  filter: { periodFrom: null, periodTo: null, zoneFilter: null },
};

describe("KpiPanel", () => {
  it("renders KPI cards with rate, gross attendee count, unique count, avg, sessions", () => {
    render(<KpiPanel overview={baseOverview} attendeeCount={120} />);
    expect(screen.getByTestId("attendance-kpi-rate").textContent).toContain("42.0%");
    expect(screen.getByTestId("attendance-kpi-attendees").textContent).toContain("120");
    expect(screen.getByTestId("attendance-kpi-attendees").textContent).toContain("期間内延べ出席数");
    expect(screen.getByTestId("attendance-kpi-unique").textContent).toContain("30");
    expect(screen.getByTestId("attendance-kpi-unique").textContent).toContain("60.0%");
    expect(screen.getByTestId("attendance-kpi-avg").textContent).toContain("12.0");
    expect(screen.getByTestId("attendance-kpi-sessions").textContent).toContain("10");
  });

  it("shows '—' delta when previousPeriodRate is null", () => {
    render(
      <KpiPanel
        overview={{ ...baseOverview, previousPeriodRate: null }}
        attendeeCount={0}
      />,
    );
    expect(screen.getByTestId("attendance-kpi-rate").textContent).toContain("—");
  });

  it("handles zero sessions without division by zero", () => {
    render(
      <KpiPanel
        overview={{ ...baseOverview, totalSessions: 0 }}
        attendeeCount={0}
      />,
    );
    expect(screen.getByTestId("attendance-kpi-avg").textContent).toContain("0");
  });
});
