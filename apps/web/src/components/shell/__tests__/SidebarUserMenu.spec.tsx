import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/") }));
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));

import { usePathname } from "next/navigation";
import { SidebarUserMenu } from "../SidebarUserMenu";

afterEach(() => cleanup());
beforeEach(() => vi.mocked(usePathname).mockReturnValue("/"));

const user = { displayName: "山田太郎", email: "yamada@example.com", initials: "山" };

describe("SidebarUserMenu", () => {
  it("viewer はログインリンクのみ（popover なし）", () => {
    render(<SidebarUserMenu role="viewer" user={null} collapsed={false} />);
    const login = screen.getByRole("link", { name: "ログイン" });
    expect(login.getAttribute("href")).toBe("/login");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("member は signout + プロフィール / 編集申請 link を持つ", () => {
    render(<SidebarUserMenu role="member" user={user} collapsed={false} />);
    // menu item は <a role="menuitem">。閉じた <details> でも DOM には存在するため getByText で取得。
    expect(screen.getByText("プロフィール").closest("a")?.getAttribute("href")).toBe("/profile");
    expect(
      screen.getByText("プロフィール編集申請").closest("a")?.getAttribute("href"),
    ).toBe("/profile#edit-request");
    expect(screen.getByTestId("sign-out-button")).toBeTruthy();
    expect(screen.queryByText("管理者ダッシュボード")).toBeNull();
  });

  it("admin は管理者ダッシュボードを含む 3 link + signout、ロールラベル『管理者』表示", () => {
    render(<SidebarUserMenu role="admin" user={user} collapsed={false} />);
    expect(
      screen.getByText("管理者ダッシュボード").closest("a")?.getAttribute("href"),
    ).toBe("/admin");
    expect(screen.getByTestId("sign-out-button")).toBeTruthy();
    expect(screen.getByText("管理者")).toBeTruthy();
  });

  it("collapsed=true で displayName ラベルが sr-only になる", () => {
    render(<SidebarUserMenu role="admin" user={user} collapsed={true} />);
    const name = screen.getByText("山田太郎");
    // collapsed では summary 内のテキストブロックが sr-only 化される
    expect(name.closest(".sr-only")).not.toBeNull();
  });
});
