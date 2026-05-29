import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { axe } from "../../../test/axe";
import { SidebarShell } from "../SidebarShell";
import { buildNavForRole, type ShellRole } from "../shell-config";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/admin") }));

import { usePathname } from "next/navigation";

const ADMIN_USER = { displayName: "管理太郎", email: "admin@example.com", initials: "管" };

function renderShell(role: ShellRole, opts?: { schemaDiffCount?: number }) {
  const navGroups = buildNavForRole(role, opts);
  return render(
    <SidebarShell
      role={role}
      user={role === "viewer" ? null : ADMIN_USER}
      navGroups={navGroups}
      activePath="/admin"
      mobileTriggerSlot={<button type="button">trigger</button>}
    >
      <main data-route="admin">child</main>
    </SidebarShell>,
  );
}

afterEach(() => cleanup());
beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(usePathname).mockReturnValue("/admin");
});

describe("SidebarShell nav 描画", () => {
  it("viewer は nav item 3 個", () => {
    const { container } = renderShell("viewer");
    expect(container.querySelectorAll('[data-component="shell-nav-item"]')).toHaveLength(3);
  });

  it("member は nav item 4 個", () => {
    const { container } = renderShell("member");
    expect(container.querySelectorAll('[data-component="shell-nav-item"]')).toHaveLength(4);
  });

  it("admin は nav item 13 個", () => {
    const { container } = renderShell("admin");
    expect(container.querySelectorAll('[data-component="shell-nav-item"]')).toHaveLength(13);
  });

  it("admin: schemaDiffCount=2 で schema link に badge 2 が描画される（TC-05 委譲）", () => {
    const { container } = renderShell("admin", { schemaDiffCount: 2 });
    const schemaLink = container.querySelector('a[href="/admin/schema"]');
    expect(schemaLink?.textContent).toContain("2");
  });

  it("admin: schemaDiffCount=0 で schema link に数字が出ない（TC-06 委譲）", () => {
    const { container } = renderShell("admin", { schemaDiffCount: 0 });
    const schemaLink = container.querySelector('a[href="/admin/schema"]');
    expect(schemaLink?.textContent).not.toMatch(/\d/);
  });
});

describe("SidebarShell active state", () => {
  it("usePathname に一致する item が aria-current=page になる", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/members");
    const { container } = renderShell("admin");
    const active = container.querySelector('a[href="/admin/members"]');
    expect(active?.getAttribute("data-active")).toBe("true");
    expect(active?.getAttribute("aria-current")).toBe("page");
    const dashboard = container.querySelector('a[href="/admin"]');
    expect(dashboard?.getAttribute("data-active")).toBe("false");
  });
});

describe("SidebarShell collapse", () => {
  it("collapse toggle で nav label が sr-only になる", () => {
    const { container } = renderShell("admin");
    const firstLabel = container.querySelector('[data-component="shell-nav-item"] span:nth-child(2)');
    expect(firstLabel?.className).not.toContain("sr-only");
    const toggle = container.querySelector('[data-component="shell-collapse-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle);
    const collapsedLabel = container.querySelector('[data-component="shell-nav-item"] span:nth-child(2)');
    expect(collapsedLabel?.className).toContain("sr-only");
  });
});

describe("SidebarShell a11y", () => {
  it("admin render で axe critical 違反 0", async () => {
    const { container } = renderShell("admin");
    const results = await axe(container);
    expect(results.violations.filter((v) => v.impact === "critical")).toEqual([]);
  });
});
