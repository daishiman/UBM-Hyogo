import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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

afterEach(() => {
  cleanup();
  document.body.removeAttribute("data-shell-drawer-open");
});

describe("SidebarDrawer", () => {
  it("open=false で null（unmount）(AC-E11)", () => {
    const { container } = renderDrawer(false);
    expect(container.firstChild).toBeNull();
  });

  it("open=true で dialog modal semantics を持つ (AC-E3)", () => {
    renderDrawer(true);
    const dialog = screen.getByRole("dialog", { name: "サイドバーメニュー" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("wrapper が md:hidden を持つ (AC-E11)", () => {
    const { container } = renderDrawer(true);
    expect((container.firstChild as HTMLElement).className).toContain("md:hidden");
  });

  it("Escape で onClose が呼ばれる — hook 結線 smoke (AC-E4)", () => {
    const { onClose } = renderDrawer(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("backdrop click で onClose、panel click では非発火 (AC-E4 / R-E5)", () => {
    const { onClose } = renderDrawer(true);
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement!.querySelector('[aria-hidden="true"]')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1); // panel click では増えない
  });

  it("open で初期 focus が drawer 内最初の focusable へ — hook 結線 smoke (AC-E6)", () => {
    renderDrawer(true);
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "最初のリンク" }));
  });

  it("open で body[data-shell-drawer-open]=true、close で除去 (AC-E5)", () => {
    const { rerender, onClose } = renderDrawer(true);
    expect(document.body.getAttribute("data-shell-drawer-open")).toBe("true");
    rerender(
      <SidebarDrawer open={false} onClose={onClose}>
        <a href="/admin">最初のリンク</a>
      </SidebarDrawer>,
    );
    expect(document.body.hasAttribute("data-shell-drawer-open")).toBe(false);
  });
});
