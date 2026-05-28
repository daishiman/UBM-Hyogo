import { describe, expect, it } from "vitest";
import { AdminDashboardViewZ } from "../viewmodel";

const baseTotals = {
  totalMembers: 11,
  publicMembers: 10,
  untaggedMembers: 1,
  unresolvedSchema: 0,
};

const baseFields = {
  totals: baseTotals,
  recentActions: [],
  generatedAt: "2026-05-26T00:00:00Z",
};

const validByZone = [
  { key: "0to1", label: "0→1", hint: "立ち上げ", count: 3, total: 11, tone: "info" },
  { key: "1to10", label: "1→10", hint: "拡大", count: 7, total: 11, tone: "accent" },
  { key: "10to100", label: "10→100", hint: "組織化", count: 1, total: 11, tone: "ok" },
];

describe("AdminDashboardViewZ.byZone", () => {
  it("byZone 未提供でも success === true (後方互換)", () => {
    expect(AdminDashboardViewZ.safeParse(baseFields).success).toBe(true);
  });

  it("byZone length=3 + 各 key 一致時 success", () => {
    expect(
      AdminDashboardViewZ.safeParse({ ...baseFields, byZone: validByZone }).success,
    ).toBe(true);
  });

  it("byZone length=2 のとき success === false", () => {
    expect(
      AdminDashboardViewZ.safeParse({
        ...baseFields,
        byZone: validByZone.slice(0, 2),
      }).success,
    ).toBe(false);
  });

  it("tone enum 外 (warn 等) のとき success === false", () => {
    const invalid = [
      { ...validByZone[0], tone: "warn" },
      validByZone[1],
      validByZone[2],
    ];
    expect(
      AdminDashboardViewZ.safeParse({ ...baseFields, byZone: invalid }).success,
    ).toBe(false);
  });
});
