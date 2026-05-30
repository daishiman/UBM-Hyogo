import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/admin") }));
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("../../../lib/session", () => ({ getSession: vi.fn() }));
vi.mock("../../../lib/admin/safe-server-fetch", () => ({ safeServerFetch: vi.fn() }));

import { usePathname } from "next/navigation";
import { getSession } from "../../../lib/session";
import { safeServerFetch } from "../../../lib/admin/safe-server-fetch";
import { SidebarShellServer } from "../SidebarShell.server";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/admin");
  vi.mocked(getSession).mockReset();
  vi.mocked(safeServerFetch).mockReset();
  vi.mocked(safeServerFetch).mockResolvedValue({ ok: true, data: { total: 0, items: [] } } as never);
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
});

async function renderServer() {
  const tree = await SidebarShellServer({
    mobileTriggerSlot: <button type="button" data-testid="mobile-trigger" />,
    children: <p data-testid="child">child</p>,
  });
  return render(tree);
}

describe("SidebarShellServer", () => {
  it("session=null は viewer（PUBLIC のみ 3 nav）として描画", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await renderServer();
    expect(within(screen.getByTestId("shell-nav")).getAllByRole("link")).toHaveLength(3);
    expect(screen.getByTestId("app-shell").getAttribute("data-role")).toBe("viewer");
  });

  it("getSession throw 時も viewer に fail-closed する", async () => {
    vi.mocked(getSession).mockRejectedValue(new Error("boom"));
    await renderServer();
    expect(screen.getByTestId("app-shell").getAttribute("data-role")).toBe("viewer");
  });

  it("member は 4 nav", async () => {
    vi.mocked(getSession).mockResolvedValue({ memberId: "m1", email: "m@x", isAdmin: false });
    await renderServer();
    expect(within(screen.getByTestId("shell-nav")).getAllByRole("link")).toHaveLength(4);
  });

  it("admin は 13 nav + schemaDiff queued 件数 badge", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "a1",
      email: "admin@x",
      name: "管理者",
      isAdmin: true,
    });
    vi.mocked(safeServerFetch).mockResolvedValue({
      ok: true,
      data: { total: 3, items: [{ status: "queued" }, { status: "queued" }, { status: "resolved" }] },
    } as never);
    await renderServer();
    const nav = screen.getByTestId("shell-nav");
    expect(within(nav).getAllByRole("link")).toHaveLength(13);
    expect(within(nav).getByRole("link", { name: /スキーマ/ }).textContent).toContain("2");
  });
});
