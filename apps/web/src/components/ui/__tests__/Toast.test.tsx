import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ToastProvider, useToast } from "../Toast";

function TestConsumer({ message }: { readonly message: string }) {
  const { toast } = useToast();
  return <button onClick={() => toast(message)}>send</button>;
}

let uuidCount = 0;
beforeEach(() => {
  vi.useFakeTimers();
  uuidCount = 0;
  vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(
    () => `uuid-${++uuidCount}` as `${string}-${string}-${string}-${string}-${string}`,
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe("Toast", () => {
  it("toast() を呼ぶと role=status の要素が出現する", () => {
    render(
      <ToastProvider>
        <TestConsumer message="hello" />
      </ToastProvider>,
    );
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByText("send"));
    expect(screen.getByRole("status").textContent).toBe("hello");
  });

  it("3000ms 経過で toast が消える", () => {
    render(
      <ToastProvider>
        <TestConsumer message="bye" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("send"));
    expect(screen.getByRole("status")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("複数の toast を同時に保持する (aria-live=polite)", () => {
    render(
      <ToastProvider>
        <TestConsumer message="m1" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("send"));
    fireEvent.click(screen.getByText("send"));
    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy();
  });

  it("useToast を Provider 外で呼ぶと throw する", () => {
    function Out() {
      useToast();
      return null;
    }
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Out />)).toThrow(/ToastProvider/);
    errSpy.mockRestore();
  });
});
