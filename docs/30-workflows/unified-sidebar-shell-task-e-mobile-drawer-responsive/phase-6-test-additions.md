---
spec_classification: implementation_spec
state: spec_created
phase: 6
phase_name: テスト追加
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 6: テスト追加

## 6.1 新規 / 追記 spec

| # | spec path | 種別 | 内容 | AC |
|---|-----------|------|------|----|
| 0 | `apps/web/src/lib/a11y/__tests__/useFocusTrap.spec.tsx` | RTL 新規 | trap 全 branch: 初期 focus / Tab 両境界ループ / Esc→onClose / focusables 0 件 / SSR no-op / previousFocus 復帰（**trap の真実はここで網羅**） | AC-E4, AC-E6 |
| 1 | `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx` | RTL 新規 | click→`setDrawerOpen(true)` / `md:hidden` / `aria-label` / `aria-haspopup` / render 時非呼出 | AC-E1, AC-E2 |
| 2 | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | RTL 新規 | open/close・dialog role・backdrop・body 属性・route auto-close + **hook 結線 smoke**（初期 focus / Esc→onClose） | AC-E3..AC-E8, AC-E11 |
| 3 | `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` | RTL 追記（Task A 所有） | `matchMedia` mock の初期 collapsed / SSR no-op | AC-E9, AC-E10 |
| 4 | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | RTL 追記（Task A 所有・無ければ新規） | `<aside>` `hidden md:flex` / drawer ラッパ `md:hidden` | AC-E1, AC-E11 |

`*.spec.tsx` のみ（`*.test.*` 禁止・不変条件 #8）。

> **テスト層の重複回避（I-E6 の精神）**: Tab 両境界ループ / focusables 0 件 / SSR no-op / previousFocus 復帰の詳細 branch は #0 `useFocusTrap.spec` が単独で網羅する。#2 `SidebarDrawer.spec` の focus 系は「hook が正しく結線されているか」の smoke（初期 focus が当たる・Esc で `onClose` が発火する）に留め、Tab ループ全パターンを再掲しない。`Drawer.tsx` の既存 trap ケース（`primitives.component.spec.tsx`）は内部 refactor 後も無改修 green を回帰確認する（Phase 4.1.1）。

## 6.2a `useFocusTrap.spec.tsx` 骨子（擬似・trap の真実）

```tsx
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { useRef } from "react";
import { vi } from "vitest";
import { useFocusTrap } from "../useFocusTrap";

function Harness({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, onClose, ref);
  if (!open) return null;
  return (
    <div ref={ref}>
      <a href="/a">first</a>
      <a href="/b">last</a>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("focuses first focusable on open (AC-E6)", () => {
    const { getByText } = render(<Harness open onClose={vi.fn()} />);
    expect(document.activeElement).toBe(getByText("first"));
  });

  it("Tab loops last→first, Shift+Tab loops first→last (AC-E6)", () => {
    const { getByText } = render(<Harness open onClose={vi.fn()} />);
    getByText("last").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(getByText("first"));
    getByText("first").focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(getByText("last"));
  });

  it("Escape calls onClose (AC-E4)", () => {
    const onClose = vi.fn();
    render(<Harness open onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no-op when focusables empty / SSR (browserDocument undefined)", () => {
    // browserDocument を undefined に spy して effect 全体 no-op を確認
  });

  it("restores previous focus on close", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const { rerender } = render(<Harness open onClose={vi.fn()} />);
    rerender(<Harness open={false} onClose={vi.fn()} />);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
```

> `SidebarDrawer.spec`（6.3）の Tab ループ / previousFocus ケースは本 hook spec が正本。SidebarDrawer 側ではそれらを再掲せず、初期 focus と Esc の結線 smoke のみ残す。

## 6.2 `SidebarMobileTrigger.spec.tsx` 骨子（擬似）

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { SidebarMobileTrigger } from "../SidebarMobileTrigger";

const setDrawerOpen = vi.fn();
vi.mock("../SidebarShellContext", () => ({
  useSidebarShellContext: () => ({
    mode: "expanded",
    drawerOpen: false,
    toggleCollapsed: vi.fn(),
    setDrawerOpen,
  }),
}));

describe("SidebarMobileTrigger", () => {
  beforeEach(() => setDrawerOpen.mockClear());

  it("does not call setDrawerOpen on render", () => {
    render(<SidebarMobileTrigger />);
    expect(setDrawerOpen).not.toHaveBeenCalled();
  });

  it("calls setDrawerOpen(true) once on click (AC-E2)", () => {
    render(<SidebarMobileTrigger />);
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    expect(setDrawerOpen).toHaveBeenCalledTimes(1);
    expect(setDrawerOpen).toHaveBeenCalledWith(true);
  });

  it("is hidden from md+ and exposes dialog popup semantics (AC-E1)", () => {
    render(<SidebarMobileTrigger />);
    const btn = screen.getByRole("button", { name: "メニューを開く" });
    expect(btn.className).toContain("md:hidden");
    expect(btn).toHaveAttribute("aria-haspopup", "dialog");
  });
});
```

## 6.3 `SidebarDrawer.spec.tsx` 骨子（擬似）

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { SidebarDrawer } from "../SidebarDrawer";

function renderDrawer(open: boolean, onClose = vi.fn()) {
  const utils = render(
    <SidebarDrawer open={open} onClose={onClose}>
      <a href="/admin">最初のリンク</a>
      <a href="/profile">2 番目</a>
    </SidebarDrawer>,
  );
  return { ...utils, onClose };
}

describe("SidebarDrawer", () => {
  afterEach(() => document.body.removeAttribute("data-shell-drawer-open"));

  it("renders null when closed (AC-E11)", () => {
    const { container } = renderDrawer(false);
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog with modal semantics when open (AC-E3)", () => {
    renderDrawer(true);
    const dialog = screen.getByRole("dialog", { name: "サイドバーメニュー" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("wrapper carries md:hidden (AC-E11)", () => {
    const { container } = renderDrawer(true);
    expect((container.firstChild as HTMLElement).className).toContain("md:hidden");
  });

  it("closes on Escape (AC-E4)", () => {
    const { onClose } = renderDrawer(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on backdrop click but not panel click (AC-E4 / R-E5)", () => {
    const { onClose } = renderDrawer(true);
    const dialog = screen.getByRole("dialog");
    // backdrop は aria-hidden の兄弟 div
    const backdrop = dialog.parentElement!.querySelector('[aria-hidden="true"]')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1); // panel click では増えない
  });

  it("moves initial focus to first focusable — hook 結線 smoke (AC-E6)", () => {
    renderDrawer(true);
    expect(document.activeElement).toBe(
      screen.getByRole("link", { name: "最初のリンク" }),
    );
  });

  // NOTE: Tab 両境界ループ / previousFocus 復帰の詳細 branch は useFocusTrap.spec（6.2a）が正本。
  //       ここでは初期 focus と Esc の hook 結線 smoke のみ残し、再掲しない（テスト重複回避）。

  it("sets and clears body data-shell-drawer-open (AC-E5)", () => {
    const { rerender, onClose } = renderDrawer(true);
    expect(document.body.getAttribute("data-shell-drawer-open")).toBe("true");
    rerender(
      <SidebarDrawer open={false} onClose={onClose}>
        <a href="/admin">最初のリンク</a>
      </SidebarDrawer>,
    );
    expect(document.body.hasAttribute("data-shell-drawer-open")).toBe(false);
  });

  // previousFocus 復帰は useFocusTrap.spec（6.2a）が正本のためここでは再掲しない。
});
```

### route auto-close（AC-E7 / AC-E8）

`SidebarDrawer` 自体は `open` prop 駆動のため、route auto-close は「`usePathname` 変化が `useSidebarState` 経由で `drawerOpen` を false にし、その結果 drawer が unmount される」連鎖で carve する。
本 spec では `SidebarShell`（context provider 付き）を render し、`next/navigation` の `usePathname` mock 戻り値を切り替えて rerender、drawer の unmount を assert する形を採る。`SidebarShell.spec.tsx`（6.5）側に置いても良い。

```tsx
let mockPath = "/admin";
vi.mock("next/navigation", () => ({ usePathname: () => mockPath }));
// ... provider 付きで drawer open 状態を作る → mockPath = "/admin/members" → rerender
// → drawer (role="dialog") が消えることを assert（AC-E7 / AC-E8）
```

## 6.4 `useSidebarState.spec.tsx` 追記骨子（AC-E9 / AC-E10・Task A 所有へ append）

Task A の既存 it を変更せず、以下 describe を **追記** する。

```tsx
import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("useSidebarState 初期 collapsed 判定 (Task E)", () => {
  beforeEach(() => localStorage.removeItem("ubm:shell:collapsed"));

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

  it("localStorage 既存値が viewport 既定より優先 (AC-E9)", () => {
    localStorage.setItem("ubm:shell:collapsed", "false"); // = expanded 永続
    mockMatchMedia(false); // viewport は collapsed を示唆
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded"); // localStorage 優先
  });

  it("matchMedia 未提供（SSR 相当）で no-op・expanded fallback (AC-E10)", () => {
    // @ts-expect-error window.matchMedia を一時的に未定義化
    delete window.matchMedia;
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.mode).toBe("expanded");
  });
});
```

> `matchMedia` の呼出回数が 1 回限りであること（AC-E10）は `window.matchMedia` を `vi.fn()` 化し、rerender なしの初回マウント後に `toHaveBeenCalledTimes(1)` で補強できる。resize listener 不在は `addEventListener` mock が呼ばれないことで確認する。

## 6.5 `SidebarShell.spec.tsx` 追記骨子（AC-E1 / AC-E11・Task A 所有へ append）

```tsx
describe("SidebarShell responsive (Task E)", () => {
  it("<aside> is hidden on sm and flex on md+ (AC-E1)", () => {
    const { container } = render(/* provider 付き SidebarShell */);
    const aside = container.querySelector("aside")!;
    expect(aside.className).toContain("hidden");
    expect(aside.className).toContain("md:flex");
  });

  it("renders no duplicate fixed id between aside and drawer tree (R-E2)", () => {
    // drawer open 状態で同一固定 id が 2 個出ないことを assert（id 重複 0）
  });
});
```

## 6.6 既存 spec の touch

- `useSidebarState.spec.tsx` / `SidebarShell.spec.tsx` は **追記のみ**（Task A 既存 it を変更しない・Phase 4.5）。
- panel spec / e2e / Playwright（Task F）には触らない。
