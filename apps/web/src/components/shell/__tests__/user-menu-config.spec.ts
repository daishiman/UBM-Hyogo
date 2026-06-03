// Task B — user-menu-config 純関数の spec。
import { describe, it, expect } from "vitest";

import { buildUserMenuActions, roleDisplayLabel } from "../user-menu-config";

describe("buildUserMenuActions", () => {
  it("viewer は ログイン のみ", () => {
    const actions = buildUserMenuActions("viewer");
    expect(actions).toEqual([
      { kind: "login", id: "login", label: "ログイン", href: "/login" },
    ]);
  });

  it("member は プロフィール / 編集申請 / ログアウト（順序込み）", () => {
    const actions = buildUserMenuActions("member");
    expect(actions.map((a) => a.id)).toEqual(["profile", "edit-request", "signout"]);
  });

  it("admin は member の 3 つ + 管理者ダッシュボードを signout の前に持つ", () => {
    const actions = buildUserMenuActions("admin");
    expect(actions.map((a) => a.id)).toEqual([
      "profile",
      "edit-request",
      "admin-dashboard",
      "signout",
    ]);
  });
});

describe("roleDisplayLabel", () => {
  it("admin=管理者 / member=会員 / viewer=未ログイン", () => {
    expect(roleDisplayLabel("admin")).toBe("管理者");
    expect(roleDisplayLabel("member")).toBe("会員");
    expect(roleDisplayLabel("viewer")).toBe("未ログイン");
  });
});
