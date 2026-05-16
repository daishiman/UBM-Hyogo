import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import LoginError from "../error";
import LoginLoading from "../loading";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function makeError(digest?: string) {
  const e = new Error("login boom") as Error & { digest?: string };
  if (digest) e.digest = digest;
  return e;
}

describe("LoginError", () => {
  it("U1: renders Card with data-state=error", () => {
    const reset = vi.fn();
    const { container } = render(
      <LoginError error={makeError()} reset={reset} />,
    );
    expect(container.querySelector('[data-state="error"]')).not.toBeNull();
  });

  it("U2: shows fixed heading text and role=alert", () => {
    const reset = vi.fn();
    render(<LoginError error={makeError()} reset={reset} />);
    expect(
      screen.getByRole("heading", { name: /ログイン処理でエラーが発生しました/ }),
    ).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("U3: heading auto-focuses on mount", () => {
    const reset = vi.fn();
    render(<LoginError error={makeError()} reset={reset} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(document.activeElement).toBe(h1);
    expect(h1.getAttribute("tabindex")).toBe("-1");
  });

  it("U4: shows error.digest when present", () => {
    const reset = vi.fn();
    render(<LoginError error={makeError("digest-x")} reset={reset} />);
    expect(screen.getByText("digest-x")).toBeTruthy();
  });

  it("U5: omits digest block when undefined", () => {
    const reset = vi.fn();
    render(<LoginError error={makeError()} reset={reset} />);
    expect(screen.queryByText(/エラーID:/)).toBeNull();
  });

  it("U6: clicking 再試行する invokes reset", () => {
    const reset = vi.fn();
    render(<LoginError error={makeError()} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "再試行する" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("U7: uses OKLch token utility classes only", () => {
    const reset = vi.fn();
    const { container } = render(
      <LoginError error={makeError("d")} reset={reset} />,
    );
    const html = container.innerHTML;
    expect(html).toContain("text-danger");
    expect(html).toContain("bg-accent");
    expect(html).toContain("text-panel");
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it("U7a: has no axe violations", async () => {
    const reset = vi.fn();
    const { container } = render(
      <LoginError error={makeError("d")} reset={reset} />,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe("LoginLoading", () => {
  it("U8: renders role=status with aria-busy/aria-live", () => {
    render(<LoginLoading />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it("U9: includes sr-only describing label", () => {
    render(<LoginLoading />);
    expect(screen.getByText("ログイン画面を読み込み中")).toBeTruthy();
  });

  it("U10: skeleton blocks use bg-surface-2 + motion-safe:animate-pulse", () => {
    const { container } = render(<LoginLoading />);
    const html = container.innerHTML;
    expect(html).toContain("bg-surface-2");
    expect(html).toContain("motion-safe:animate-pulse");
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it("U11: skeleton has 3 placeholder blocks", () => {
    const { container } = render(<LoginLoading />);
    const blocks = container.querySelectorAll(".bg-surface-2");
    expect(blocks.length).toBe(3);
  });

  it("U11a: has no axe violations", async () => {
    const { container } = render(<LoginLoading />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
