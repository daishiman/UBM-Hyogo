import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import NotFound from "../not-found";

afterEach(() => {
  cleanup();
});

describe("NotFound", () => {
  it("has data-page=not-found and aria-labelledby attributes", () => {
    const { container } = render(<NotFound />);
    const main = container.querySelector("main");
    expect(main).not.toBeNull();
    expect(main?.getAttribute("data-page")).toBe("not-found");
    expect(main?.getAttribute("data-testid")).toBe("not-found");
    expect(main?.getAttribute("aria-labelledby")).toBe("not-found-title");
  });

  it("renders Card + EmptyState structure", () => {
    const { container } = render(<NotFound />);
    const html = container.innerHTML;
    expect(html).toContain("ui-card");
    expect(html).toContain("ui-card-content");
    expect(html).toContain("ui-empty-state");
  });

  it("renders two link actions pointing to / and /members", () => {
    render(<NotFound />);
    const home = screen.getByRole("link", { name: "トップへ戻る" });
    const members = screen.getByRole("link", { name: "メンバー一覧へ" });
    expect(home.getAttribute("href")).toBe("/");
    expect(members.getAttribute("href")).toBe("/members");
  });

  it("shows the not-found title and description text", () => {
    render(<NotFound />);
    expect(screen.getByText("ページが見つかりません")).toBeTruthy();
    expect(screen.getByText(/URL をご確認/)).toBeTruthy();
  });
});
