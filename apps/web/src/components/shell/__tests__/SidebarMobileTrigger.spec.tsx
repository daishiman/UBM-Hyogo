import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarShellProvider } from "../SidebarShellContext";
import { SidebarMobileTrigger } from "../SidebarMobileTrigger";

afterEach(() => {
  cleanup();
});

describe("SidebarMobileTrigger", () => {
  it("opens the drawer through sidebar context", () => {
    const setDrawerOpen = vi.fn();
    render(
      <SidebarShellProvider
        value={{
          mode: "expanded",
          drawerOpen: false,
          toggleCollapsed: vi.fn(),
          setDrawerOpen,
        }}
      >
        <SidebarMobileTrigger />
      </SidebarShellProvider>,
    );

    const trigger = screen.getByRole("button", { name: "サイドバーを開く" });
    expect(trigger.getAttribute("aria-controls")).toBe("shell-drawer");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.className).toContain("md:hidden");

    fireEvent.click(trigger);
    expect(setDrawerOpen).toHaveBeenCalledWith(true);
  });

  it("reflects open state in aria-expanded", () => {
    render(
      <SidebarShellProvider
        value={{
          mode: "expanded",
          drawerOpen: true,
          toggleCollapsed: vi.fn(),
          setDrawerOpen: vi.fn(),
        }}
      >
        <SidebarMobileTrigger />
      </SidebarShellProvider>,
    );

    expect(screen.getByRole("button", { name: "サイドバーを開く" }).getAttribute(
      "aria-expanded",
    )).toBe("true");
  });
});
