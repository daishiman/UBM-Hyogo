// SidebarShellServer は async Server Component。await して得た tree を render し、
// role 判定 + schemaDiffCount 統合（TC-04/05/06 相当）を end-to-end に検証する。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/admin") }));
vi.mock("../../../lib/session", () => ({ getSession: vi.fn() }));
vi.mock("../../../lib/admin/safe-server-fetch", () => ({ safeServerFetch: vi.fn() }));

import { SidebarShellServer } from "../SidebarShell.server";
import { getSession } from "../../../lib/session";
import { safeServerFetch } from "../../../lib/admin/safe-server-fetch";

const ADMIN = { memberId: "m1", email: "admin@example.com", name: "管理太郎", isAdmin: true as const };

afterEach(() => cleanup());
beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(getSession).mockReset();
  vi.mocked(safeServerFetch).mockReset();
  vi.mocked(safeServerFetch).mockResolvedValue({ ok: true, data: { total: 0, items: [] } });
});

async function renderServer() {
  const tree = await SidebarShellServer({
    activePath: "/admin",
    mobileTriggerSlot: <button type="button">trigger</button>,
    children: <main data-route="admin">child</main>,
  });
  return render(tree);
}

describe("SidebarShellServer", () => {
  it("admin session で全 14 nav item を描画する（TC-04 相当）", async () => {
    vi.mocked(getSession).mockResolvedValue(ADMIN);
    const { container } = await renderServer();
    expect(container.querySelectorAll('[data-shell-block="nav-item"]')).toHaveLength(14);
  });

  it("schemaDiffCount は queued のみカウントされ schema link に badge 2 が出る（TC-05）", async () => {
    vi.mocked(getSession).mockResolvedValue(ADMIN);
    vi.mocked(safeServerFetch).mockResolvedValue({
      ok: true,
      data: {
        total: 3,
        items: [{ status: "queued" }, { status: "queued" }, { status: "resolved" }] as never,
      },
    });
    const { container } = await renderServer();
    expect(container.querySelector('a[href="/admin/schema"]')?.textContent).toContain("2");
  });

  it("safeServerFetch 失敗時は schema link に数字が出ない（TC-06）", async () => {
    vi.mocked(getSession).mockResolvedValue(ADMIN);
    vi.mocked(safeServerFetch).mockResolvedValue({
      ok: false,
      error: { code: "ADMIN_FETCH_FAILED", message: "boom" },
    });
    const { container } = await renderServer();
    expect(container.querySelector('a[href="/admin/schema"]')?.textContent).not.toMatch(/\d/);
  });

  it("session=null は viewer にフォールバックし public 3 item のみ", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const { container } = await renderServer();
    expect(container.querySelectorAll('[data-shell-block="nav-item"]')).toHaveLength(3);
  });
});
