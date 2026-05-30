// Task A — useSidebarState hook の spec。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

import { useSidebarState } from "../useSidebarState";

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => cleanup());

describe("useSidebarState", () => {
  it("初期値は expanded / drawer は閉じている", () => {
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
    expect(result.current.drawerOpen).toBe(false);
  });

  it("toggleCollapsed で collapsed へ切り替わり localStorage に反映される", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.toggleCollapsed());
    expect(result.current.mode).toBe("collapsed");
    expect(window.localStorage.getItem("ubm:shell:collapsed")).toBe("true");
  });

  it("setDrawerOpen(true) で drawerOpen が true になる", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.setDrawerOpen(true));
    expect(result.current.drawerOpen).toBe(true);
  });

  it("localStorage に collapsed=true があれば mount 後に collapsed を復元する", () => {
    window.localStorage.setItem("ubm:shell:collapsed", "true");
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("collapsed");
  });
});
