import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin"),
}));
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));

import { usePathname } from "next/navigation";
import { SidebarShell } from "../SidebarShell";
import { buildNavForRole } from "../shell-config";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/admin");
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
});

const adminUser = { displayName: "管理太郎", email: "admin@example.com", initials: "管" };

function renderShell(role: "viewer" | "member" | "admin", user = adminUser) {
  return render(
    <SidebarShell
      role={role}
      user={role === "viewer" ? null : user}
      navGroups={buildNavForRole(role, { schemaDiffCount: 2 })}
      mobileTriggerSlot={<button type="button" data-testid="mobile-trigger" />}
    >
      <p data-testid="child">child</p>
    </SidebarShell>,
  );
}

describe("SidebarShell", () => {
  it("app-shell / shell-sidebar / shell-nav の testid を持ち children を描画する", () => {
    renderShell("admin");
    expect(screen.getByTestId("app-shell")).toBeTruthy();
    expect(screen.getByTestId("shell-sidebar")).toBeTruthy();
    expect(screen.getByTestId("shell-nav")).toBeTruthy();
    expect(screen.getByTestId("child")).toBeTruthy();
  });

  it("viewer は nav link 3 / member は 4 / admin は 13", () => {
    const { unmount: u1 } = renderShell("viewer", adminUser);
    expect(within(screen.getByTestId("shell-nav")).getAllByRole("link")).toHaveLength(3);
    u1();
    const { unmount: u2 } = renderShell("member");
    expect(within(screen.getByTestId("shell-nav")).getAllByRole("link")).toHaveLength(4);
    u2();
    renderShell("admin");
    expect(within(screen.getByTestId("shell-nav")).getAllByRole("link")).toHaveLength(13);
  });

  it("active path に一致する nav item へ aria-current=page を付与する", () => {
    renderShell("admin");
    const nav = screen.getByTestId("shell-nav");
    const dashboard = within(nav).getByRole("link", { name: /ダッシュボード/ });
    expect(dashboard.getAttribute("aria-current")).toBe("page");
  });

  it("admin schema item に schemaDiff badge（2）が出る", () => {
    renderShell("admin");
    const nav = screen.getByTestId("shell-nav");
    const schema = within(nav).getByRole("link", { name: /スキーマ/ });
    expect(schema.textContent).toContain("2");
  });
});
