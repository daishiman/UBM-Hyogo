import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginError from "../error";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LoginError", () => {
  it("focuses the h1 on mount with preventScroll", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const focusSpy = vi.spyOn(HTMLHeadingElement.prototype, "focus");

    render(<LoginError error={new Error("boom")} reset={vi.fn()} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.getAttribute("tabindex")).toBe("-1");
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("invokes reset from the retry button", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const reset = vi.fn();

    render(<LoginError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
