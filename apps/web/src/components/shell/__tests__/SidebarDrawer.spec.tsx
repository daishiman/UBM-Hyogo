// Task E — SidebarDrawer の spec。open 表示 / Esc / backdrop click で close。
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

import { SidebarDrawer } from "../SidebarDrawer";

afterEach(() => {
  cleanup();
  document.body.removeAttribute("data-shell-drawer-open");
});

describe("SidebarDrawer", () => {
  it("open=false では何も render しない", () => {
    const { container } = render(
      <SidebarDrawer open={false} onClose={vi.fn()}>
        <a href="/x">link</a>
      </SidebarDrawer>,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("open=true で role=dialog / aria-modal を持つ panel を表示", () => {
    const { container } = render(
      <SidebarDrawer open onClose={vi.fn()}>
        <a href="/x">link</a>
      </SidebarDrawer>,
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(document.body.getAttribute("data-shell-drawer-open")).toBe("true");
  });

  it("Esc キーで onClose が呼ばれる", () => {
    const onClose = vi.fn();
    render(
      <SidebarDrawer open onClose={onClose}>
        <a href="/x">link</a>
      </SidebarDrawer>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("backdrop クリックで onClose が呼ばれる", () => {
    const onClose = vi.fn();
    const { getByRole } = render(
      <SidebarDrawer open onClose={onClose}>
        <a href="/x">link</a>
      </SidebarDrawer>,
    );
    fireEvent.click(getByRole("button", { name: "メニューを閉じる" }));
    expect(onClose).toHaveBeenCalled();
  });
});
