import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PublicHeader } from "../PublicHeader";

afterEach(() => cleanup());

describe("PublicHeader", () => {
  it("brand / nav / login CTA をレンダーする", async () => {
    const { container } = render(await PublicHeader({ authView: { kind: "guest" } }));
    expect(
      container.querySelector('[data-component="public-header"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-component="public-header"]')?.getAttribute("data-auth-state"),
    ).toBe("guest");
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

  it("member auth view renders member CTA and sign-out without login CTA", async () => {
    const { container } = render(
      await PublicHeader({ authView: { kind: "member", profileHref: "/profile" } }),
    );
    expect(container.querySelector('[data-component="public-header"]')?.getAttribute("data-auth-state")).toBe(
      "member",
    );
    expect(container.querySelector('[data-role="member-cta"]')?.getAttribute("href")).toBe("/profile");
    expect(container.querySelector('[data-role="auth-cta"]')).toBeNull();
    expect(screen.getByTestId("sign-out-button")).toBeTruthy();
  });

  it("admin auth view renders member and admin CTAs", async () => {
    const { container } = render(
      await PublicHeader({
        authView: { kind: "admin", profileHref: "/profile", adminHref: "/admin" },
      }),
    );
    expect(container.querySelector('[data-component="public-header"]')?.getAttribute("data-auth-state")).toBe(
      "admin",
    );
    expect(container.querySelector('[data-role="member-cta"]')?.getAttribute("href")).toBe("/profile");
    expect(container.querySelector('[data-role="admin-cta"]')?.getAttribute("href")).toBe("/admin");
  });
});
