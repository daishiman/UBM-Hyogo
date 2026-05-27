import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TagPill } from "../TagPill";

afterEach(() => cleanup());

describe("TagPill", () => {
  it("renders aria-pressed=true when selected", () => {
    render(<TagPill selected>東京</TagPill>);
    expect(
      screen.getByRole("button", { name: "東京" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("invokes onClick", () => {
    const onClick = vi.fn();
    render(<TagPill onClick={onClick}>tag</TagPill>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });

  it("disables when disabled prop", () => {
    const onClick = vi.fn();
    render(
      <TagPill disabled onClick={onClick}>
        tag
      </TagPill>,
    );
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
