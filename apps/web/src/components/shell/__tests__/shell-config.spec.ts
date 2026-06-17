// Task A — shell-config 純関数の spec。
import { describe, it, expect } from "vitest";

import { FORM_RESPONSES_EDIT_URL } from "../../../lib/constants/form";
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
    expect(admin?.items).toHaveLength(11);
    expect(admin?.items.map((i) => i.id)).not.toContain("tag-catalog");
    expect(admin?.items.map((i) => i.id)).toContain("tag-master");
  });

  it("admin は tag definition と tag queue を別 nav として持つ", () => {
    const admin = buildNavForRole("admin").find((g) => g.id === "admin");
    expect(admin?.items.find((i) => i.id === "tag-master")).toMatchObject({
      href: "/admin/tag-master",
      label: "タグ定義",
    });
    expect(admin?.items.find((i) => i.id === "tag-queue")).toMatchObject({
      href: "/admin/tags",
      label: "タグ割当",
    });
  });

  it("admin は tag master と tag queue を sibling route として持つ", () => {
    const admin = buildNavForRole("admin").find((g) => g.id === "admin");
    expect(admin?.items.find((i) => i.id === "tag-master")).toMatchObject({
      href: "/admin/tag-master",
      label: "タグ定義",
    });
    expect(admin?.items.find((i) => i.id === "tag-queue")).toMatchObject({
      href: "/admin/tags",
      label: "タグ割当",
    });
  });

  it("admin の meeting nav は開催・出席管理ラベルで id/href/icon は不変", () => {
    const admin = buildNavForRole("admin").find((g) => g.id === "admin");
    expect(admin?.items.find((i) => i.id === "meeting")).toMatchObject({
      href: "/admin/meetings",
      label: "開催・出席管理",
      icon: "meeting",
    });
  });

  it("admin の identity nav は会員の重複確認ラベルで id/href/icon は不変", () => {
    const admin = buildNavForRole("admin").find((g) => g.id === "admin");
    expect(admin?.items.find((i) => i.id === "identity")).toMatchObject({
      href: "/admin/identity-conflicts",
      label: "会員の重複確認",
      icon: "identity",
    });
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

  it("admin は Google Form 回答 external link を持つ", () => {
    const groups = buildNavForRole("admin");
    const item = groups
      .find((g) => g.id === "admin")
      ?.items.find((i) => i.id === "form-responses");
    expect(item).toMatchObject({
      href: FORM_RESPONSES_EDIT_URL,
      external: true,
      label: "Form回答",
    });
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

  it("/admin/tags/catalog ではタグキュー nav を active にしない", () => {
    expect(isNavItemActive("/admin/tags", "/admin/tags/catalog")).toBe(false);
  });

  it("tag master は tag queue nav を active にしない", () => {
    expect(isNavItemActive("/admin/tags", "/admin/tag-master")).toBe(false);
    expect(isNavItemActive("/admin/tag-master", "/admin/tag-master")).toBe(true);
  });
});
