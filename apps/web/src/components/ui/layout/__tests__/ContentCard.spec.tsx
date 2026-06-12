import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => cleanup());

import { ContentCard } from "../ContentCard";

describe("ContentCard", () => {
  // TC-4-25 / TC-6-2
  it("href なしで article として描画する", () => {
    const { container } = render(<ContentCard>body</ContentCard>);
    const el = container.querySelector(".ui-content-card");
    expect(el?.tagName).toBe("ARTICLE");
    expect(el?.getAttribute("data-component")).toBe("content-card");
    expect(el?.className).toContain("ui-content-card");
    expect(screen.queryByRole("link")).toBeNull();
  });

  // TC-4-26
  it("href ありで anchor として描画する", () => {
    render(<ContentCard href="/members/abc">body</ContentCard>);
    const link = screen.getByRole("link");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")?.endsWith("/members/abc")).toBe(true);
  });

  // TC-4-27
  it("href + interactive で data-interactive=true", () => {
    render(
      <ContentCard href="/x" interactive>
        body
      </ContentCard>,
    );
    expect(screen.getByRole("link").getAttribute("data-interactive")).toBe("true");
  });

  // TC-4-28 / TC-6-3
  it("href のみ（interactive 未指定）で data-interactive が付かない", () => {
    render(<ContentCard href="/x">body</ContentCard>);
    expect(screen.getByRole("link").getAttribute("data-interactive")).toBeNull();
  });

  // TC-4-29
  it("heading を描画する", () => {
    const { container } = render(<ContentCard heading="氏名">body</ContentCard>);
    expect(container.querySelector(".ui-content-card__heading")?.textContent).toBe("氏名");
  });

  // TC-4-30
  it("media slot を描画する", () => {
    const { container } = render(<ContentCard media={<span data-testid="m" />}>body</ContentCard>);
    const media = container.querySelector(".ui-content-card__media");
    expect(media?.querySelector("[data-testid=m]")).toBeTruthy();
  });

  // TC-4-31
  it("footer slot を描画する", () => {
    const { container } = render(<ContentCard footer={<span>meta</span>}>body</ContentCard>);
    expect(container.querySelector(".ui-content-card__footer")?.textContent).toBe("meta");
  });

  // TC-4-32
  it("tone=subtle を反映する", () => {
    const { container } = render(<ContentCard tone="subtle">b</ContentCard>);
    expect(container.querySelector(".ui-content-card")?.getAttribute("data-tone")).toBe("subtle");
  });

  // TC-4-33
  it("padding=sm を反映する", () => {
    const { container } = render(<ContentCard padding="sm">b</ContentCard>);
    expect(container.querySelector(".ui-content-card")?.getAttribute("data-padding")).toBe("sm");
  });

  // TC-4-34 / TC-6-1
  it("既定で tone=default / padding=md", () => {
    const { container } = render(<ContentCard>b</ContentCard>);
    const el = container.querySelector(".ui-content-card");
    expect(el?.getAttribute("data-tone")).toBe("default");
    expect(el?.getAttribute("data-padding")).toBe("md");
  });

  // TC-6-10（条件描画の回帰）
  it("media / heading / footer 全て未指定で body のみ存在する", () => {
    const { container } = render(<ContentCard>b</ContentCard>);
    expect(container.querySelector(".ui-content-card__media")).toBeNull();
    expect(container.querySelector(".ui-content-card__heading")).toBeNull();
    expect(container.querySelector(".ui-content-card__footer")).toBeNull();
    expect(container.querySelector(".ui-content-card__body")).toBeTruthy();
  });
});
