import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { EmptyState } from "../EmptyState";

afterEach(() => cleanup());

describe("EmptyState", () => {
  it("renders title, description and reset link with default label (happy)", () => {
    const { container } = render(
      <EmptyState
        title="該当する会員はいません"
        description="検索条件を見直してください"
        resetHref="/members"
      />,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(
      container.querySelector('[data-role="title"]')?.textContent,
    ).toBe("該当する会員はいません");
    expect(
      container.querySelector('[data-role="description"]')?.textContent,
    ).toBe("検索条件を見直してください");
    const reset = container.querySelector('[data-role="reset"]');
    expect(reset?.getAttribute("href")).toBe("/members");
    expect(reset?.textContent).toBe("絞り込みをクリア");
  });

  it("renders only title when description/resetHref/children are absent (empty)", () => {
    const { container } = render(<EmptyState title="空です" />);
    expect(container.querySelector('[data-role="title"]')?.textContent).toBe(
      "空です",
    );
    expect(container.querySelector('[data-role="description"]')).toBeNull();
    expect(container.querySelector('[data-role="reset"]')).toBeNull();
  });

  it("uses custom resetLabel and renders children slot (variant)", () => {
    render(
      <EmptyState
        title="t"
        resetHref="/x"
        resetLabel="リセット"
      >
        <button>追加アクション</button>
      </EmptyState>,
    );
    const link = screen.getByRole("link");
    expect(link.textContent).toBe("リセット");
    expect(link.getAttribute("href")).toBe("/x");
    expect(screen.getByRole("button").textContent).toBe("追加アクション");
  });
});
