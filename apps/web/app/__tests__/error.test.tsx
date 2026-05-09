import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../src/lib/logger", () => ({
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

import RouteError from "../error";
import { logger } from "../../src/lib/logger";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

function makeError(opts: { digest?: string; stack?: string } = {}) {
  const e = new Error("boom") as Error & { digest?: string };
  if (opts.stack !== undefined) e.stack = opts.stack;
  if (opts.digest) e.digest = opts.digest;
  return e;
}

describe("RouteError", () => {
  describe("TC-U-01: dev mode で stack を表示する", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });
    it("renders <pre> with stack content", () => {
      const reset = vi.fn();
      render(<RouteError error={makeError({ stack: "Error: dev-stack-marker\n  at x" })} reset={reset} />);
      const pre = document.querySelector("pre");
      expect(pre).not.toBeNull();
      expect(pre?.textContent).toContain("dev-stack-marker");
    });
  });

  describe("TC-U-02: prod mode で stack を表示しない", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
    });
    it("does not render <pre>", () => {
      const reset = vi.fn();
      render(<RouteError error={makeError({ stack: "should-not-show" })} reset={reset} />);
      expect(document.querySelector("pre")).toBeNull();
    });
  });

  describe("TC-U-03: digest が存在すれば表示する", () => {
    it("shows エラーID and digest", () => {
      const reset = vi.fn();
      render(<RouteError error={makeError({ digest: "abc123" })} reset={reset} />);
      expect(screen.getByText(/エラーID:/)).toBeTruthy();
      expect(screen.getByText("abc123")).toBeTruthy();
    });
  });

  describe("TC-U-04: digest が undefined なら表示しない", () => {
    it("does not show エラーID label", () => {
      const reset = vi.fn();
      render(<RouteError error={makeError()} reset={reset} />);
      expect(screen.queryByText(/エラーID:/)).toBeNull();
    });
  });

  describe("TC-U-05: reset ボタンクリックで reset prop が呼ばれる", () => {
    it("invokes reset once on click", () => {
      const reset = vi.fn();
      render(<RouteError error={makeError()} reset={reset} />);
      fireEvent.click(screen.getByRole("button", { name: "再試行する" }));
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });

  describe("TC-U-06: mount 時に logger.error が 1 回呼ばれる", () => {
    it("calls logger.error with event=error.boundary.caught", () => {
      const reset = vi.fn();
      render(<RouteError error={makeError({ digest: "d1" })} reset={reset} />);
      expect(logger.error).toHaveBeenCalledTimes(1);
      const arg = (logger.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(arg.event).toBe("error.boundary.caught");
      expect(arg.digest).toBe("d1");
    });
  });

  describe("TC-U-07: 同 error の再 render では logger.error が 2 回呼ばれない", () => {
    it("keeps logger.error call count at 1 across rerenders with same error", () => {
      const reset = vi.fn();
      const err = makeError({ digest: "stable" });
      const { rerender } = render(<RouteError error={err} reset={reset} />);
      rerender(<RouteError error={err} reset={reset} />);
      rerender(<RouteError error={err} reset={reset} />);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });
});
