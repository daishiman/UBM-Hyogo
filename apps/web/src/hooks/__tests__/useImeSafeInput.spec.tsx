import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { useImeSafeInput } from "../useImeSafeInput";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({
  value,
  onCommit,
  debounceMs = 20,
}: {
  value: string;
  onCommit: (value: string) => void;
  debounceMs?: number;
}) {
  const imeInput = useImeSafeInput({ value, onCommit, debounceMs });
  return (
    <>
      <input aria-label="ime" {...imeInput.inputProps} />
      <button type="button" onClick={() => imeInput.commitNow("")}>
        clear
      </button>
    </>
  );
}

describe("useImeSafeInput", () => {
  it("composition 中の change を commit せず、compositionend 後に debounce commit する", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    render(<Harness value="" onCommit={onCommit} />);

    const input = screen.getByLabelText("ime");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "て" } });
    fireEvent.change(input, { target: { value: "テ" } });
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input, { data: "テスト" });
    fireEvent.change(input, { target: { value: "テスト" } });
    vi.advanceTimersByTime(19);
    expect(onCommit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onCommit).toHaveBeenCalledWith("テスト");
  });

  it("commitNow は pending debounce を破棄して即時 commit する", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    render(<Harness value="abc" onCommit={onCommit} />);

    fireEvent.change(screen.getByLabelText("ime"), {
      target: { value: "abcd" },
    });
    fireEvent.click(screen.getByRole("button", { name: "clear" }));
    vi.runAllTimers();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("");
  });

  it("debounceMs=0 は timer を待たずに同期 commit する", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    render(<Harness value="" onCommit={onCommit} debounceMs={0} />);

    fireEvent.change(screen.getByLabelText("ime"), {
      target: { value: "abc" },
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("abc");
  });

  it("composition 中は外部 value 同期で draft を上書きしない", () => {
    const onCommit = vi.fn();
    const { rerender } = render(<Harness value="" onCommit={onCommit} />);

    const input = screen.getByLabelText("ime") as HTMLInputElement;
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "て" } });
    rerender(<Harness value="external" onCommit={onCommit} />);

    expect(input.value).toBe("て");
  });
});
