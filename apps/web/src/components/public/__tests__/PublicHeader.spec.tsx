import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PublicHeader } from "../PublicHeader";
import type { AuthView } from "../../../lib/auth-view/types";

vi.mock("../../../lib/auth-view/getAuthView", () => ({
  getAuthView: vi.fn(async () => ({ kind: "guest" }) as AuthView),
}));

afterEach(() => cleanup());

async function renderHeader(props: Parameters<typeof PublicHeader>[0] = {}) {
  const element = await PublicHeader(props);
  return render(element);
}

describe("PublicHeader", () => {
  it("brand / nav / login CTA をレンダーする（guest デフォルト）", async () => {
    const { container } = await renderHeader({ authView: { kind: "guest" } });
    expect(container.querySelector('[data-component="public-header"]')).toBeTruthy();
    expect(container.querySelector('[data-auth-state="guest"]')).toBeTruthy();
    const brand = screen.getByText("UBM 兵庫支部会");
    expect(brand.getAttribute("href")).toBe("/");
    const auth = screen.getByText("ログイン");
    expect(auth.getAttribute("href")).toBe("/login");
  });

  it("3 件のナビ項目をラベルと href の組で全件レンダーする", async () => {
    await renderHeader({ authView: { kind: "guest" } });
    const nav = screen.getByRole("navigation", { name: "メインナビゲーション" });
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

  it("member kind: data-role=member-cta + sign-out あり / login 不存在", async () => {
    const { container } = await renderHeader({
      authView: { kind: "member", profileHref: "/profile" },
    });
    expect(container.querySelector('[data-auth-state="member"]')).toBeTruthy();
    const memberCta = container.querySelector('[data-role="member-cta"]');
    expect(memberCta?.getAttribute("href")).toBe("/profile");
    expect(container.querySelector('[data-testid="sign-out-button"]')).toBeTruthy();
    expect(container.querySelector('[data-role="auth-cta"]')).toBeNull();
  });

  it("admin kind: member-cta + admin-cta 両方", async () => {
    const { container } = await renderHeader({
      authView: {
        kind: "admin",
        profileHref: "/profile",
        adminHref: "/admin",
      },
    });
    expect(container.querySelector('[data-auth-state="admin"]')).toBeTruthy();
    expect(
      container.querySelector('[data-role="member-cta"]')?.getAttribute("href"),
    ).toBe("/profile");
    expect(
      container.querySelector('[data-role="admin-cta"]')?.getAttribute("href"),
    ).toBe("/admin");
    expect(container.querySelector('[data-testid="sign-out-button"]')).toBeTruthy();
  });

  it("currentPath=/members で aria-current=page 付与", async () => {
    await renderHeader({
      currentPath: "/members",
      authView: { kind: "guest" },
    });
    const link = screen.getByRole("link", { name: "メンバー" });
    expect(link.getAttribute("aria-current")).toBe("page");
  });
});
