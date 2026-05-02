// TC-U-11 / TC-A-04: code → 文言マッピングと role=alert / retry ボタン。
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

afterEach(() => cleanup());
import { RequestErrorMessage } from "./RequestErrorMessage";
import type { RequestErrorCode } from "../../../src/lib/api/me-requests.types";

const ALL_CODES: RequestErrorCode[] = [
  "DUPLICATE_PENDING_REQUEST",
  "INVALID_REQUEST",
  "RULES_CONSENT_REQUIRED",
  "RATE_LIMITED",
  "UNAUTHORIZED",
  "NETWORK",
  "SERVER",
];

describe("RequestErrorMessage", () => {
  it.each(ALL_CODES)("renders alert with non-empty text for %s", (code) => {
    render(<RequestErrorMessage code={code} />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeTruthy();
    expect(alert.textContent ?? "").toMatch(/.+/);
    expect(alert.getAttribute("data-code")).toBe(code);
  });

  it("NETWORK: retry ボタンを表示し onRetry を呼ぶ", () => {
    const onRetry = vi.fn();
    render(<RequestErrorMessage code="NETWORK" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /再試行/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("DUPLICATE_PENDING_REQUEST: retry ボタンを表示しない", () => {
    render(
      <RequestErrorMessage code="DUPLICATE_PENDING_REQUEST" onRetry={() => {}} />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
