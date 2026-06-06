import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BatchIdCopyButton } from "../BatchIdCopyButton";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "clipboard");
});

const setClipboard = (writeText: ReturnType<typeof vi.fn>) => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
};

describe("BatchIdCopyButton", () => {
  it("copies batchId to clipboard and resets copied label", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);

    render(<BatchIdCopyButton batchId="batch-1079" />);
    const button = screen.getByRole("button", { name: "batchId batch-1079 をコピー" });
    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("batch-1079");
    expect(button.textContent).toBe("コピー済み");

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(button.textContent).toBe("コピー");
  });

  it("keeps copy label when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    setClipboard(writeText);

    render(<BatchIdCopyButton batchId="batch-1079" />);
    const button = screen.getByRole("button", { name: "batchId batch-1079 をコピー" });
    fireEvent.click(button);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("batch-1079"));
    expect(button.textContent).toBe("コピー");
  });

  it("does not throw when clipboard is unavailable", () => {
    render(<BatchIdCopyButton batchId="batch-1079" />);
    const button = screen.getByRole("button", { name: "batchId batch-1079 をコピー" });

    expect(() => fireEvent.click(button)).not.toThrow();
    expect(button.textContent).toBe("コピー");
  });
});
