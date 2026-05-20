import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import ProfileError from "../error";
import { logger } from "../../../src/lib/logger";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ProfileError", () => {
  it("focuses the h1 on mount with preventScroll", () => {
    const focusSpy = vi.spyOn(HTMLHeadingElement.prototype, "focus");

    render(<ProfileError error={new Error("boom")} reset={vi.fn()} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.getAttribute("tabindex")).toBe("-1");
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("invokes reset from the retry button", () => {
    const reset = vi.fn();

    render(<ProfileError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs structured boundary details and renders digest", () => {
    const error = new Error("boom") as Error & { digest?: string };
    error.digest = "profile-digest";

    render(<ProfileError error={error} reset={vi.fn()} />);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "error.boundary.caught",
        scope: "profile",
        digest: "profile-digest",
        err: error,
      }),
    );
    expect(screen.getByText("profile-digest")).toBeTruthy();
  });
});
