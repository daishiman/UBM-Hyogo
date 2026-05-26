import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PublicHeader } from "../PublicHeader";

afterEach(() => cleanup());

describe("PublicHeader", () => {
  it("brand / nav / login CTA をレンダーする", () => {
    const { container } = render(<PublicHeader />);
    expect(
      container.querySelector('[data-component="public-header"]'),
    ).toBeTruthy();
    const brand = screen.getByText("UBM 兵庫支部会");
    expect(brand.getAttribute("href")).toBe("/");
    const auth = screen.getByText("ログイン");
    expect(auth.getAttribute("href")).toBe("/login");
  });

  it("3 件のナビ項目をラベルと href の組で全件レンダーする", () => {
    render(<PublicHeader />);
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

  it("未ログイン時はマイページリンクを表示しない", () => {
    const { container } = render(<PublicHeader />);
    expect(screen.queryByRole("link", { name: "マイページ" })).toBeNull();
    const cta = container.querySelector('[data-role="auth-cta"]');
    expect(cta?.getAttribute("data-state")).toBe("anonymous");
    expect(cta?.getAttribute("href")).toBe("/login");
  });

  it("ログイン中は auth-cta が /profile になる", () => {
    const { container } = render(
      <PublicHeader currentUser={{ memberId: "mem-1", name: "山田 太郎" }} />,
    );
    const cta = container.querySelector('[data-role="auth-cta"]');
    expect(cta?.getAttribute("data-state")).toBe("authenticated");
    expect(cta?.getAttribute("href")).toBe("/profile");
    expect(screen.queryByRole("link", { name: "ログイン" })).toBeNull();
  });

  it("ログイン中で currentPath=/profile のときマイページ CTA が aria-current=page", () => {
    const { container } = render(
      <PublicHeader
        currentPath="/profile"
        currentUser={{ memberId: "mem-1" }}
      />,
    );
    const cta = container.querySelector('[data-role="auth-cta"]');
    expect(cta?.getAttribute("aria-current")).toBe("page");
  });
});
