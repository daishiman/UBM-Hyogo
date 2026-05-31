// Task E — SidebarMobileTrigger の spec。クリックで context.setDrawerOpen(true)。
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

import { SidebarMobileTrigger } from "../SidebarMobileTrigger";
import { SidebarShellProvider } from "../SidebarShellContext";

afterEach(() => cleanup());

describe("SidebarMobileTrigger", () => {
  it("クリックで context の setDrawerOpen(true) が呼ばれる", () => {
    const setDrawerOpen = vi.fn();
    const { getByRole } = render(
      <SidebarShellProvider
        value={{ mode: "expanded", drawerOpen: false, toggleCollapsed: vi.fn(), setDrawerOpen }}
      >
        <SidebarMobileTrigger />
      </SidebarShellProvider>,
    );
    fireEvent.click(getByRole("button", { name: "メニューを開く" }));
    expect(setDrawerOpen).toHaveBeenCalledWith(true);
  });

  it("md+ で hidden になる class を持つ", () => {
    const { getByRole } = render(
      <SidebarShellProvider
        value={{ mode: "expanded", drawerOpen: false, toggleCollapsed: vi.fn(), setDrawerOpen: vi.fn() }}
      >
        <SidebarMobileTrigger />
      </SidebarShellProvider>,
    );
    expect(getByRole("button", { name: "メニューを開く" }).className).toContain("md:hidden");
  });
});
