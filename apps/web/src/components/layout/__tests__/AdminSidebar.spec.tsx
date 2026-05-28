import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

import { usePathname } from "next/navigation";
import { AdminSidebar } from "../AdminSidebar";

afterEach(() => cleanup());
beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/admin");
});

const baseProps = {
  schemaDiffCount: 0,
  userDisplayName: "テスト管理者",
  userEmail: "admin@example.com",
};

describe("AdminSidebar", () => {
  it("renders 3 group labels (Public / Members / Admin) (AC-3)", () => {
    render(<AdminSidebar {...baseProps} />);
    const labels = Array.from(
      document.querySelectorAll('[data-component="admin-nav-label"]'),
    ).map((el) => el.textContent);
    expect(labels).toEqual(["Public", "Members", "Admin"]);
  });

  it("renders all 13 nav items", () => {
    render(<AdminSidebar {...baseProps} />);
    const items = document.querySelectorAll('[data-component="admin-nav-item"]');
    expect(items.length).toBe(13);
  });

  it("schemaDiffCount=0 hides badge; >0 shows it (AC-4)", () => {
    const { unmount } = render(<AdminSidebar {...baseProps} schemaDiffCount={0} />);
    const schemaLinkZero = document.querySelector('a[href="/admin/schema"]');
    expect(schemaLinkZero?.textContent).not.toMatch(/\d/);
    unmount();

    render(<AdminSidebar {...baseProps} schemaDiffCount={2} />);
    const schemaLinkTwo = document.querySelector('a[href="/admin/schema"]');
    expect(schemaLinkTwo?.textContent).toContain("2");
  });

  it("footer contains user-chip name, email and sign-out button (AC-5)", () => {
    render(<AdminSidebar {...baseProps} />);
    const footer = document.querySelector('[data-component="admin-sidebar-footer"]');
    expect(footer).not.toBeNull();
    expect(footer?.querySelector('[data-component="user-chip-name"]')?.textContent).toBe(
      "テスト管理者",
    );
    expect(footer?.querySelector('[data-component="user-chip-email"]')?.textContent).toBe(
      "admin@example.com",
    );
    expect(footer?.querySelector('[data-testid="sign-out-button"]')).not.toBeNull();
  });

  it("only one item is data-active=true for the current pathname (AC-2)", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/tags");
    render(<AdminSidebar {...baseProps} />);
    const active = document.querySelectorAll('[data-component="admin-nav-item"][data-active="true"]');
    expect(active.length).toBe(1);
    expect((active[0] as HTMLAnchorElement).getAttribute("href")).toBe("/admin/tags");
  });

  it("pathname /admin/members/123 activates /admin/members only (AC-2)", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/members/123");
    render(<AdminSidebar {...baseProps} />);
    const active = document.querySelectorAll('[data-component="admin-nav-item"][data-active="true"]');
    expect(active.length).toBe(1);
    expect((active[0] as HTMLAnchorElement).getAttribute("href")).toBe("/admin/members");
  });

  it("nav exposes aria-label=管理メニュー (a11y)", () => {
    render(<AdminSidebar {...baseProps} />);
    const nav = screen.getByRole("navigation", { name: "管理メニュー" });
    expect(nav).toBeTruthy();
  });
});
