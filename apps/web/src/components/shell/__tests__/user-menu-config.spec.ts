import { describe, it, expect } from "vitest";
import { buildUserMenuActions } from "../user-menu-config";

describe("buildUserMenuActions", () => {
  it("viewer は login のみ", () => {
    const actions = buildUserMenuActions("viewer");
    expect(actions).toEqual([{ kind: "login", id: "login", label: "ログイン", href: "/login" }]);
  });

  it("member は profile + edit-request + signout（順序込み）", () => {
    const actions = buildUserMenuActions("member");
    expect(actions.map((a) => a.id)).toEqual(["profile", "edit-request", "signout"]);
    expect(actions[1]).toMatchObject({ kind: "link", href: "/profile#edit-request" });
    expect(actions[2]).toMatchObject({ kind: "signout", label: "ログアウト" });
  });

  it("admin は profile + edit-request + admin-dashboard + signout（順序込み）", () => {
    const actions = buildUserMenuActions("admin");
    expect(actions.map((a) => a.id)).toEqual([
      "profile",
      "edit-request",
      "admin-dashboard",
      "signout",
    ]);
    expect(actions[2]).toMatchObject({ kind: "link", href: "/admin" });
  });
});
