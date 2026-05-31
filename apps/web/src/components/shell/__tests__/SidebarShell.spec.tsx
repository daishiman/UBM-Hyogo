// Task A — SidebarShell (Client) の spec。role 別 nav 数 / active / collapsed 挙動。
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/members"),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

import { SidebarShell } from "../SidebarShell";
import { buildNavForRole } from "../shell-config";

afterEach(() => cleanup());

function renderShell(role: "viewer" | "member" | "admin") {
  return render(
    <SidebarShell
      role={role}
      user={
        role === "viewer"
          ? null
          : { displayName: "山田太郎", email: "y@example.com", initials: "山" }
      }
      navGroups={buildNavForRole(role, { schemaDiffCount: 2 })}
      activePath="/members"
      mobileTriggerSlot={<button data-testid="trigger" />}
    >
      <p data-testid="child">child</p>
    </SidebarShell>,
  );
}

describe("SidebarShell", () => {
  it("viewer は nav item 3 個", () => {
    const { container } = renderShell("viewer");
    expect(container.querySelectorAll('[data-shell-block="nav-item"]')).toHaveLength(3);
  });

  it("member は nav item 4 個", () => {
    const { container } = renderShell("member");
    expect(container.querySelectorAll('[data-shell-block="nav-item"]')).toHaveLength(4);
  });

  it("admin は nav item 13 個（3+1+9）", () => {
    const { container } = renderShell("admin");
    expect(container.querySelectorAll('[data-shell-block="nav-item"]')).toHaveLength(13);
  });

  it("children と mobileTriggerSlot が shell 配下に render される", () => {
    const { container } = renderShell("member");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="trigger"]')).not.toBeNull();
  });

  it("active path の nav item に aria-current=page が付く", () => {
    const { container } = renderShell("member");
    const active = container.querySelector('[data-shell-block="nav-item"][data-active="true"]');
    expect(active?.getAttribute("aria-current")).toBe("page");
    expect(active?.getAttribute("href")).toBe("/members");
  });

  it("初期 expanded では aside が shell-collapsed=false", () => {
    const { container } = renderShell("member");
    const root = container.querySelector('[data-shell-root="true"]');
    expect(root?.getAttribute("data-shell-collapsed")).toBe("false");
  });

  it("nav landmark に aria-label='サイドバー' が付く", () => {
    const { container } = renderShell("member");
    expect(container.querySelector('nav[aria-label="サイドバー"]')).not.toBeNull();
  });
});
