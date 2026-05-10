import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { PublicFooter } from "../PublicFooter";

afterEach(() => cleanup());

describe("PublicFooter", () => {
  it("プライバシー / 利用規約リンクと copyright をレンダーする", () => {
    const { container } = render(<PublicFooter />);
    expect(
      container.querySelector('[data-component="public-footer"]'),
    ).toBeTruthy();
    const privacy = screen.getByRole("link", {
      name: "プライバシーポリシー",
    });
    expect(privacy.getAttribute("href")).toBe("/privacy");
    const terms = screen.getByRole("link", { name: "利用規約" });
    expect(terms.getAttribute("href")).toBe("/terms");
  });

  it("copyright に現在年と団体名を含む", () => {
    const { container } = render(<PublicFooter />);
    const copyright = container.querySelector('[data-role="copyright"]');
    expect(copyright?.textContent).toContain(String(new Date().getFullYear()));
    expect(copyright?.textContent).toContain("UBM 兵庫支部会");
  });
});
