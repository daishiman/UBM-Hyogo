// task-15: admin-dashboard-ui mapper の unit test
import { describe, it, expect } from "vitest";
import { toAdminDashboardUi } from "./admin-dashboard-ui";

const baseView = {
  totals: {
    totalMembers: 100,
    publicMembers: 50,
    untaggedMembers: 5,
    unresolvedSchema: 0,
  },
  recentActions: [],
  generatedAt: "2026-05-10T00:00:00.000Z",
};

describe("toAdminDashboardUi", () => {
  it("byZone / byStatus が無いとき undefined を返す", () => {
    const ui = toAdminDashboardUi(baseView);
    expect(ui.byZone).toBeUndefined();
    expect(ui.byStatus).toBeUndefined();
    expect(ui.totals.totalMembers).toBe(100);
  });

  it("byZone 配列が valid なとき採用する", () => {
    const ui = toAdminDashboardUi({
      ...baseView,
      byZone: [
        { zone: "zone_0_1", count: 10 },
        { zone: "zone_0_2", count: 5 },
      ],
    });
    expect(ui.byZone).toEqual([
      { zone: "zone_0_1", count: 10 },
      { zone: "zone_0_2", count: 5 },
    ]);
  });

  it("byStatus に未許可 status が混じっても drop する", () => {
    const ui = toAdminDashboardUi({
      ...baseView,
      byStatus: [
        { status: "public", count: 30 },
        { status: "invalid", count: 10 },
        { status: "hidden", count: 5 },
      ],
    });
    expect(ui.byStatus).toEqual([
      { status: "public", count: 30 },
      { status: "hidden", count: 5 },
    ]);
  });

  it("型不正は undefined", () => {
    const ui = toAdminDashboardUi({ ...baseView, byZone: "not-an-array" as unknown });
    expect(ui.byZone).toBeUndefined();
  });
});
