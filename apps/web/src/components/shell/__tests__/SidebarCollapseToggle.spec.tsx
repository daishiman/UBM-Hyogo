import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SidebarShellProvider } from "../SidebarShellContext";
import { SidebarCollapseToggle } from "../SidebarCollapseToggle";

afterEach(() => cleanup());

function renderToggle(mode: "expanded" | "collapsed", toggleCollapsed = vi.fn()) {
  return {
    toggleCollapsed,
    ...render(
      <SidebarShellProvider
        value={{
          mode,
          drawerOpen: false,
          toggleCollapsed,
          setDrawerOpen: vi.fn(),
        }}
      >
        <SidebarCollapseToggle />
      </SidebarShellProvider>,
    ),
  };
}

describe("SidebarCollapseToggle", () => {
  it("expanded では tooltip を描画せず折りたたみ button を出す", () => {
    const { container } = renderToggle("expanded");
    const button = container.querySelector('[data-shell-block="collapse-toggle"]');
    expect(button?.getAttribute("aria-label")).toBe("サイドバーを折りたたむ");
    expect(button?.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
  });

  it("collapsed では展開 tooltip を aria-describedby で接続する", () => {
    const { container } = renderToggle("collapsed");
    const button = container.querySelector('[data-shell-block="collapse-toggle"]');
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(button?.getAttribute("aria-label")).toBe("サイドバーを展開");
    expect(button?.getAttribute("aria-expanded")).toBe("false");
    expect(tooltip?.textContent).toBe("サイドバーを展開");
    expect(button?.getAttribute("aria-describedby")).toBe(tooltip?.id);
  });

  it("click を context の toggleCollapsed に委譲する", () => {
    const { container, toggleCollapsed } = renderToggle("collapsed");
    const button = container.querySelector('[data-shell-block="collapse-toggle"]');
    if (!button) throw new Error("test setup failed");
    fireEvent.click(button);
    expect(toggleCollapsed).toHaveBeenCalledTimes(1);
  });
});
