import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../../src/lib/logger", () => ({
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

import AdminError from "../error";
import { logger } from "../../../../src/lib/logger";

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

describe("AdminError", () => {
  describe("TC-AE-01: dev mode で stack を表示する", () => {
    beforeEach(() => vi.stubEnv("NODE_ENV", "development"));

    it("renders <pre> with stack content", () => {
      const reset = vi.fn();
      render(
        <AdminError
          error={makeError({ stack: "Error: admin-stack-marker\n  at x" })}
          reset={reset}
        />,
      );
      const pre = document.querySelector("pre");
      expect(pre).not.toBeNull();
      expect(pre?.textContent).toContain("admin-stack-marker");
    });
  });

  describe("TC-AE-02: prod mode で stack を表示しない", () => {
    beforeEach(() => vi.stubEnv("NODE_ENV", "production"));

    it("does not render <pre>", () => {
      const reset = vi.fn();
      render(<AdminError error={makeError({ stack: "should-not-show" })} reset={reset} />);
      expect(document.querySelector("pre")).toBeNull();
    });
  });

  describe("TC-AE-03: digest が存在すれば表示する", () => {
    it("shows エラーID and digest", () => {
      render(<AdminError error={makeError({ digest: "abc123" })} reset={vi.fn()} />);
      expect(screen.getByText(/エラーID:/)).toBeTruthy();
      expect(screen.getByText("abc123")).toBeTruthy();
    });
  });

  describe("TC-AE-04: digest が undefined なら表示しない", () => {
    it("does not show エラーID label", () => {
      render(<AdminError error={makeError()} reset={vi.fn()} />);
      expect(screen.queryByText(/エラーID:/)).toBeNull();
    });
  });

  describe("TC-AE-05: reset ボタンクリックで reset prop が呼ばれる", () => {
    it("invokes reset once on click", () => {
      const reset = vi.fn();
      render(<AdminError error={makeError()} reset={reset} />);
      fireEvent.click(screen.getByRole("button", { name: "再試行" }));
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });

  describe("TC-AE-06: mount 時に logger.error が 1 回呼ばれる", () => {
    it("calls logger.error with event=error.boundary.caught and scope=admin", () => {
      render(<AdminError error={makeError({ digest: "d1" })} reset={vi.fn()} />);
      expect(logger.error).toHaveBeenCalledTimes(1);
      const arg = (logger.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(arg.event).toBe("error.boundary.caught");
      expect(arg.scope).toBe("admin");
      expect(arg.digest).toBe("d1");
    });
  });

  describe("TC-AE-07: 同 error の再 render では logger.error が 2 回呼ばれない", () => {
    it("keeps logger.error call count at 1 across rerenders with same error", () => {
      const err = makeError({ digest: "stable" });
      const { rerender } = render(<AdminError error={err} reset={vi.fn()} />);
      rerender(<AdminError error={err} reset={vi.fn()} />);
      rerender(<AdminError error={err} reset={vi.fn()} />);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("TC-AE-08: OKLch トークンのみ使用", () => {
    it("uses design tokens and no stale token classes", () => {
      const { container } = render(
        <AdminError error={makeError({ digest: "d1" })} reset={vi.fn()} />,
      );
      const html = container.innerHTML;
      expect(html).not.toContain("text-[var(");
      expect(html).not.toContain("bg-[var(");
      expect(html).not.toContain("ubm-color-");
      expect(html).toContain("text-danger");
      expect(html).toContain("text-text-3");
      expect(html).toContain("bg-accent");
      expect(html).toContain("border-border");
    });
  });

  describe("TC-AE-09: mount 時に h1 へ focus が移譲される", () => {
    it("focuses h1 on mount", () => {
      render(<AdminError error={makeError({ digest: "focus-test" })} reset={vi.fn()} />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(document.activeElement).toBe(h1);
    });

    it("h1 has tabIndex=-1 to allow programmatic focus", () => {
      render(<AdminError error={makeError()} reset={vi.fn()} />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.getAttribute("tabindex")).toBe("-1");
    });

    it("calls focus with preventScroll=true", () => {
      const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
      try {
        render(<AdminError error={makeError()} reset={vi.fn()} />);
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      } finally {
        focusSpy.mockRestore();
      }
    });
  });

  describe("TC-AE-10: role=alert + aria-live=assertive", () => {
    it("wrapper has role=alert and aria-live=assertive", () => {
      render(<AdminError error={makeError()} reset={vi.fn()} />);
      const alert = screen.getByRole("alert");
      expect(alert.getAttribute("aria-live")).toBe("assertive");
    });
  });

  describe("TC-AE-11: トップへ戻る Link は / を指す", () => {
    it("renders link to /", () => {
      render(<AdminError error={makeError()} reset={vi.fn()} />);
      const link = screen.getByRole("link", { name: "トップへ戻る" });
      expect(link.getAttribute("href")).toBe("/");
    });
  });
});
