// parallel-10 Phase 6 Step 2: Toast variant の test。
// variant="status" は role="status"、variant="alert" は role="alert" に出し分ける。

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { ToastProvider, useToast } from "./Toast";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Trigger({
  message,
  variant,
}: {
  readonly message: string;
  readonly variant?: "alert" | "status";
}) {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast(message, variant)}>
      fire
    </button>
  );
}

describe("Toast variants", () => {
  it("default variant は role=status に出る", () => {
    render(
      <ToastProvider>
        <Trigger message="hello" />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText("fire").click();
    });
    const statusEl = screen.getByRole("status");
    expect(statusEl.textContent).toBe("hello");
  });

  it("variant=alert は role=alert に出る", () => {
    render(
      <ToastProvider>
        <Trigger message="warn" variant="alert" />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText("fire").click();
    });
    const alertEl = screen.getByRole("alert");
    expect(alertEl.textContent).toBe("warn");
  });

  it("3 秒経過後に消える", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger message="bye" />
      </ToastProvider>,
    );
    act(() => {
      screen.getByText("fire").click();
    });
    expect(screen.getByRole("status").textContent).toBe("bye");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });
});
