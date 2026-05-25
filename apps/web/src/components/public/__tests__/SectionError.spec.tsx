import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SectionError } from "../SectionError";

afterEach(() => cleanup());

describe("public SectionError", () => {
  it("renders as a polite alert", () => {
    render(<SectionError />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("polite");
    expect(alert.textContent).toContain("読み込みに失敗しました");
  });

  it("renders detail and retry link when provided", () => {
    render(<SectionError detail="API failure" retryHref="/members" />);
    expect(screen.getByText("API failure")).toBeDefined();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/members");
  });

  it("does not emit raw hex colors", () => {
    const { container } = render(<SectionError detail="x" />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
