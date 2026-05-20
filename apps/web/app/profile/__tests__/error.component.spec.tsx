import { cleanup, render, screen } from "@testing-library/react";
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

import ProfileError from "../error";
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

describe("ProfileError", () => {
  it("mount 時に h1 へ focus を移譲する", () => {
    render(<ProfileError error={makeError()} reset={vi.fn()} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute("tabindex")).toBe("-1");
  });

  it("focus を preventScroll=true で呼び出す", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    try {
      render(<ProfileError error={makeError()} reset={vi.fn()} />);
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    } finally {
      focusSpy.mockRestore();
    }
  });

  it("role=alert と aria-live=assertive を付与する", () => {
    render(<ProfileError error={makeError()} reset={vi.fn()} />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("assertive");
  });

  it("error.digest が存在するとき エラーID を表示する", () => {
    render(<ProfileError error={makeError({ digest: "abc123" })} reset={vi.fn()} />);
    expect(screen.getByText(/エラーID:/)).toBeTruthy();
    expect(screen.getByText("abc123")).toBeTruthy();
  });

  it("error.digest が undefined なら エラーID を表示しない", () => {
    render(<ProfileError error={makeError()} reset={vi.fn()} />);
    expect(screen.queryByText(/エラーID:/)).toBeNull();
  });

  it("mount 時に logger.error を 1 回だけ呼ぶ", () => {
    const error = makeError({ digest: "d1" });
    const { rerender } = render(<ProfileError error={error} reset={vi.fn()} />);
    rerender(<ProfileError error={error} reset={vi.fn()} />);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith({
      event: "error.boundary.caught",
      digest: "d1",
      err: error,
    });
  });

  it("dev mode では stack を表示し、production では表示しない", () => {
    vi.stubEnv("NODE_ENV", "development");
    const { rerender } = render(
      <ProfileError error={makeError({ stack: "Error: dev-stack-marker" })} reset={vi.fn()} />,
    );
    expect(document.querySelector("pre")?.textContent).toContain("dev-stack-marker");

    vi.stubEnv("NODE_ENV", "production");
    rerender(<ProfileError error={makeError({ stack: "should-not-show" })} reset={vi.fn()} />);
    expect(document.querySelector("pre")).toBeNull();
  });
});
