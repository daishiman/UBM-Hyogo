import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PillNav } from "../PillNav";

afterEach(() => cleanup());

const OPTIONS = [
  { value: "all", label: "全て" },
  { value: "published", label: "公開" },
  { value: "hidden", label: "非公開" },
] as const;

describe("PillNav", () => {
  it("marks the active option with aria-selected", () => {
    render(
      <PillNav
        options={OPTIONS}
        value="published"
        onChange={() => {}}
        ariaLabel="状態"
      />,
    );
    expect(
      screen.getByRole("tab", { name: "公開" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      screen.getByRole("tab", { name: "全て" }).getAttribute("aria-selected"),
    ).toBe("false");
  });

  it("calls onChange with the option value", () => {
    const onChange = vi.fn();
    render(
      <PillNav
        options={OPTIONS}
        value="all"
        onChange={onChange}
        ariaLabel="状態"
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "非公開" }));
    expect(onChange).toHaveBeenCalledWith("hidden");
  });
});
