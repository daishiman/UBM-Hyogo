import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarDrawer } from "../SidebarDrawer";

afterEach(() => {
  cleanup();
  delete document.body.dataset.shellDrawerOpen;
});

describe("SidebarDrawer", () => {
  it("renders dialog attributes and moves initial focus when open", () => {
    render(
      <SidebarDrawer open onClose={vi.fn()}>
        <button type="button">first action</button>
      </SidebarDrawer>,
    );

    const dialog = screen.getByRole("dialog", { name: "サイドバー" });
    expect(dialog.getAttribute("id")).toBe("shell-drawer");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement?.textContent).toBe("first action");
    expect(document.body.dataset.shellDrawerOpen).toBe("true");
  });

  it("does not render while closed", () => {
    render(
      <SidebarDrawer open={false} onClose={vi.fn()}>
        <button type="button">first action</button>
      </SidebarDrawer>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape and backdrop click", () => {
    const onClose = vi.fn();
    render(
      <SidebarDrawer open onClose={onClose}>
        <button type="button">first action</button>
      </SidebarDrawer>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "サイドバーを閉じる" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("traps Tab focus within the drawer", () => {
    render(
      <SidebarDrawer open onClose={vi.fn()}>
        <button type="button">first action</button>
        <button type="button">last action</button>
      </SidebarDrawer>,
    );

    const dialog = screen.getByRole("dialog", { name: "サイドバー" });
    const first = screen.getByRole("button", { name: "first action" });
    const last = screen.getByRole("button", { name: "last action" });

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
