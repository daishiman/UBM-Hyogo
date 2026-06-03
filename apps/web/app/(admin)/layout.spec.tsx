// admin-layout-sidebar-shell-migration: layout spec（SidebarShellServer 移行後）。
// 方針 B（隔離寄り）: SidebarShellServer を軽量 stub にし、layout 自身の責務
//（auth guard + admin shell DOM contract + shell へ children を渡す）のみを検証する。
// nav 13 item / schemaDiff badge の end-to-end 検証は Task A 側 spec
//（src/components/shell/__tests__/SidebarShell*.spec.tsx・shell-config.spec.ts・
//   schema-diff-count.spec.ts）へ委譲する（phase-4.md mock 方針 B / TC-04..06 移譲）。
import type { ReactNode } from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { axe } from "../../src/test/axe";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  usePathname: vi.fn(() => "/admin"),
}));
const headerStore = { get: vi.fn(() => "/admin/members") };
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => headerStore),
}));
vi.mock("../../src/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("../../src/components/shell/SidebarShell.server", () => ({
  // dev #1028 で SidebarShell が semantic <main data-route=routeKey> を内部描画する統一版へ昇格。
  // layout は自前 <main> を持たず routeKey/sectionRhythm を shell へ渡すため、stub で受領 props を観測する。
  SidebarShellServer: ({
    children,
    activePath,
    routeKey,
    sectionRhythm,
  }: {
    readonly children: ReactNode;
    readonly activePath?: string;
    readonly routeKey?: string;
    readonly sectionRhythm?: string;
  }) => (
    <div
      data-testid="sidebar-shell-stub"
      data-active-path={activePath}
      data-route-key={routeKey}
      data-section-rhythm={sectionRhythm}
    >
      {children}
    </div>
  ),
}));

import AdminLayout from "./layout";
import { getSession } from "../../src/lib/session";
import { redirect } from "next/navigation";

const adminSession = {
  memberId: "m1",
  email: "admin@example.com",
  name: "管理太郎",
  isAdmin: true as const,
};

afterEach(() => cleanup());
beforeEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(redirect).mockClear();
  headerStore.get.mockReset();
  headerStore.get.mockReturnValue("/admin/members");
});

describe("AdminLayout", () => {
  // TC-01 (AC-3): 既存契約維持
  it("未認証 (session=null) は /login?next=/admin へ redirect", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(AdminLayout({ children: <p>x</p> })).rejects.toThrow(
      "REDIRECT:/login?next=/admin",
    );
    expect(redirect).toHaveBeenCalledWith("/login?next=/admin");
  });

  // TC-02 (AC-4): fail-closed
  it("non-admin (isAdmin=false) は /login?gate=forbidden へ redirect", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "a@b",
      isAdmin: false,
    });
    await expect(AdminLayout({ children: <p>x</p> })).rejects.toThrow(
      "REDIRECT:/login?gate=forbidden",
    );
    expect(redirect).toHaveBeenCalledWith("/login?gate=forbidden");
  });

  // TC-03 (AC-5/AC-7): SidebarShell が mount され admin shell DOM contract を維持する
  it("admin session: SidebarShell が描画され admin shell DOM contract を維持する", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    const tree = await AdminLayout({ children: <p data-testid="child">child</p> });
    const { container } = render(tree);

    const shell = container.querySelector('[data-testid="admin-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute("data-theme")).toBe("cool");
    expect(shell?.getAttribute("data-route-group")).toBe("admin");
    expect(shell?.getAttribute("data-shell-mode")).toBe("sidebar");

    // shell が mount されている
    expect(container.querySelector('[data-testid="sidebar-shell-stub"]')).not.toBeNull();

    // 旧 topbar slot 系の DOM contract は撤去済み（shell 内部構造へ移譲）
    expect(container.querySelector('[data-shell="topbar"]')).toBeNull();
    expect(container.querySelector('[data-component="admin-breadcrumb-slot"]')).toBeNull();
    expect(container.querySelector('[data-component="admin-topbar-actions"]')).toBeNull();

    // dev #1028 で semantic <main data-route="admin"> 描画は SidebarShell 側責務へ移譲。
    // layout は routeKey="admin" / sectionRhythm="compact" を shell へ渡し、children を内包する。
    // （main[data-route] の end-to-end 検証は Task A 側 SidebarShell*.spec へ委譲）
    const stub = container.querySelector('[data-testid="sidebar-shell-stub"]');
    expect(stub?.getAttribute("data-route-key")).toBe("admin");
    expect(stub?.getAttribute("data-section-rhythm")).toBe("compact");
    expect(stub?.getAttribute("data-active-path")).toBe("/admin/members");
    expect(stub?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  // TC-07 (AC-7 回帰): layout 直下に裸の「管理」文字列を出さない
  it("layout は単独『管理』テキストを含まない", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    const tree = await AdminLayout({ children: <p>x</p> });
    const { container } = render(tree);
    const standalone = Array.from(container.querySelectorAll("*"))
      .filter((el) => el.children.length === 0)
      .map((el) => el.textContent?.trim())
      .filter((t) => t === "管理");
    expect(standalone).toEqual([]);
  });

  // TC-08 (AC-7 回帰): axe critical 0
  it("admin session render で axe critical 違反 0", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    const tree = await AdminLayout({ children: <p>child</p> });
    const { container } = render(tree);
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
