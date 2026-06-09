import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AttendanceAbsenteeAlert } from "../components/AttendanceAbsenteeAlert";

afterEach(() => cleanup());

const filter = { periodFrom: null, periodTo: null, zoneFilter: null };

describe("AttendanceAbsenteeAlert", () => {
  it("marks zero follow-up state as none", () => {
    render(<AttendanceAbsenteeAlert data={{ lastN: 3, rows: [], filter }} />);
    expect(screen.getByTestId("attendance-absentee-empty").getAttribute("data-attendance-follow")).toBe("none");
  });

  it("marks non-zero follow-up state as warning", () => {
    render(
      <AttendanceAbsenteeAlert
        data={{
          lastN: 3,
          filter,
          rows: [
            {
              memberId: "m1",
              displayName: "山田 太郎",
              zone: "zone_0",
              missedCount: 3,
              lastAttendedAt: null,
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId("attendance-absentee-alert").getAttribute("data-attendance-follow")).toBe("warn");
    expect(screen.getByText("1 名")).toBeTruthy();
  });
});
