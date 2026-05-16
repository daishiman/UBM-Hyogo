import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import ProfileLoading from "../loading";

afterEach(() => {
  cleanup();
});

describe("ProfileLoading", () => {
  it("U16: role=status with aria-busy/aria-live", () => {
    render(<ProfileLoading />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it("U17: includes sr-only label", () => {
    render(<ProfileLoading />);
    expect(screen.getByText("プロフィールを読み込み中")).toBeTruthy();
  });

  it("U18: avatar + name + 3 kv blocks => 5 skeleton blocks", () => {
    const { container } = render(<ProfileLoading />);
    expect(container.querySelectorAll(".bg-surface-2").length).toBe(5);
  });

  it("U19: uses OKLch tokens only (no HEX)", () => {
    const { container } = render(<ProfileLoading />);
    const html = container.innerHTML;
    expect(html).toContain("bg-surface-2");
    expect(html).toContain("motion-safe:animate-pulse");
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it("U19a: has no axe violations", async () => {
    const { container } = render(<ProfileLoading />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
