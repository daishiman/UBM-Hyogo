import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../src/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import ErrorBoundary from "../error";
import { logger } from "../../../../src/lib/logger";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("AdminError", () => {
  it("focuses the h1 on mount with preventScroll", () => {
    const focusSpy = vi.spyOn(HTMLHeadingElement.prototype, "focus");

    render(<ErrorBoundary error={new Error("boom")} reset={vi.fn()} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.getAttribute("tabindex")).toBe("-1");
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("invokes reset from the retry button", () => {
    const reset = vi.fn();

    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs structured boundary details, hides raw message, and renders digest", () => {
    const error = new Error("secret backend detail") as Error & { digest?: string };
    error.digest = "admin-digest";
    vi.stubEnv("NODE_ENV", "production");

    render(<ErrorBoundary error={error} reset={vi.fn()} />);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "error.boundary.caught",
        scope: "admin",
        digest: "admin-digest",
        err: error,
      }),
    );
    expect(screen.getByText("admin-digest")).toBeTruthy();
    expect(screen.queryByText("secret backend detail")).toBeNull();
  });
});
