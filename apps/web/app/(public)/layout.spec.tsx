// task-c-public-member-sidebar-shell-integration: Public layout の shell mount 配線 spec。
// shell / mobileTrigger / next/headers をスタブ化し、Task C の配線責務だけを検証する。
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { axe } from "../../src/test/axe";

vi.mock("../../src/components/shell/SidebarShell.server", () => ({
  SidebarShellServer: ({
    activePath,
    children,
    mobileTriggerSlot,
  }: {
    activePath: string;
    children: ReactNode;
    mobileTriggerSlot: ReactNode;
  }) => (
    <div data-testid="sidebar-shell-stub" data-active-path={activePath}>
      <div data-testid="mobile-trigger-slot">{mobileTriggerSlot}</div>
      {children}
    </div>
  ),
}));

vi.mock("../../src/components/shell/SidebarMobileTrigger", () => ({
  SidebarMobileTrigger: () => (
    <button data-testid="mobile-trigger-stub" aria-label="メニューを開く" />
  ),
}));

const headerStore = { get: vi.fn() };
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => headerStore),
}));

import PublicLayout from "./layout";

afterEach(() => cleanup());
beforeEach(() => {
  headerStore.get.mockReset();
  headerStore.get.mockReturnValue(null);
});

async function renderLayout() {
  return render(
    await PublicLayout({ children: <p data-testid="child">child</p> }),
  );
}

describe("PublicLayout (sidebar shell 統合)", () => {
  it("P-1: SidebarShell が mount される", async () => {
    const { container } = await renderLayout();
    expect(container.querySelector('[data-testid="sidebar-shell-stub"]')).not.toBeNull();
  });

  it("P-2/P-3: wrapper が data-shell-mode=sidebar / data-route-group=public / data-theme=warm を持つ", async () => {
    const { container } = await renderLayout();
    const shell = container.querySelector('[data-testid="public-shell"]');
    expect(shell?.getAttribute("data-shell-mode")).toBe("sidebar");
    expect(shell?.getAttribute("data-route-group")).toBe("public");
    expect(shell?.getAttribute("data-theme")).toBe("warm");
  });

  it("P-4: children が shell 配下に render される", async () => {
    const { container } = await renderLayout();
    const stub = container.querySelector('[data-testid="sidebar-shell-stub"]');
    expect(stub?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("P-5: PublicFooter が shell 配下に存在する", async () => {
    const { container } = await renderLayout();
    const stub = container.querySelector('[data-testid="sidebar-shell-stub"]');
    expect(stub?.querySelector('[data-component="public-footer"]')).not.toBeNull();
  });

  it("P-6: 旧 topbar header が DOM に出ない", async () => {
    const { container } = await renderLayout();
    expect(container.querySelector('[data-shell="topbar"]')).toBeNull();
    expect(container.querySelector('[data-component="public-header"]')).toBeNull();
  });

  it("P-7: x-pathname があれば activePath として渡る", async () => {
    headerStore.get.mockReturnValue("/members");
    const { container } = await renderLayout();
    expect(
      container.querySelector('[data-active-path="/members"]'),
    ).not.toBeNull();
  });

  it("P-8: x-pathname が無ければ activePath は '/' fallback", async () => {
    headerStore.get.mockReturnValue(null);
    const { container } = await renderLayout();
    expect(container.querySelector('[data-active-path="/"]')).not.toBeNull();
  });

  it("P-9: mobileTriggerSlot が渡る", async () => {
    const { container } = await renderLayout();
    const slot = container.querySelector('[data-testid="mobile-trigger-slot"]');
    expect(slot?.querySelector('[data-testid="mobile-trigger-stub"]')).not.toBeNull();
  });

  it("P-10: async layout を await で render しても throw しない", async () => {
    await expect(renderLayout()).resolves.toBeTruthy();
  });

  it("P-11: axe critical 違反 0", async () => {
    const { container } = await renderLayout();
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
