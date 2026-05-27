import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PillNav } from "../PillNav";

afterEach(() => cleanup());

describe("PillNav", () => {
  const opts = [
    { value: "all", label: "すべて" },
    { value: "pub", label: "公開中" },
  ] as const;

  it("renders tablist with one tab per option and marks active", () => {
    render(<PillNav options={opts} value="pub" onChange={() => {}} ariaLabel="フィルター" />);
    const list = screen.getByRole("tablist", { name: "フィルター" });
    expect(list).toBeDefined();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });

  it("calls onChange with option value on click", () => {
    const onChange = vi.fn();
    render(<PillNav options={opts} value="all" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "公開中" }));
    expect(onChange).toHaveBeenCalledWith("pub");
  });
});
