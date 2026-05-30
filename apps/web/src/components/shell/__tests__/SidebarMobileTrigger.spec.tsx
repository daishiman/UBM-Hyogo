import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { SidebarMobileTrigger } from "../SidebarMobileTrigger";
import { SidebarShellProvider } from "../SidebarShellContext";

afterEach(() => cleanup());

function renderWithCtx(setDrawerOpen: (open: boolean) => void) {
  return render(
    <SidebarShellProvider
      value={{ collapsed: false, drawerOpen: false, toggleCollapsed: vi.fn(), setDrawerOpen }}
    >
      <SidebarMobileTrigger />
    </SidebarShellProvider>,
  );
}

describe("SidebarMobileTrigger", () => {
  it("クリックで setDrawerOpen(true) を呼ぶ", () => {
    const setDrawerOpen = vi.fn();
    renderWithCtx(setDrawerOpen);
    fireEvent.click(screen.getByTestId("shell-drawer-toggle"));
    expect(setDrawerOpen).toHaveBeenCalledWith(true);
  });

  it("md+ で hidden になる（md:hidden クラス）", () => {
    renderWithCtx(vi.fn());
    expect(screen.getByTestId("shell-drawer-toggle").className).toContain("md:hidden");
  });
});
