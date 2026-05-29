import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SidebarUserMenu } from "../SidebarUserMenu";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/admin") }));

const USER = { displayName: "管理太郎", email: "admin@example.com", initials: "管" };

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

function links(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-component="shell-user-action"]'));
}

describe("SidebarUserMenu", () => {
  it("viewer はログインリンクのみ・signout なし", () => {
    const { container } = render(<SidebarUserMenu role="viewer" user={null} collapsed={false} />);
    const ls = links(container);
    expect(ls).toHaveLength(1);
    expect(ls[0].getAttribute("data-action")).toBe("login");
    expect(container.querySelector('[data-testid="sign-out-button"]')).toBeNull();
  });

  it("member は profile + edit-request の 2 link + signout", () => {
    const { container } = render(<SidebarUserMenu role="member" user={USER} collapsed={false} />);
    expect(links(container).map((l) => l.getAttribute("data-action"))).toEqual([
      "profile",
      "edit-request",
    ]);
    expect(container.querySelector('[data-testid="sign-out-button"]')).not.toBeNull();
  });

  it("admin は profile + edit-request + admin-dashboard の 3 link + signout", () => {
    const { container } = render(<SidebarUserMenu role="admin" user={USER} collapsed={false} />);
    expect(links(container).map((l) => l.getAttribute("data-action"))).toEqual([
      "profile",
      "edit-request",
      "admin-dashboard",
    ]);
    expect(container.querySelector('[data-testid="sign-out-button"]')).not.toBeNull();
    expect(container.querySelector('[data-component="shell-user-role"]')?.textContent).toBe("管理者");
  });

  it("admin アバターに admin badge が付く", () => {
    const { container } = render(<SidebarUserMenu role="admin" user={USER} collapsed={false} />);
    expect(container.querySelector('[data-component="shell-user-admin-badge"]')).not.toBeNull();
  });

  it("collapsed=true で表示名ラベルが sr-only", () => {
    const { container } = render(<SidebarUserMenu role="admin" user={USER} collapsed={true} />);
    const nameWrap = container.querySelector('[data-component="shell-user-name"]')?.parentElement;
    expect(nameWrap?.className).toContain("sr-only");
  });
});
