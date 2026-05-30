import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PublicHeader } from "../PublicHeader";

afterEach(() => cleanup());

async function renderHeader(props?: Parameters<typeof PublicHeader>[0]) {
  return render(await PublicHeader(props));
}

describe("PublicHeader", () => {
  it("brand / nav / login CTA をレンダーする", async () => {
    const { container } = await renderHeader({ authView: { kind: "guest" } });
    expect(
      container.querySelector('[data-component="public-header"]'),
    ).toBeTruthy();
    expect(
      container
        .querySelector('[data-component="public-header"]')
        ?.getAttribute("data-auth-state"),
    ).toBe("guest");
    const brand = screen.getByText("UBM 兵庫支部会");
    expect(brand.getAttribute("href")).toBe("/");
    const auth = screen.getByText("ログイン");
    expect(auth.getAttribute("href")).toBe("/login");
  });

  it("guest authView では member/admin CTA を表示しない", async () => {
    const { container } = await renderHeader({ authView: { kind: "guest" } });
    expect(container.querySelectorAll('[data-role="auth-cta"]')).toHaveLength(1);
    expect(container.querySelector('[data-role="member-cta"]')).toBeNull();
    expect(container.querySelector('[data-role="admin-cta"]')).toBeNull();
  });

  it("3 件のナビ項目をラベルと href の組で全件レンダーする", async () => {
    await renderHeader({ authView: { kind: "guest" } });
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

  it("member authView ではマイページとログアウトを表示する", async () => {
    const { container } = await renderHeader({
      authView: { kind: "member", profileHref: "/profile" },
    });
    expect(
      container
        .querySelector('[data-component="public-header"]')
        ?.getAttribute("data-auth-state"),
    ).toBe("member");
    expect(screen.getByRole("link", { name: "マイページ" }).getAttribute("href")).toBe(
      "/profile",
    );
    expect(
      container
        .querySelector('[data-role="member-cta"]')
        ?.getAttribute("href"),
    ).toBe("/profile");
    expect(screen.queryByRole("link", { name: "ログイン" })).toBeNull();
    expect(screen.getByRole("button", { name: "ログアウト" })).toBeTruthy();
  });

  it("admin authView では管理画面リンクも表示する", async () => {
    const { container } = await renderHeader({
      authView: {
        kind: "admin",
        profileHref: "/profile",
        adminHref: "/admin",
      },
    });
    expect(
      container
        .querySelector('[data-component="public-header"]')
        ?.getAttribute("data-auth-state"),
    ).toBe("admin");
    expect(screen.getByRole("link", { name: "管理画面" }).getAttribute("href")).toBe(
      "/admin",
    );
    expect(
      container
        .querySelector('[data-role="admin-cta"]')
        ?.getAttribute("href"),
    ).toBe("/admin");
    expect(screen.queryByRole("link", { name: "ログイン" })).toBeNull();
  });

  it("admin authView でも member CTA を維持する", async () => {
    const { container } = await renderHeader({
      authView: {
        kind: "admin",
        profileHref: "/profile",
        adminHref: "/admin",
      },
    });
    expect(
      container
        .querySelector('[data-role="member-cta"]')
        ?.getAttribute("href"),
    ).toBe("/profile");
  });

  it("currentPath に対応する nav link へ aria-current を付与する", async () => {
    await renderHeader({
      currentPath: "/members/abc",
      authView: { kind: "guest" },
    });
    expect(
      screen.getByRole("link", { name: "メンバー" }).getAttribute("aria-current"),
    ).toBe("page");
  });

  it("data-auth-state は AuthView kind の literal のみ", async () => {
    const states = [
      { authView: { kind: "guest" } as const, expected: "guest" },
      {
        authView: { kind: "member", profileHref: "/profile" } as const,
        expected: "member",
      },
      {
        authView: {
          kind: "admin",
          profileHref: "/profile",
          adminHref: "/admin",
        } as const,
        expected: "admin",
      },
    ];

    for (const { authView, expected } of states) {
      cleanup();
      const { container } = await renderHeader({ authView });
      expect(
        container
          .querySelector('[data-component="public-header"]')
          ?.getAttribute("data-auth-state"),
      ).toBe(expected);
    }
  });
});
