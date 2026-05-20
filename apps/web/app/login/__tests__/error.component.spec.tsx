import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import LoginError from "../error";
import { logger } from "../../../src/lib/logger";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

function makeError(opts: { digest?: string; stack?: string } = {}) {
  const error = new Error("boom") as Error & { digest?: string };
  if (opts.stack !== undefined) error.stack = opts.stack;
  if (opts.digest) error.digest = opts.digest;
  return error;
}

describe("LoginError", () => {
  it("mount 時に h1 へ focus を移譲する", () => {
    render(<LoginError error={makeError()} reset={vi.fn()} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute("tabindex")).toBe("-1");
  });

  it("role=alert と aria-live=assertive を付与する", () => {
    render(<LoginError error={makeError()} reset={vi.fn()} />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("assertive");
  });

  it("digest と dev stack を条件付きで表示する", () => {
    vi.stubEnv("NODE_ENV", "development");
    const { rerender } = render(
      <LoginError
        error={makeError({ digest: "login-digest", stack: "Error: login-stack" })}
        reset={vi.fn()}
      />,
    );
    expect(screen.getByText(/エラーID:/)).toBeTruthy();
    expect(screen.getByText("login-digest")).toBeTruthy();
    expect(document.querySelector("pre")?.textContent).toContain("login-stack");

    vi.stubEnv("NODE_ENV", "production");
    rerender(<LoginError error={makeError({ stack: "should-not-show" })} reset={vi.fn()} />);
    expect(screen.queryByText(/エラーID:/)).toBeNull();
    expect(document.querySelector("pre")).toBeNull();
  });

  it("reset click と logger.error を検証する", () => {
    const reset = vi.fn();
    const error = makeError({ digest: "d1" });
    render(<LoginError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith({
      event: "error.boundary.caught",
      digest: "d1",
      err: error,
    });
  });
});
