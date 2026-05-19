import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import LoginError from "./error";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function makeError(digest?: string): Error & { digest?: string } {
  const error = new Error("login failed") as Error & { digest?: string };
  if (digest) error.digest = digest;
  return error;
}

describe("LoginError", () => {
  it("moves focus to the heading and announces the alert assertively", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<LoginError error={makeError()} reset={vi.fn()} />);

    const alert = screen.getByRole("alert");
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "ログイン画面でエラーが発生しました",
    });

    expect(alert.getAttribute("aria-live")).toBe("assertive");
    expect(alert.getAttribute("data-page")).toBe("login-error");
    expect(heading.getAttribute("tabindex")).toBe("-1");
    expect(heading.className).toContain("focus:outline");
    expect(document.activeElement).toBe(heading);
  });

  it("renders digest only when provided", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { rerender } = render(<LoginError error={makeError("abc123")} reset={vi.fn()} />);
    expect(screen.getByText("error id: abc123")).toBeTruthy();

    rerender(<LoginError error={makeError()} reset={vi.fn()} />);
    expect(screen.queryByText(/error id:/)).toBeNull();
  });

  it("calls reset from the retry button", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const reset = vi.fn();

    render(<LoginError error={makeError()} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
