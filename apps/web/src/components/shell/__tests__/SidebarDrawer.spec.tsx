import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { SidebarDrawer } from "../SidebarDrawer";

afterEach(() => {
  cleanup();
  document.body.removeAttribute("data-shell-drawer-open");
});

describe("SidebarDrawer", () => {
  it("open=false では何も描画しない", () => {
    render(
      <SidebarDrawer open={false} onClose={vi.fn()}>
        <a href="/x">link</a>
      </SidebarDrawer>,
    );
    expect(screen.queryByTestId("shell-drawer")).toBeNull();
  });

  it("open=true で role=dialog / aria-modal を描画し body に scroll-lock 属性を付ける", () => {
    render(
      <SidebarDrawer open onClose={vi.fn()}>
        <a href="/x">link</a>
      </SidebarDrawer>,
    );
    const drawer = screen.getByTestId("shell-drawer");
    expect(drawer.getAttribute("role")).toBe("dialog");
    expect(drawer.getAttribute("aria-modal")).toBe("true");
    expect(document.body.getAttribute("data-shell-drawer-open")).toBe("true");
  });

  it("backdrop クリックで onClose", () => {
    const onClose = vi.fn();
    render(
      <SidebarDrawer open onClose={onClose}>
        <a href="/x">link</a>
      </SidebarDrawer>,
    );
    fireEvent.click(screen.getByLabelText("メニューを閉じる", { selector: '[data-shell-block="drawer-backdrop"]' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Esc キーで onClose", () => {
    const onClose = vi.fn();
    render(
      <SidebarDrawer open onClose={onClose}>
        <a href="/x">link</a>
      </SidebarDrawer>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
