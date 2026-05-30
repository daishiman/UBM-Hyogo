// unified-sidebar-shell / Task C: 公開 layout は SidebarShellServer へ委譲する。
// SidebarShellServer 自体（role 判定 / nav）は src/components/shell の spec で検証するため、
// ここでは layout の wrapper 契約（theme / route-group / shell-mode / footer / children）を見る。
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("../../src/components/shell/SidebarShell.server", () => ({
  SidebarShellServer: ({ children }: { children: ReactNode }) => (
    <div data-testid="shell-server-stub">{children}</div>
  ),
}));
vi.mock("../../src/components/shell/SidebarMobileTrigger", () => ({
  SidebarMobileTrigger: () => <button type="button" data-testid="mobile-trigger" />,
}));

import PublicLayout from "./layout";

afterEach(() => cleanup());

describe("PublicLayout", () => {
  it("wrapper に data-theme='warm' / data-route-group='public' / data-shell-mode='sidebar' を付与する", async () => {
    const tree = await PublicLayout({ children: <p data-testid="child">child</p> });
    const { container } = render(tree);
    const wrapper = container.querySelector('[data-route-group="public"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("data-theme")).toBe("warm");
    expect(wrapper?.getAttribute("data-shell-mode")).toBe("sidebar");
  });

  it("SidebarShellServer 経由で children と PublicFooter を描画する", async () => {
    const tree = await PublicLayout({ children: <p data-testid="child">child</p> });
    render(tree);
    expect(screen.getByTestId("shell-server-stub")).toBeTruthy();
    expect(screen.getByTestId("child")).toBeTruthy();
    // PublicFooter は footer landmark を持つ
    expect(document.querySelector("footer")).not.toBeNull();
  });
});
