import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Search } from "../Search";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Search", () => {
  it("IME composition 中は onChange を呼ばず、確定後 debounce で呼ぶ", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <Search
        value=""
        onChange={onChange}
        debounceMs={20}
        placeholder="名前・職業・地域で検索"
      />,
    );

    const input = screen.getByPlaceholderText("名前・職業・地域で検索");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "て" } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input, { data: "テスト" });
    fireEvent.change(input, { target: { value: "テスト" } });
    vi.advanceTimersByTime(20);
    expect(onChange).toHaveBeenCalledWith("テスト");
  });

  it("クリアボタンは debounce を待たずに空文字を commit する", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<Search value="山田" onChange={onChange} debounceMs={20} />);

    fireEvent.click(screen.getByRole("button", { name: "クリア" }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
