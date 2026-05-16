import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";

import { CallToActionCTA } from "../CallToActionCTA";

const HREF = "https://example.test/form";

afterEach(() => cleanup());

describe("CallToActionCTA", () => {
  it("default 見出し・本文・CTA ラベルを表示する", () => {
    render(<CallToActionCTA responderUrl={HREF} />);
    expect(screen.getByText("FOR MEMBERS")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "メンバー情報の掲載をお願いします",
    );
    expect(
      screen.getByText(
        "最新のGoogleフォームから回答するだけで、このページに自動で反映されます。表記の修正は管理者が編集できます。",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "回答フォームを開く" }),
    ).toBeTruthy();
  });

  it("CTA は responderUrl を href に持ち、外部リンク属性が付与される", () => {
    render(<CallToActionCTA responderUrl={HREF} />);
    const link = screen.getByRole("link", { name: "回答フォームを開く" });
    expect(link.getAttribute("href")).toBe(HREF);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("root section に data-component=call-to-action-cta を持ち、ダーク token を参照する", () => {
    const { container } = render(<CallToActionCTA responderUrl={HREF} />);
    const section = container.querySelector(
      'section[data-component="call-to-action-cta"]',
    ) as HTMLElement | null;
    expect(section).not.toBeNull();
    const style = section?.getAttribute("style") ?? "";
    expect(style).toContain("var(--ubm-color-text-primary)");
    expect(style).toContain("var(--ubm-color-surface-panel)");
  });

  it("カスタム heading / body / ctaLabel が反映される", () => {
    render(
      <CallToActionCTA
        responderUrl={HREF}
        eyebrow="E"
        heading="H"
        body="B"
        ctaLabel="L"
      />,
    );
    expect(screen.getByText("E")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("H");
    expect(screen.getByText("B")).toBeTruthy();
    expect(screen.getByRole("link", { name: "L" })).toBeTruthy();
  });

  it("snapshot を保持する", () => {
    const { container } = render(<CallToActionCTA responderUrl={HREF} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("axe による基本 a11y violation がない", async () => {
    const { container } = render(<CallToActionCTA responderUrl={HREF} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
