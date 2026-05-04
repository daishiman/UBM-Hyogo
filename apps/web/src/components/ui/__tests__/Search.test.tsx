import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Search } from "../Search";

afterEach(() => cleanup());

describe("Search", () => {
  it("空 value のとき clear ボタンを描画しない", () => {
    render(<Search value="" onChange={() => {}} />);
    expect(screen.queryByLabelText("クリア")).toBeNull();
  });

  it("value あり: clear ボタンを描画し click で onChange('') が呼ばれる", () => {
    const onChange = vi.fn();
    render(<Search value="abc" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("クリア"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("input change で onChange に新しい value が渡る", () => {
    const onChange = vi.fn();
    render(<Search value="" onChange={onChange} placeholder="検索" />);
    const input = screen.getByPlaceholderText("検索") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("placeholder がそのまま input に反映される", () => {
    render(<Search value="" onChange={() => {}} placeholder="search…" />);
    expect(screen.getByPlaceholderText("search…")).toBeTruthy();
  });
});
