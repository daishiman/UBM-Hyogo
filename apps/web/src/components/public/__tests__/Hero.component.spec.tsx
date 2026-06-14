import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { Hero } from "../Hero";

afterEach(() => cleanup());

describe("Hero", () => {
  it("renders title, subtitle and both CTAs (happy)", () => {
    render(
      <Hero
        title="UBM 兵庫支部会"
        subtitle="ようこそ"
        primaryCta={{ label: "参加する", href: "/join" }}
        secondaryCta={{ label: "詳細", href: "/about" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "UBM 兵庫支部会",
    );
    expect(screen.getByText("ようこそ")).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]?.getAttribute("href")).toBe("/join");
    expect(links[0]?.getAttribute("data-variant")).toBe("primary");
    expect(links[1]?.getAttribute("href")).toBe("/about");
    expect(links[1]?.getAttribute("data-variant")).toBe("secondary");
  });

  it("renders card variant by default with accent + serif title (card)", () => {
    const { container } = render(
      <Hero
        eyebrow="兵庫支部会サイト"
        title="兵庫で、事業を育てる人のつながりを可視化する。"
      />,
    );
    const root = container.querySelector('[data-component="hero"]');
    expect(root?.getAttribute("data-variant")).toBe("card");
    expect(container.querySelector('[data-role="accent"]')).toBeTruthy();
    expect(
      container.querySelector('[data-role="title-serif"]')?.textContent,
    ).toBe("兵庫で、事業を育てる人のつながりを可視化する。");
    expect(container.querySelector('[data-role="eyebrow"]')?.textContent).toBe(
      "兵庫支部会サイト",
    );
  });

  it("omits subtitle and CTAs when not provided (empty)", () => {
    const { container } = render(<Hero title="タイトルのみ" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "タイトルのみ",
    );
    expect(container.querySelectorAll('[data-role="cta"] a')).toHaveLength(0);
  });

  it("renders only primary CTA when secondary is missing (variant)", () => {
    render(<Hero title="t" primaryCta={{ label: "参加", href: "/join" }} />);
    const primary = screen.getAllByRole("link");
    expect(primary).toHaveLength(1);
    expect(primary[0]?.getAttribute("data-variant")).toBe("primary");
  });

  it("renders panel variant when explicitly requested (panel)", () => {
    const { container } = render(<Hero variant="panel" title="t" />);
    const root = container.querySelector('[data-component="hero"]');
    expect(root?.getAttribute("data-variant")).toBe("panel");
    expect(container.querySelector('[data-role="accent"]')).toBeNull();
  });
});
