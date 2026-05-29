import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const setDrawerOpen = vi.fn();
vi.mock("../SidebarShellContext", () => ({
  useSidebarShellContext: () => ({
    mode: "expanded",
    drawerOpen: false,
    toggleCollapsed: vi.fn(),
    setDrawerOpen,
  }),
}));

import { SidebarMobileTrigger } from "../SidebarMobileTrigger";

beforeEach(() => setDrawerOpen.mockClear());
afterEach(() => cleanup());

describe("SidebarMobileTrigger", () => {
  it("render 時には setDrawerOpen を呼ばない（自前 state を持たない・I-E2）", () => {
    render(<SidebarMobileTrigger />);
    expect(setDrawerOpen).not.toHaveBeenCalled();
  });

  it("click で setDrawerOpen(true) を 1 回呼ぶ (AC-E2)", () => {
    render(<SidebarMobileTrigger />);
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    expect(setDrawerOpen).toHaveBeenCalledTimes(1);
    expect(setDrawerOpen).toHaveBeenCalledWith(true);
  });

  it("md+ で hidden、dialog popup semantics を公開する (AC-E1)", () => {
    render(<SidebarMobileTrigger />);
    const btn = screen.getByRole("button", { name: "メニューを開く" });
    expect(btn.className).toContain("md:hidden");
    expect(btn.getAttribute("aria-haspopup")).toBe("dialog");
  });
});
