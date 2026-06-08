import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { TagPicker } from "../TagPicker.client";

afterEach(() => cleanup());

const options = [
  { code: "ai", label: "AI", count: 3 },
  { code: "design", label: "デザイン", count: 1 },
];

describe("TagPicker", () => {
  it("options を chip としてレンダーする", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <TagPicker
        options={options}
        selected={[]}
        max={5}
        onToggle={onToggle}
      />,
    );
    const chips = container.querySelectorAll(
      '[data-component="tag-pill"]',
    );
    expect(chips).toHaveLength(2);
    expect(container.querySelector('[data-role="tag-picker-options"]')).toBeTruthy();
    expect(chips[0]?.getAttribute("aria-checked")).toBe("false");
  });

  it("選択済み chip は aria-checked=true で表現する", () => {
    const { container } = render(
      <TagPicker
        options={options}
        selected={["ai"]}
        max={5}
        onToggle={vi.fn()}
      />,
    );
    const selected = container.querySelector('[data-tag-code="ai"]');
    expect(selected?.getAttribute("role")).toBe("switch");
    expect(selected?.getAttribute("aria-checked")).toBe("true");
    expect(selected?.getAttribute("aria-selected")).toBeNull();
  });

  it("クリックすると onToggle(code) が呼ばれる", () => {
    const onToggle = vi.fn();
    render(
      <TagPicker
        options={options}
        selected={[]}
        max={5}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(
      screen.getByRole("switch", { name: /AI/ }),
    );
    expect(onToggle).toHaveBeenCalledWith("ai");
  });

  it("selected.length>=max かつ未選択は aria-disabled で no-op、hint 表示", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <TagPicker
        options={options}
        selected={["a", "b", "c", "d", "e"]}
        max={5}
        onToggle={onToggle}
      />,
    );
    const chip = container.querySelector('[data-tag-code="ai"]') as HTMLElement;
    expect(chip.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(chip);
    expect(onToggle).not.toHaveBeenCalled();
    expect(container.querySelector('[data-role="tag-limit-hint"]')).toBeTruthy();
  });

  it("options が空のとき何もレンダーしない", () => {
    const { container } = render(
      <TagPicker
        options={[]}
        selected={[]}
        max={5}
        onToggle={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-component="tag-picker"]')).toBeNull();
  });
});
