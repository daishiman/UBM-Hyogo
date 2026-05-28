// admin-shell-topbar-sidebar-integration: layout spec.
// AC-1: 固定文字列「管理」と admin-breadcrumb-slot / 空 admin-topbar-actions が消えていること
// AC-4: server boundary で schemaDiffCount が AdminSidebar に注入されること
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
vi.mock("../../src/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("../../src/lib/admin/safe-server-fetch", () => ({
  safeServerFetch: vi.fn(),
}));

import AdminLayout from "./layout";
import { getSession } from "../../src/lib/session";
import { redirect } from "next/navigation";
import { safeServerFetch } from "../../src/lib/admin/safe-server-fetch";

afterEach(() => cleanup());
beforeEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(redirect).mockClear();
  vi.mocked(safeServerFetch).mockReset();
  vi.mocked(safeServerFetch).mockResolvedValue({
    ok: true,
    data: { total: 0, items: [] },
  });
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

  it("admin session: shell DOM contract — topbar slot / 固定『管理』が消えている (AC-1)", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "admin@example.com",
      name: "管理太郎",
      isAdmin: true,
    });
    const tree = await AdminLayout({ children: <p data-testid="child">child</p> });
    const { container } = render(tree);

    const shell = container.querySelector('[data-testid="admin-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute("data-theme")).toBe("cool");
    expect(shell?.getAttribute("data-route-group")).toBe("admin");
    expect(shell?.getAttribute("data-shell-mode")).toBe("sidebar");

    expect(container.querySelector('[data-shell="sidebar"]')).not.toBeNull();
    expect(container.querySelector('[data-shell="sidebar"]')?.className).toContain("hidden");
    expect(container.querySelector('[data-shell="sidebar"]')?.className).toContain("md:block");
    expect(container.querySelector('[data-shell="topbar"]')).toBeNull();
    expect(container.querySelector('[data-component="admin-breadcrumb-slot"]')).toBeNull();
    expect(container.querySelector('[data-component="admin-topbar-actions"]')).toBeNull();

    const main = container.querySelector('main[data-route="admin"]');
    expect(main).not.toBeNull();
    expect(main?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("layout は単独『管理』テキストを含まない (AC-1 grep gate 等価)", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "admin@example.com",
      name: "管理太郎",
      isAdmin: true,
    });
    const tree = await AdminLayout({ children: <p>x</p> });
    const { container } = render(tree);
    const standalone = Array.from(container.querySelectorAll("*"))
      .filter((el) => el.children.length === 0)
      .map((el) => el.textContent?.trim())
      .filter((t) => t === "管理");
    expect(standalone).toEqual([]);
  });

  it("safeServerFetch 失敗時も layout は render 成功し badge は表示されない", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "admin@example.com",
      isAdmin: true,
    });
    vi.mocked(safeServerFetch).mockResolvedValue({
      ok: false,
      error: { code: "ADMIN_FETCH_FAILED", message: "boom" },
    });
    const tree = await AdminLayout({ children: <p>x</p> });
    const { container } = render(tree);
    const schemaLink = container.querySelector('a[href="/admin/schema"]');
    expect(schemaLink).not.toBeNull();
    expect(schemaLink?.textContent).not.toMatch(/\d/);
  });

  it("schemaDiffCount は queued status のみカウントされ Chip が描画される", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "admin@example.com",
      isAdmin: true,
    });
    vi.mocked(safeServerFetch).mockResolvedValue({
      ok: true,
      data: {
        total: 3,
        items: [
          { status: "queued" },
          { status: "queued" },
          { status: "resolved" },
        ] as never,
      },
    });
    const tree = await AdminLayout({ children: <p>x</p> });
    const { container } = render(tree);
    const schemaLink = container.querySelector('a[href="/admin/schema"]');
    expect(schemaLink?.textContent).toContain("2");
  });

  it("admin session render で axe critical 違反 0", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "admin@example.com",
      name: "管理太郎",
      isAdmin: true,
    });
    const tree = await AdminLayout({ children: <p>child</p> });
    const { container } = render(tree);
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
