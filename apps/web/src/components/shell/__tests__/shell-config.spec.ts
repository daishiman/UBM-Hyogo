import { describe, expect, it } from "vitest";
import { buildNavForRole, isNavItemActive } from "../shell-config";

describe("buildNavForRole", () => {
  it("viewer returns only public group with 3 items", () => {
    const groups = buildNavForRole("viewer");
    expect(groups.map((g) => g.id)).toEqual(["public"]);
    expect(groups[0]!.items).toHaveLength(3);
  });

  it("member returns public + members groups", () => {
    const groups = buildNavForRole("member");
    expect(groups.map((g) => g.id)).toEqual(["public", "members"]);
    expect(groups[1]!.items.map((i) => i.id)).toEqual(["profile"]);
  });

  it("admin returns 3 groups with 3+1+9 items", () => {
    const groups = buildNavForRole("admin");
    expect(groups.map((g) => g.id)).toEqual(["public", "members", "admin"]);
    const total = groups.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(13);
  });

  it("schemaDiffCount=0 hides schema badge", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 0 });
    const schema = groups[2]!.items.find((i) => i.id === "schema");
    expect(schema?.badge).toBeUndefined();
  });

  it("schemaDiffCount>0 attaches warn badge with count", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 5 });
    const schema = groups[2]!.items.find((i) => i.id === "schema");
    expect(schema?.badge).toEqual({ tone: "warn", count: 5 });
  });

  it("admin nav snapshot stable across schemaDiffCount=0/2 (only badge differs)", () => {
    const zero = buildNavForRole("admin", { schemaDiffCount: 0 });
    const two = buildNavForRole("admin", { schemaDiffCount: 2 });
    expect(zero.map((g) => g.items.map((i) => i.id))).toEqual(
      two.map((g) => g.items.map((i) => i.id)),
    );
  });
});

describe("isNavItemActive", () => {
  it("/ matches only exact root", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/members")).toBe(false);
  });

  it("/admin matches only exact /admin", () => {
    expect(isNavItemActive("/admin", "/admin")).toBe(true);
    expect(isNavItemActive("/admin", "/admin/members")).toBe(false);
  });

  it("nested href matches subpaths", () => {
    expect(isNavItemActive("/admin/members", "/admin/members")).toBe(true);
    expect(isNavItemActive("/admin/members", "/admin/members/123")).toBe(true);
    expect(isNavItemActive("/admin/members", "/admin/tags")).toBe(false);
  });
});
