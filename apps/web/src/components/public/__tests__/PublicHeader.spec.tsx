import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PublicHeader } from "../PublicHeader";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));

afterEach(() => cleanup());

describe("PublicHeader", () => {
  it("brand / nav / login CTA をレンダーする", async () => {
    const { container } = render(
      await PublicHeader({ authView: { kind: "guest" } }),
    );
    expect(
      container.querySelector('[data-component="public-header"]'),
    ).toBeTruthy();
    expect(screen.getByTestId("public-header").getAttribute("data-auth-state")).toBe(
      "guest",
    );
    const brand = screen.getByText("UBM 兵庫支部会");
    expect(brand.getAttribute("href")).toBe("/");
    const auth = screen.getByText("ログイン");
    expect(auth.getAttribute("href")).toBe("/login");
  });

  it("3 件のナビ項目をラベルと href の組で全件レンダーする", async () => {
    render(await PublicHeader({ authView: { kind: "guest" } }));
    const nav = screen.getByRole("navigation", {
      name: "メインナビゲーション",
    });
    expect(nav).toBeTruthy();
    const expected: Array<[string, string]> = [
      ["ホーム", "/"],
      ["メンバー", "/members"],
      ["登録", "/register"],
    ];
    for (const [label, href] of expected) {
      const link = screen.getByRole("link", { name: label });
      expect(link.getAttribute("href")).toBe(href);
    }
  });

  it("member authView ではマイページとログアウトを表示し login CTA を出さない", async () => {
    render(
      await PublicHeader({
        authView: { kind: "member", profileHref: "/profile" },
      }),
    );

    expect(screen.getByTestId("public-header").getAttribute("data-auth-state")).toBe(
      "member",
    );
    expect(screen.getByRole("link", { name: "マイページ" }).getAttribute("href")).toBe(
      "/profile",
    );
    expect(screen.getByTestId("sign-out-button")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "ログイン" })).toBeNull();
  });

  it("admin authView では管理リンクも表示する", async () => {
    render(
      await PublicHeader({
        authView: { kind: "admin", profileHref: "/profile", adminHref: "/admin" },
      }),
    );

    expect(screen.getByTestId("public-header").getAttribute("data-auth-state")).toBe(
      "admin",
    );
    expect(screen.getByRole("link", { name: "管理" }).getAttribute("href")).toBe(
      "/admin",
    );
  });
});
