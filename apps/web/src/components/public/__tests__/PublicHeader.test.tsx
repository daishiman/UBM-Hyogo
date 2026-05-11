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
});
