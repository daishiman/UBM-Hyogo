import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Input } from "../Input";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Input", () => {
  it("imeSafe=false では既存 onChange をそのまま呼ぶ", () => {
    const onChange = vi.fn();
    render(<Input aria-label="plain" value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("plain"), {
      target: { value: "a" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("imeSafe=true かつ onValueChange 指定時は composition 中の commit を debounce まで遅延する", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Input
        aria-label="ime"
        value=""
        onChange={onChange}
        onValueChange={onValueChange}
        imeSafe
        debounceMs={20}
      />,
    );

    const input = screen.getByLabelText("ime");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "て" } });
    expect(onChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input, { data: "テスト" });
    fireEvent.change(input, { target: { value: "テスト" } });
    vi.advanceTimersByTime(20);

    expect(onChange).not.toHaveBeenCalled();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("テスト");
  });

  it("imeSafe=true でも onValueChange 未指定なら既存 onChange 経路を維持する", () => {
    const onChange = vi.fn();
    render(<Input aria-label="fallback" value="" onChange={onChange} imeSafe />);

    fireEvent.change(screen.getByLabelText("fallback"), {
      target: { value: "a" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
