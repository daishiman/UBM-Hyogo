// unified-sidebar-shell / Task C: 会員 layout は SidebarShellServer へ委譲する。
// SidebarShellServer 自体（role 判定 / nav）は src/components/shell の spec で検証するため、
// ここでは layout の wrapper 契約（theme / route-group / shell-mode / children）を見る。
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { axe } from "../../src/test/axe";

vi.mock("../../src/components/shell/SidebarShell.server", () => ({
  SidebarShellServer: ({ children }: { children: ReactNode }) => (
    <div data-testid="shell-server-stub">{children}</div>
  ),
}));
vi.mock("../../src/components/shell/SidebarMobileTrigger", () => ({
  SidebarMobileTrigger: () => <button type="button" data-testid="mobile-trigger" />,
}));

import MemberLayout from "./layout";

afterEach(() => cleanup());

describe("MemberLayout", () => {
  it("wrapper に data-theme='warm' / data-route-group='member' / data-shell-mode='sidebar' を付与する", async () => {
    const tree = await MemberLayout({ children: <p data-testid="child">child</p> });
    const { container } = render(tree);
    const wrapper = container.querySelector('[data-route-group="member"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("data-theme")).toBe("warm");
    expect(wrapper?.getAttribute("data-shell-mode")).toBe("sidebar");
  });

  it("SidebarShellServer 経由で children を data-route='member' 内に描画する", async () => {
    const tree = await MemberLayout({ children: <p data-testid="child">child</p> });
    render(tree);
    expect(screen.getByTestId("shell-server-stub")).toBeTruthy();
    const region = document.querySelector('[data-route="member"]');
    expect(region).not.toBeNull();
    expect(region?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("axe critical 違反 0", async () => {
    const tree = await MemberLayout({ children: <p>child</p> });
    const { container } = render(tree);
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
