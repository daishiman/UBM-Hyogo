// Task A — useSidebarState hook の spec。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

import { useSidebarState } from "../useSidebarState";

beforeEach(() => {
  document.cookie = "ubm_shell_collapsed=; Path=/; Max-Age=0; SameSite=Lax";
});
afterEach(() => cleanup());

describe("useSidebarState", () => {
  it("初期値は expanded / drawer は閉じている", () => {
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
    expect(result.current.drawerOpen).toBe(false);
  });

  it("toggleCollapsed で collapsed へ切り替わり cookie に反映される", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.toggleCollapsed());
    expect(result.current.mode).toBe("collapsed");
    expect(document.cookie).toContain("ubm_shell_collapsed=true");
  });

  it("setDrawerOpen(true) で drawerOpen が true になる", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.setDrawerOpen(true));
    expect(result.current.drawerOpen).toBe(true);
  });

  it("initialCollapsed=true があれば初回 render から collapsed を復元する", () => {
    const { result } = renderHook(() => useSidebarState(true));
    expect(result.current.mode).toBe("collapsed");
  });

  it("initialCollapsed=false があれば初回 render から expanded を維持する", () => {
    const { result } = renderHook(() => useSidebarState(false));
    expect(result.current.mode).toBe("expanded");
  });

  it("cookie seed がない場合は md viewport heuristic で collapsed にする", async () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn((query: string) => ({
        matches: query === "(min-width: 768px)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    try {
      const { result } = renderHook(() => useSidebarState(null));
      await waitFor(() => expect(result.current.mode).toBe("collapsed"));
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });
    }
  });
});
