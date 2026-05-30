import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSidebarState } from "../useSidebarState";

const STORAGE_KEY = "ubm:shell:collapsed";

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  window.localStorage.clear();
});

describe("useSidebarState", () => {
  it("initial mode is expanded when localStorage empty", () => {
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
    expect(result.current.drawerOpen).toBe(false);
  });

  it("toggleCollapsed flips mode and persists to localStorage", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.toggleCollapsed());
    expect(result.current.mode).toBe("collapsed");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");
    act(() => result.current.toggleCollapsed());
    expect(result.current.mode).toBe("expanded");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("hydrates collapsed=true from localStorage", () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("collapsed");
  });

  it("setDrawerOpen updates drawerOpen state", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.setDrawerOpen(true));
    expect(result.current.drawerOpen).toBe(true);
    act(() => result.current.setDrawerOpen(false));
    expect(result.current.drawerOpen).toBe(false);
  });

  it("malformed localStorage value falls back to expanded (SSR safe)", () => {
    window.localStorage.setItem(STORAGE_KEY, "garbage");
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
  });
});
