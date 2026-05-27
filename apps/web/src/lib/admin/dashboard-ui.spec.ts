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

  it("byZone 配列が valid (新 shape length=3) なとき採用する", () => {
    const validByZone = [
      { key: "0to1", label: "0→1", hint: "立ち上げ", count: 3, total: 11, tone: "info" },
      { key: "1to10", label: "1→10", hint: "拡大", count: 7, total: 11, tone: "accent" },
      { key: "10to100", label: "10→100", hint: "組織化", count: 1, total: 11, tone: "ok" },
    ];
    const ui = toAdminDashboardUi({ ...baseView, byZone: validByZone });
    expect(ui.byZone).toEqual(validByZone);
  });

  it("旧 loose shape ({zone,count}) は undefined に落とす", () => {
    const ui = toAdminDashboardUi({
      ...baseView,
      byZone: [
        { zone: "0→1", count: 3 },
      ],
    });
    expect(ui.byZone).toBeUndefined();
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
