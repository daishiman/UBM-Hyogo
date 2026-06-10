import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SectionError } from "../SectionError";

afterEach(() => cleanup());

describe("member SectionError", () => {
  it("renders as a polite alert", () => {
    render(<SectionError />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("polite");
    expect(alert.textContent).toContain("読み込みに失敗しました");
  });

  it("renders detail and retry link when provided", () => {
    render(<SectionError detail="profile failed" retryHref="/profile" />);
    expect(screen.getByText("profile failed")).toBeDefined();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/profile");
  });

  it("renders an optional diagnostic cause as a data attribute", () => {
    render(<SectionError detail="profile failed" dataCause="session-410" />);
    expect(screen.getByRole("alert").getAttribute("data-cause")).toBe(
      "session-410",
    );
  });

  it("renders an optional action link when href and label are provided", () => {
    render(
      <SectionError
        actionHref="/login?redirect=/profile"
        actionLabel="再ログイン"
        retryHref="/profile"
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("data-role"))).toEqual([
      "action",
      "retry",
    ]);
    expect(links[0]?.getAttribute("href")).toBe("/login?redirect=/profile");
    expect(links[0]?.textContent).toBe("再ログイン");
  });

  it("does not render an action link unless href and label are both provided", () => {
    const { rerender, container } = render(<SectionError actionHref="/login" />);
    expect(container.querySelector('[data-role="action"]')).toBeNull();

    rerender(<SectionError actionLabel="再ログイン" />);
    expect(container.querySelector('[data-role="action"]')).toBeNull();
  });

  it("does not emit raw hex colors", () => {
    const { container } = render(<SectionError detail="x" />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
