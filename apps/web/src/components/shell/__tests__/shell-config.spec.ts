import { describe, it, expect } from "vitest";
import { buildNavForRole, isNavItemActive } from "../shell-config";

describe("buildNavForRole", () => {
  it("viewer は公開グループのみ（3 item）", () => {
    const groups = buildNavForRole("viewer");
    expect(groups.map((g) => g.id)).toEqual(["public"]);
    expect(groups[0]!.items).toHaveLength(3);
  });

  it("member は公開 + 会員（合計 4 item）", () => {
    const groups = buildNavForRole("member");
    expect(groups.map((g) => g.id)).toEqual(["public", "members"]);
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    expect(total).toBe(4);
  });

  it("admin は 3 グループ全部（合計 13 item）", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 0 });
    expect(groups.map((g) => g.id)).toEqual(["public", "members", "admin"]);
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    expect(total).toBe(13);
  });

  it("admin の schema item に schemaDiffCount badge が乗る（正数）", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 5 });
    const adminGroup = groups.find((g) => g.id === "admin")!;
    const schema = adminGroup.items.find((i) => i.id === "schema")!;
    expect(schema.badge).toEqual({ tone: "warn", count: 5 });
  });

  it("schemaDiffCount=0 でも badge は count:0 で安定（描画側で非表示判定）", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 0 });
    const schema = groups.find((g) => g.id === "admin")!.items.find((i) => i.id === "schema")!;
    expect(schema.badge).toEqual({ tone: "warn", count: 0 });
  });

  it("ctx 未指定の admin は schemaDiffCount=0 として扱う", () => {
    const groups = buildNavForRole("admin");
    const schema = groups.find((g) => g.id === "admin")!.items.find((i) => i.id === "schema")!;
    expect(schema.badge?.count).toBe(0);
  });
});

describe("isNavItemActive", () => {
  it("ルート `/` は完全一致のみ active", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/members")).toBe(false);
  });

  it("`/admin` は完全一致のみ active（配下では非 active）", () => {
    expect(isNavItemActive("/admin", "/admin")).toBe(true);
    expect(isNavItemActive("/admin", "/admin/members")).toBe(false);
  });

  it("一般 href は prefix 一致で active", () => {
    expect(isNavItemActive("/admin/members", "/admin/members")).toBe(true);
    expect(isNavItemActive("/admin/members", "/admin/members/123")).toBe(true);
    expect(isNavItemActive("/admin/members", "/admin/tags")).toBe(false);
  });
});
