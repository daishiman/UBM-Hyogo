// Task A — shell-config 純関数の spec。
import { describe, it, expect } from "vitest";

import { buildNavForRole, isNavItemActive } from "../shell-config";

describe("buildNavForRole", () => {
  it("viewer は public グループのみ（3 item）", () => {
    const groups = buildNavForRole("viewer");
    expect(groups.map((g) => g.id)).toEqual(["public"]);
    expect(groups[0]!.items.map((i) => i.id)).toEqual(["home", "directory", "register"]);
  });

  it("member は public + members（profile を含む）", () => {
    const groups = buildNavForRole("member");
    expect(groups.map((g) => g.id)).toEqual(["public", "members"]);
    const members = groups.find((g) => g.id === "members");
    expect(members?.items.map((i) => i.id)).toEqual(["profile"]);
  });

  it("admin は public + members + admin の 3 グループ", () => {
    const groups = buildNavForRole("admin");
    expect(groups.map((g) => g.id)).toEqual(["public", "members", "admin"]);
    const admin = groups.find((g) => g.id === "admin");
    expect(admin?.items).toHaveLength(9);
  });

  it("admin の schema は schemaDiffCount>0 のとき warn badge を持つ", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 3 });
    const schema = groups
      .find((g) => g.id === "admin")
      ?.items.find((i) => i.id === "schema");
    expect(schema?.badge).toEqual({ tone: "warn", count: 3 });
  });

  it("admin の schema は schemaDiffCount=0 のとき badge を持たない", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 0 });
    const schema = groups
      .find((g) => g.id === "admin")
      ?.items.find((i) => i.id === "schema");
    expect(schema?.badge).toBeUndefined();
  });
});

describe("isNavItemActive", () => {
  it('"/" は完全一致のみ active', () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/members")).toBe(false);
  });

  it('"/admin" は完全一致のみ active（配下では false）', () => {
    expect(isNavItemActive("/admin", "/admin")).toBe(true);
    expect(isNavItemActive("/admin", "/admin/members")).toBe(false);
  });

  it("通常 item は完全一致 or 前方一致で active", () => {
    expect(isNavItemActive("/members", "/members")).toBe(true);
    expect(isNavItemActive("/members", "/members/abc")).toBe(true);
    expect(isNavItemActive("/members", "/membersx")).toBe(false);
  });
});
