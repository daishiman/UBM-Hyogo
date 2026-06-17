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
  it("renders primary rate with supporting metrics", () => {
    render(<KpiPanel overview={baseOverview} attendeeCount={120} />);
    expect(screen.getByTestId("attendance-kpi-rate").textContent).toContain("42.0%");
    expect(screen.getByTestId("attendance-kpi-rate").textContent).toContain("一度でも参加した人の割合 60.0%");
    expect(screen.getByTestId("attendance-kpi-rate").textContent).toContain("30 / 50");
    expect(screen.getByTestId("attendance-kpi-attendees").textContent).toContain("120");
    expect(screen.getByTestId("attendance-kpi-attendees").textContent).toContain("期間内の出席のべ人数");
    expect(screen.getByTestId("attendance-kpi-avg").textContent).toContain("12.0");
    expect(screen.getByTestId("attendance-kpi-avg").textContent).toContain("1回の開催あたり");
    expect(screen.getByTestId("attendance-kpi-sessions").textContent).toContain("10");
    expect(screen.getByTestId("attendance-kpi-sessions").textContent).toContain("開催回数");
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
