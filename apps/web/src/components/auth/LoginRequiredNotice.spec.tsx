import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { LoginRequiredNotice } from "./LoginRequiredNotice";
import { axe } from "../../test/axe";

afterEach(() => cleanup());

describe("LoginRequiredNotice (C1 / AC-1, AC-2)", () => {
  it("TC-1-1: notice ルート要素を描画する", () => {
    render(<LoginRequiredNotice redirectTo="/members" />);
    expect(screen.getByTestId("login-required-notice")).toBeTruthy();
  });

  it("TC-1-2: 見出し「ログインが必要です」を含む", () => {
    render(<LoginRequiredNotice redirectTo="/members" />);
    expect(screen.getByText("ログインが必要です")).toBeTruthy();
  });

  it("TC-1-3: CTA href は encodeURIComponent された redirect を持つ", () => {
    render(<LoginRequiredNotice redirectTo="/members" />);
    const cta = screen.getByTestId("login-required-notice-cta");
    expect(cta.getAttribute("href")).toBe("/login?redirect=%2Fmembers");
  });

  it("TC-1-4: スペース・スラッシュが encode される", () => {
    render(<LoginRequiredNotice redirectTo="/members/abc def" />);
    const cta = screen.getByTestId("login-required-notice-cta");
    expect(cta.getAttribute("href")).toBe(
      "/login?redirect=%2Fmembers%2Fabc%20def",
    );
  });

  it("TC-1-5: redirectTo 省略時は既定 '/' を encode する", () => {
    render(<LoginRequiredNotice />);
    const cta = screen.getByTestId("login-required-notice-cta");
    expect(cta.getAttribute("href")).toBe("/login?redirect=%2F");
  });

  it("TC-1-6: axe アクセシビリティ違反 0", async () => {
    const { container } = render(<LoginRequiredNotice redirectTo="/members" />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
