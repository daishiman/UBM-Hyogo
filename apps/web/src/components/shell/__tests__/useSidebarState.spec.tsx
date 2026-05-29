import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { useSidebarState } from "../useSidebarState";

const STORAGE_KEY = "ubm:shell:collapsed";

// jsdom は matchMedia を実装しないため、明示 mock を被せる。
function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  // jsdom 既定（matchMedia 未実装）へ戻す。
  // @ts-expect-error 一時的に未定義へ戻す
  delete window.matchMedia;
});

describe("useSidebarState (Task A 基盤)", () => {
  it("localStorage 未設定 / matchMedia 未提供で初期 expanded", () => {
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
    expect(result.current.drawerOpen).toBe(false);
  });

  it("toggleCollapsed で collapsed へ切替 + localStorage へ反映", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.toggleCollapsed());
    expect(result.current.mode).toBe("collapsed");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
    act(() => result.current.toggleCollapsed());
    expect(result.current.mode).toBe("expanded");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("setDrawerOpen(true) で drawerOpen 反映", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.setDrawerOpen(true));
    expect(result.current.drawerOpen).toBe(true);
  });

  it("localStorage に collapsed=true があれば初期 collapsed を復元", () => {
    localStorage.setItem(STORAGE_KEY, "true");
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("collapsed");
  });
});

describe("useSidebarState 初期 collapsed 判定 (Task E)", () => {
  it("matchMedia(min-width:1024px)=false で collapsed (AC-E9)", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("collapsed");
  });

  it("matchMedia(min-width:1024px)=true で expanded (AC-E9)", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
  });

  it("localStorage 既存値が viewport 既定より優先される (AC-E9)", () => {
    localStorage.setItem(STORAGE_KEY, "false"); // expanded を永続
    mockMatchMedia(false); // viewport は collapsed を示唆
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded"); // localStorage 優先
  });

  it("matchMedia は初回マウントで 1 回だけ参照され resize listener を張らない (AC-E10)", () => {
    const mql = {
      matches: false,
      media: "(min-width: 1024px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const matchMediaMock = vi.fn().mockReturnValue(mql);
    window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
    renderHook(() => useSidebarState());
    expect(matchMediaMock).toHaveBeenCalledTimes(1);
    expect(mql.addEventListener).not.toHaveBeenCalled();
  });

  it("matchMedia 未提供（SSR 相当）で no-op・expanded fallback (AC-E10)", () => {
    // matchMedia 未定義のまま（afterEach で削除済の jsdom 既定状態）
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
  });
});
