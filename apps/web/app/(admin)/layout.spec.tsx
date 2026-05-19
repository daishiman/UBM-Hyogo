// parallel-03 S-02: Admin AppShell layout spec
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { axe } from "../../src/test/axe";

vi.mock("../../src/lib/session", () => ({
  getSession: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import AdminLayout from "./layout";
import { getSession } from "../../src/lib/session";
import { redirect } from "next/navigation";

afterEach(() => cleanup());
beforeEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(redirect).mockClear();
});

describe("AdminLayout", () => {
  it("未認証 (session=null) は /login?next=/admin へ redirect", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(
      AdminLayout({ children: <p>x</p> }),
    ).rejects.toThrow("REDIRECT:/login?next=/admin");
    expect(redirect).toHaveBeenCalledWith("/login?next=/admin");
  });

  it("non-admin (isAdmin=false) は /login?gate=forbidden へ redirect", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "a@b",
      isAdmin: false,
    });
    await expect(
      AdminLayout({ children: <p>x</p> }),
    ).rejects.toThrow("REDIRECT:/login?gate=forbidden");
    expect(redirect).toHaveBeenCalledWith("/login?gate=forbidden");
  });

  it("admin session は wrapper に data-theme='cool' / data-route-group='admin' / data-testid='admin-shell' を付与し chrome 要素を含む", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "a@b",
      isAdmin: true,
    });
    const tree = await AdminLayout({
      children: <p data-testid="child">child</p>,
    });
    const { container } = render(tree);
    const shell = container.querySelector('[data-testid="admin-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute("data-theme")).toBe("cool");
    expect(shell?.getAttribute("data-route-group")).toBe("admin");
    expect(container.querySelector('[data-shell="sidebar"]')).not.toBeNull();
    expect(container.querySelector('[data-shell="topbar"]')).not.toBeNull();
    const main = container.querySelector('main[data-route="admin"]');
    expect(main).not.toBeNull();
    expect(main?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("admin session render で axe critical 違反 0", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "a@b",
      isAdmin: true,
    });
    const tree = await AdminLayout({ children: <p>child</p> });
    const { container } = render(tree);
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
