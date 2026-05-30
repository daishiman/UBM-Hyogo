// task-c-public-member-sidebar-shell-integration: Member layout の shell mount 配線 spec。
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

import MemberLayout from "./layout";

afterEach(() => cleanup());
beforeEach(() => {
  headerStore.get.mockReset();
  headerStore.get.mockReturnValue(null);
});

async function renderLayout() {
  return render(
    await MemberLayout({ children: <p data-testid="child">child</p> }),
  );
}

describe("MemberLayout (sidebar shell 統合)", () => {
  it("M-1: SidebarShell が mount される", async () => {
    const { container } = await renderLayout();
    expect(container.querySelector('[data-testid="sidebar-shell-stub"]')).not.toBeNull();
  });

  it("M-2/M-3: wrapper が data-shell-mode=sidebar / data-route-group=member / data-theme=warm を持つ", async () => {
    const { container } = await renderLayout();
    const shell = container.querySelector('[data-testid="member-shell"]');
    expect(shell?.getAttribute("data-shell-mode")).toBe("sidebar");
    expect(shell?.getAttribute("data-route-group")).toBe("member");
    expect(shell?.getAttribute("data-theme")).toBe("warm");
  });

  it("M-4: children が shell 配下に render される", async () => {
    const { container } = await renderLayout();
    const stub = container.querySelector('[data-testid="sidebar-shell-stub"]');
    expect(stub?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("M-5: 旧 topbar header が DOM に出ない", async () => {
    const { container } = await renderLayout();
    expect(container.querySelector('[data-shell="topbar"]')).toBeNull();
    expect(container.querySelector('[data-testid="member-header"]')).toBeNull();
  });

  it("M-6: x-pathname が無ければ activePath は '/profile' fallback", async () => {
    headerStore.get.mockReturnValue(null);
    const { container } = await renderLayout();
    expect(container.querySelector('[data-active-path="/profile"]')).not.toBeNull();
  });

  it("M-7: mobileTriggerSlot が渡る", async () => {
    const { container } = await renderLayout();
    const slot = container.querySelector('[data-testid="mobile-trigger-slot"]');
    expect(slot?.querySelector('[data-testid="mobile-trigger-stub"]')).not.toBeNull();
  });

  it("M-8: async layout を await で render しても throw しない", async () => {
    await expect(renderLayout()).resolves.toBeTruthy();
  });

  it("M-9: axe critical 違反 0", async () => {
    const { container } = await renderLayout();
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
