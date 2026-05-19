import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ProfileLoading from "./loading";

afterEach(() => cleanup());

describe("ProfileLoading", () => {
  it("TC-01: role=status と aria-busy を持つ", () => {
    render(<ProfileLoading />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("data-page")).toBe("profile-loading");
  });

  it("TC-02: sr-only テキストが存在する", () => {
    render(<ProfileLoading />);

    const text = screen.getByText("マイページを読み込み中");
    expect(text.className).toContain("sr-only");
  });

  it("TC-03: avatar と heading skeleton 要素を持つ", () => {
    const { container } = render(<ProfileLoading />);

    const avatar = container.querySelector('[data-skeleton="avatar"]');
    const heading = container.querySelector('[data-skeleton="heading"]');
    expect(avatar?.className).toContain("rounded-full");
    expect(heading?.className).toContain("h-8");
    expect(heading?.className).toContain("w-48");
  });

  it("TC-04: KV pair skeleton 4 行と全 skeleton token class を持つ", () => {
    const { container } = render(<ProfileLoading />);

    const rows = container.querySelectorAll(
      '[data-skeleton="profile-kv"] .h-6.bg-surface-2',
    );
    expect(rows.length).toBe(4);

    const skeletons = [
      container.querySelector('[data-skeleton="avatar"]'),
      container.querySelector('[data-skeleton="heading"]'),
      ...Array.from(rows),
    ];
    expect(skeletons).toHaveLength(6);
    for (const skeleton of skeletons) {
      expect(skeleton?.className).toContain("bg-surface-2");
      expect(skeleton?.className).toContain("motion-safe:animate-pulse");
    }
  });
});
