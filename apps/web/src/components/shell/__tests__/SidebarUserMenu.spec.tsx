// Task B — SidebarUserMenu の spec。role 別 action / collapsed 表示。
import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, cleanup } from "@testing-library/react";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/profile"),
}));

import { SidebarUserMenu } from "../SidebarUserMenu";

afterEach(() => cleanup());

const MEMBER = { displayName: "山田太郎", email: "y@example.com", initials: "山" };

describe("SidebarUserMenu", () => {
  it("viewer は ログイン リンクのみ / signout なし", () => {
    const { container } = render(
      <SidebarUserMenu role="viewer" user={null} collapsed={false} />,
    );
    const login = container.querySelector('[data-shell-block="login-cta"]');
    expect(login).not.toBeNull();
    expect(login?.getAttribute("href")).toBe("/login");
    expect(container.textContent).toContain("ゲスト");
    expect(container.textContent).toContain("未ログイン");
    expect(container.querySelector('[data-testid="sign-out-button"]')).toBeNull();
  });

  it("member は profile / edit-request リンク + signout", () => {
    const { container } = render(
      <SidebarUserMenu role="member" user={MEMBER} collapsed={false} />,
    );
    expect(container.querySelector('[data-action="profile"]')).not.toBeNull();
    expect(container.querySelector('[data-action="edit-request"]')).not.toBeNull();
    expect(container.querySelector('[data-action="admin-dashboard"]')).toBeNull();
    expect(container.querySelector('[data-testid="sign-out-button"]')).not.toBeNull();
  });

  it("admin は admin-dashboard リンク + signout を持つ", () => {
    const { container } = render(
      <SidebarUserMenu role="admin" user={MEMBER} collapsed={false} />,
    );
    expect(container.querySelector('[data-action="admin-dashboard"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="sign-out-button"]')).not.toBeNull();
  });

  it("admin は avatar に data-role='admin' を付与する", () => {
    const { container } = render(
      <SidebarUserMenu role="admin" user={MEMBER} collapsed={false} />,
    );
    const avatar = container.querySelector('[data-shell-block="user-avatar"]');
    expect(avatar?.getAttribute("data-role")).toBe("admin");
  });

  it("collapsed=true で displayName が sr-only になる", () => {
    const { container } = render(
      <SidebarUserMenu role="member" user={MEMBER} collapsed={true} />,
    );
    const labelWrap = container.querySelector('summary .sr-only');
    expect(labelWrap).not.toBeNull();
  });

  it("collapsed=true で summary 内に tooltip を配置し details>summary 構造を保つ", () => {
    const { container } = render(
      <SidebarUserMenu role="member" user={MEMBER} collapsed={true} />,
    );
    const details = container.querySelector("details");
    const summary = container.querySelector("summary");
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(details?.firstElementChild).toBe(summary);
    expect(tooltip?.textContent).toBe("ユーザーメニュー");
    expect(summary?.getAttribute("aria-describedby")).toBe(tooltip?.id);
    expect(summary?.getAttribute("aria-label")).toBe("ユーザーメニュー");
  });

  it("外側 pointerdown で popover を閉じる", () => {
    const { container } = render(
      <div>
        <SidebarUserMenu role="member" user={MEMBER} collapsed={false} />
        <button data-testid="outside">outside</button>
      </div>,
    );
    const details = container.querySelector("details");
    const outside = container.querySelector('[data-testid="outside"]');
    if (!details || !outside) throw new Error("test setup failed");
    details.open = true;
    fireEvent.pointerDown(outside);
    expect(details.open).toBe(false);
  });

  it("内側 pointerdown では popover を閉じない", () => {
    const { container } = render(
      <SidebarUserMenu role="member" user={MEMBER} collapsed={false} />,
    );
    const details = container.querySelector("details");
    const menuItem = container.querySelector('[data-action="profile"]');
    if (!details || !menuItem) throw new Error("test setup failed");
    details.open = true;
    fireEvent.pointerDown(menuItem);
    expect(details.open).toBe(true);
  });

  it("Escape で popover を閉じる", () => {
    const { container } = render(
      <SidebarUserMenu role="admin" user={MEMBER} collapsed={false} />,
    );
    const details = container.querySelector("details");
    if (!details) throw new Error("test setup failed");
    details.open = true;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(details.open).toBe(false);
  });
});
