import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Switch } from "../Switch";

afterEach(() => cleanup());

describe("Switch", () => {
  it("checked=false の状態で aria-checked=false / aria-label を持つ", () => {
    render(<Switch checked={false} onChange={() => {}} label="dark mode" />);
    const el = screen.getByRole("switch", { name: "dark mode" });
    expect(el.getAttribute("aria-checked")).toBe("false");
  });

  it("クリックで onChange(!checked) が呼ばれる", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="t" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("checked=true から click すると onChange(false)", () => {
    const onChange = vi.fn();
    render(<Switch checked={true} onChange={onChange} label="t" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("disabled の場合 onChange は呼ばれない", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} disabled label="t" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
