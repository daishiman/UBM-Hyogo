// unified-sidebar-shell / Task D: admin layout の責務は guard + SidebarShellServer 呼び出しのみ。
// role 判定 / nav / schemaDiff badge は src/components/shell の spec で検証する。
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("../../src/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("../../src/components/shell/SidebarShell.server", () => ({
  SidebarShellServer: ({ children }: { children: ReactNode }) => (
    <div data-testid="shell-server-stub">{children}</div>
  ),
}));
vi.mock("../../src/components/shell/SidebarMobileTrigger", () => ({
  SidebarMobileTrigger: () => <button type="button" data-testid="mobile-trigger" />,
}));

const headerStore = { get: vi.fn() };
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => headerStore),
}));

import AdminLayout from "./layout";
import { getSession } from "../../src/lib/session";
import { redirect } from "next/navigation";

afterEach(() => cleanup());
beforeEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(redirect).mockClear();
  headerStore.get.mockReset();
  headerStore.get.mockReturnValue(null);
});

describe("AdminLayout", () => {
  it("未認証 (session=null) は /login?next=/admin へ redirect", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(AdminLayout({ children: <p>x</p> })).rejects.toThrow(
      "REDIRECT:/login?next=/admin",
    );
    expect(redirect).toHaveBeenCalledWith("/login?next=/admin");
  });

  it("non-admin (isAdmin=false) は /login?gate=forbidden へ redirect", async () => {
    vi.mocked(getSession).mockResolvedValue({ memberId: "m1", email: "a@b", isAdmin: false });
    await expect(AdminLayout({ children: <p>x</p> })).rejects.toThrow(
      "REDIRECT:/login?gate=forbidden",
    );
    expect(redirect).toHaveBeenCalledWith("/login?gate=forbidden");
  });

  it("admin session: cool theme / route-group=admin / shell-mode=sidebar の wrapper + children", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "admin@example.com",
      name: "管理太郎",
      isAdmin: true,
    });
    const tree = await AdminLayout({ children: <p data-testid="child">child</p> });
    const { container } = render(tree);

    const wrapper = container.querySelector('[data-route-group="admin"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("data-theme")).toBe("cool");
    expect(wrapper?.getAttribute("data-shell-mode")).toBe("sidebar");
    expect(screen.getByTestId("shell-server-stub")).toBeTruthy();
    expect(screen.getByTestId("child")).toBeTruthy();
    // 旧 AdminTopbar の固定文字列 / breadcrumb slot は存在しない
    expect(container.querySelector('[data-component="admin-breadcrumb-slot"]')).toBeNull();
    expect(container.querySelector('[data-shell="topbar"]')).toBeNull();
  });
});
