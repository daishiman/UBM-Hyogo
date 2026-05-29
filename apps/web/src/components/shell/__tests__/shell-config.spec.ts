import { describe, it, expect } from "vitest";
import { buildNavForRole, isNavItemActive } from "../shell-config";

describe("buildNavForRole", () => {
  it("viewer は public グループのみ（3 item）", () => {
    const groups = buildNavForRole("viewer");
    expect(groups.map((g) => g.id)).toEqual(["public"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["home", "directory", "register"]);
  });

  it("member は public + members（合計 4 item）", () => {
    const groups = buildNavForRole("member");
    expect(groups.map((g) => g.id)).toEqual(["public", "members"]);
    const total = groups.flatMap((g) => g.items).length;
    expect(total).toBe(4);
    expect(groups[1].items[0].href).toBe("/profile");
  });

  it("admin は public + members + admin の 3 グループ（合計 13 item）", () => {
    const groups = buildNavForRole("admin");
    expect(groups.map((g) => g.id)).toEqual(["public", "members", "admin"]);
    const hrefs = groups.flatMap((g) => g.items).map((i) => i.href);
    expect(hrefs).toEqual([
      "/",
      "/members",
      "/register",
      "/profile",
      "/admin",
      "/admin/dashboard/attendance",
      "/admin/members",
      "/admin/tags",
      "/admin/schema",
      "/admin/meetings",
      "/admin/requests",
      "/admin/identity-conflicts",
      "/admin/audit",
    ]);
    expect(hrefs).toHaveLength(13);
  });

  it("admin: schemaDiffCount > 0 で schema item に warn badge が付く", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 2 });
    const schema = groups.flatMap((g) => g.items).find((i) => i.id === "schema");
    expect(schema?.badge).toEqual({ tone: "warn", count: 2 });
  });

  it("admin: schemaDiffCount = 0 では badge を付けない", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 0 });
    const schema = groups.flatMap((g) => g.items).find((i) => i.id === "schema");
    expect(schema?.badge).toBeUndefined();
  });
});

describe("isNavItemActive", () => {
  it('"/" は完全一致のみ active', () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/members")).toBe(false);
  });

  it('"/admin" は完全一致のみ active（子 route で active にしない）', () => {
    expect(isNavItemActive("/admin", "/admin")).toBe(true);
    expect(isNavItemActive("/admin", "/admin/members")).toBe(false);
  });

  it("子 route は prefix 一致で active", () => {
    expect(isNavItemActive("/admin/members", "/admin/members")).toBe(true);
    expect(isNavItemActive("/admin/members", "/admin/members/123")).toBe(true);
  });

  it("public /members は admin /admin/members で active にしない", () => {
    expect(isNavItemActive("/members", "/admin/members")).toBe(false);
  });
});
