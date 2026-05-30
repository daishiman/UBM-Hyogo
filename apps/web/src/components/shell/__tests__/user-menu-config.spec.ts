import { describe, it, expect } from "vitest";
import { buildUserMenuActions, roleDisplayLabel } from "../user-menu-config";

describe("buildUserMenuActions", () => {
  it("viewer はログインのみ", () => {
    const actions = buildUserMenuActions("viewer");
    expect(actions).toEqual([
      { kind: "login", id: "login", label: "ログイン", href: "/login" },
    ]);
  });

  it("member はプロフィール / 編集申請 / ログアウト（順序込み）", () => {
    const actions = buildUserMenuActions("member");
    expect(actions.map((a) => a.id)).toEqual(["profile", "edit-request", "signout"]);
    expect(actions.map((a) => a.label)).toEqual([
      "プロフィール",
      "プロフィール編集申請",
      "ログアウト",
    ]);
  });

  it("admin は member の 3 つに加えて管理者ダッシュボードを含む（4 つ・順序込み）", () => {
    const actions = buildUserMenuActions("admin");
    expect(actions.map((a) => a.id)).toEqual([
      "profile",
      "edit-request",
      "admin-dashboard",
      "signout",
    ]);
    const dashboard = actions.find((a) => a.id === "admin-dashboard");
    expect(dashboard).toMatchObject({ kind: "link", label: "管理者ダッシュボード", href: "/admin" });
  });
});

describe("roleDisplayLabel", () => {
  it("admin=管理者 / member=会員 / viewer=null", () => {
    expect(roleDisplayLabel("admin")).toBe("管理者");
    expect(roleDisplayLabel("member")).toBe("会員");
    expect(roleDisplayLabel("viewer")).toBeNull();
  });
});
