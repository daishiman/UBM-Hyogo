import { describe, it, expect } from "vitest";
import {
  buildNavForRole,
  isNavItemActive,
  type ShellNavGroup,
} from "../shell-config";

function flatItems(groups: ShellNavGroup[]) {
  return groups.flatMap((g) => g.items);
}

describe("buildNavForRole", () => {
  it("viewer は PUBLIC グループのみ（3 item）", () => {
    const groups = buildNavForRole("viewer");
    expect(groups.map((g) => g.id)).toEqual(["public"]);
    expect(flatItems(groups)).toHaveLength(3);
  });

  it("member は PUBLIC + MEMBERS（4 item）", () => {
    const groups = buildNavForRole("member");
    expect(groups.map((g) => g.id)).toEqual(["public", "members"]);
    expect(flatItems(groups)).toHaveLength(4);
  });

  it("admin は 3 グループ全部（13 item）", () => {
    const groups = buildNavForRole("admin");
    expect(groups.map((g) => g.id)).toEqual(["public", "members", "admin"]);
    expect(flatItems(groups)).toHaveLength(13);
  });

  it("グループラベルは PUBLIC / MEMBERS / ADMIN（大文字）", () => {
    const groups = buildNavForRole("admin");
    expect(groups.map((g) => g.label)).toEqual(["PUBLIC", "MEMBERS", "ADMIN"]);
  });

  it("admin で schemaDiffCount>0 のとき schema item に warn badge が付く", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 3 });
    const schema = flatItems(groups).find((i) => i.id === "schema");
    expect(schema?.badge).toEqual({ tone: "warn", count: 3 });
  });

  it("admin で schemaDiffCount=0 のとき badge は付かない", () => {
    const groups = buildNavForRole("admin", { schemaDiffCount: 0 });
    const schema = flatItems(groups).find((i) => i.id === "schema");
    expect(schema?.badge).toBeUndefined();
  });
});

describe("isNavItemActive", () => {
  it("'/' は完全一致のみ", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/members")).toBe(false);
  });

  it("'/admin'（dashboard）は完全一致のみ（子 path で active にしない）", () => {
    expect(isNavItemActive("/admin", "/admin")).toBe(true);
    expect(isNavItemActive("/admin", "/admin/members")).toBe(false);
  });

  it("通常 item は前方一致（子 path も active）", () => {
    expect(isNavItemActive("/admin/members", "/admin/members")).toBe(true);
    expect(isNavItemActive("/admin/members", "/admin/members/123")).toBe(true);
    expect(isNavItemActive("/members", "/register")).toBe(false);
  });
});
