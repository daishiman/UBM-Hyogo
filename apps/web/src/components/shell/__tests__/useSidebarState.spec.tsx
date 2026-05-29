import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useSidebarState } from "../useSidebarState";

afterEach(() => cleanup());

describe("useSidebarState", () => {
  it("初期値は expanded / drawer は closed（SSR 安全な決定的初期値）", () => {
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
    expect(result.current.drawerOpen).toBe(false);
  });

  it("toggleCollapsed で collapsed ⇄ expanded がトグルする", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.toggleCollapsed());
    expect(result.current.mode).toBe("collapsed");
    act(() => result.current.toggleCollapsed());
    expect(result.current.mode).toBe("expanded");
  });

  it("setDrawerOpen で drawer を開閉できる", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.setDrawerOpen(true));
    expect(result.current.drawerOpen).toBe(true);
    act(() => result.current.setDrawerOpen(false));
    expect(result.current.drawerOpen).toBe(false);
  });
});
