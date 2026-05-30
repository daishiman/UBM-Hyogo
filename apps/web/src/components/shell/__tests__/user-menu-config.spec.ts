import { describe, expect, it } from "vitest";
import { buildUserMenuActions } from "../user-menu-config";

describe("buildUserMenuActions", () => {
  it("viewer は login 1 件のみ", () => {
    expect(buildUserMenuActions("viewer")).toEqual([
      { kind: "login", id: "login", label: "ログイン", href: "/login" },
    ]);
  });

  it("member は profile -> edit-request -> signout の 3 件", () => {
    const result = buildUserMenuActions("member");
    expect(result).toHaveLength(3);
    expect(result.map((a) => a.id)).toEqual(["profile", "edit-request", "signout"]);
    expect(result[0]).toEqual({
      kind: "link",
      id: "profile",
      label: "プロフィール",
      href: "/profile",
    });
    expect(result[1]).toEqual({
      kind: "link",
      id: "edit-request",
      label: "プロフィール編集申請",
      href: "/profile#edit-request",
    });
    expect(result[2]).toEqual({ kind: "signout", id: "signout", label: "ログアウト" });
  });

  it("admin は profile -> edit-request -> admin-dashboard -> signout の 4 件", () => {
    const result = buildUserMenuActions("admin");
    expect(result).toHaveLength(4);
    expect(result.map((a) => a.id)).toEqual([
      "profile",
      "edit-request",
      "admin-dashboard",
      "signout",
    ]);
    const dashboard = result[2];
    expect(dashboard).toEqual({
      kind: "link",
      id: "admin-dashboard",
      label: "管理者ダッシュボード",
      href: "/admin",
    });
  });

  it("戻り値順序 snapshot（deep-equal）", () => {
    expect({
      viewer: buildUserMenuActions("viewer"),
      member: buildUserMenuActions("member"),
      admin: buildUserMenuActions("admin"),
    }).toMatchSnapshot();
  });
});
