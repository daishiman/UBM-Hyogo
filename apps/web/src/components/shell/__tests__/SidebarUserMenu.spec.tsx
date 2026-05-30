import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

import { SidebarUserMenu } from "../SidebarUserMenu";

afterEach(() => {
  cleanup();
  mockPathname = "/";
});

const memberUser = { displayName: "山田太郎", email: "y@example.com", initials: "山" };
const adminUser = { displayName: "管理者A", email: "a@example.com", initials: "管" };

describe("SidebarUserMenu", () => {
  it("viewer: ログイン menuitem のみ、signout DOM が存在しない", () => {
    render(<SidebarUserMenu role="viewer" user={null} collapsed={false} />);
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain("ログイン");
    expect(screen.queryByTestId("sign-out-button")).toBeNull();
  });

  it("member: 3 menuitem + SignOutButton が render される", () => {
    render(<SidebarUserMenu role="member" user={memberUser} collapsed={false} />);
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(screen.getByTestId("sign-out-button")).not.toBeNull();
  });

  it("admin: 4 menuitem、avatar に data-role=admin", () => {
    const { container } = render(
      <SidebarUserMenu role="admin" user={adminUser} collapsed={false} />,
    );
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
    const avatar = container.querySelector(".ui-sidebar-user-avatar");
    expect(avatar?.getAttribute("data-role")).toBe("admin");
    expect(container.querySelector("[data-admin-badge]")).not.toBeNull();
  });

  it("collapsed=true で label が sr-only、avatar 描画は維持", () => {
    const { container } = render(
      <SidebarUserMenu role="member" user={memberUser} collapsed={true} />,
    );
    const root = container.querySelector("[data-shell-user-menu]");
    expect(root?.getAttribute("data-collapsed")).toBe("true");
    expect(container.querySelector(".sr-only")).not.toBeNull();
    expect(container.querySelector(".ui-sidebar-user-avatar")).not.toBeNull();
  });

  it("summary は role=button + aria-haspopup=menu + aria-label を持つ", () => {
    render(<SidebarUserMenu role="member" user={memberUser} collapsed={false} />);
    const summary = screen.getByRole("button", { name: "ユーザーメニュー" });
    expect(summary.getAttribute("aria-haspopup")).toBe("menu");
    expect(summary.tagName.toLowerCase()).toBe("summary");
  });

  it("role=menu container 内に各 action が role=menuitem として存在", () => {
    const { container } = render(
      <SidebarUserMenu role="admin" user={adminUser} collapsed={false} />,
    );
    const menu = container.querySelector("[role='menu']");
    expect(menu).not.toBeNull();
    const items = menu!.querySelectorAll("[role='menuitem']");
    expect(items.length).toBe(4);
  });

  it("pathname 変化で details.open が false になる", () => {
    const { container, rerender } = render(
      <SidebarUserMenu role="member" user={memberUser} collapsed={false} />,
    );
    const details = container.querySelector("details") as HTMLDetailsElement;
    details.open = true;
    mockPathname = "/profile";
    rerender(<SidebarUserMenu role="member" user={memberUser} collapsed={false} />);
    expect(details.open).toBe(false);
  });

  it("role 表記: admin->管理者, member->会員, viewer は省略", () => {
    const { container: c1 } = render(
      <SidebarUserMenu role="admin" user={adminUser} collapsed={false} />,
    );
    expect(c1.textContent).toContain("管理者");
    cleanup();
    const { container: c2 } = render(
      <SidebarUserMenu role="member" user={memberUser} collapsed={false} />,
    );
    expect(c2.textContent).toContain("会員");
    cleanup();
    const { container: c3 } = render(
      <SidebarUserMenu role="viewer" user={null} collapsed={false} />,
    );
    expect(c3.textContent).not.toContain("管理者");
    expect(c3.textContent).not.toContain("会員");
  });
});
