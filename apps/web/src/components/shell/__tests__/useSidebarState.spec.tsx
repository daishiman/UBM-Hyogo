import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

import { usePathname } from "next/navigation";
import {
  useSidebarState,
  SIDEBAR_COLLAPSED_STORAGE_KEY,
} from "../useSidebarState";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/");
  window.localStorage.clear();
  // jsdom には matchMedia が無いので lg 相当（>=1024）を返す stub。
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
});

describe("useSidebarState", () => {
  it("初期値は expanded（localStorage 未設定 + lg viewport）", () => {
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
    expect(result.current.collapsed).toBe(false);
  });

  it("toggleCollapsed で collapsed になり localStorage に永続化される", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.toggleCollapsed());
    expect(result.current.collapsed).toBe(true);
    expect(result.current.mode).toBe("collapsed");
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe("true");
  });

  it("永続化済みの collapsed=true を初期値として復元する", () => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, "true");
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.collapsed).toBe(true);
  });

  it("setDrawerOpen(true) で drawerOpen が立つ", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.setDrawerOpen(true));
    expect(result.current.drawerOpen).toBe(true);
  });
});
