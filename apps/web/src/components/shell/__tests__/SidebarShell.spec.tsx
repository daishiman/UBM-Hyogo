// Task A — SidebarShell (Client) の spec。role 別 nav 数 / active / collapsed 挙動。
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/members"),
}));

import { SidebarShell } from "../SidebarShell";
import { buildNavForRole } from "../shell-config";

afterEach(() => cleanup());

function renderShell(role: "viewer" | "member" | "admin", initialCollapsed: boolean | null = null) {
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
      initialCollapsed={initialCollapsed}
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

  it("admin は nav item 15 個（3+1+11）", () => {
    const { container } = renderShell("admin");
    expect(container.querySelectorAll('[data-shell-block="nav-item"]')).toHaveLength(15);
  });

  it("children と mobileTriggerSlot が shell 配下に render される", () => {
    const { container } = renderShell("member");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="trigger"]')).not.toBeNull();
  });

  it("mobile-bar は sticky top-0 z-30 かつ md:hidden を維持する", () => {
    const { container } = renderShell("member");
    const mobileBar = container.querySelector('[data-shell="mobile-bar"]');
    expect(mobileBar?.className).toContain("sticky");
    expect(mobileBar?.className).toContain("top-0");
    expect(mobileBar?.className).toContain("z-30");
    expect(mobileBar?.className).toContain("md:hidden");
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

  it("desktop aside は tooltip をクリップせず nav と footer 固定領域を分離する", () => {
    const { container } = renderShell("admin");
    const aside = container.querySelector('[data-shell="sidebar"]');
    const nav = container.querySelector('[data-shell-block="nav"]');
    const footer = container.querySelector('[data-shell-block="sidebar-footer"]');
    expect(aside?.className).toContain("overflow-visible");
    expect(nav?.className).toContain("overflow-y-auto");
    expect(footer?.className).toContain("shrink-0");
    expect(footer?.querySelector('[data-role="public-return"]')).not.toBeNull();
    expect(footer?.querySelector('[data-shell-block="user-menu"]')).not.toBeNull();
  });

  it("main は public footer sticky 用の flex column 契約を持つ", () => {
    const { container } = renderShell("viewer");
    const main = container.querySelector('[data-shell="main"]');
    expect(main?.className).toContain("flex");
    expect(main?.className).toContain("flex-col");
  });

  it("collapsed 初期値では aside が collapsed 幅状態になり footer control も残る", () => {
    const { container } = renderShell("admin", true);
    const aside = container.querySelector('[data-shell="sidebar"]');
    const nav = container.querySelector('[data-shell-block="nav"]');
    expect(aside?.getAttribute("data-collapsed")).toBe("true");
    expect(aside?.className).toContain("overflow-visible");
    expect(nav?.className).toContain("overflow-visible");
    expect(container.querySelector('[data-shell-block="sidebar-footer"]')).not.toBeNull();
    const toggle = container.querySelector('[data-shell-block="collapse-toggle"]');
    expect(toggle?.closest(".justify-center")).not.toBeNull();
  });

  it("admin collapsed では公開サイトに戻るリンクに tooltip を接続する", () => {
    const { container } = renderShell("admin", true);
    const publicReturn = container.querySelector('[data-role="public-return"]');
    const tooltip = Array.from(container.querySelectorAll('[role="tooltip"]')).find(
      (node) => node.textContent === "公開サイトに戻る",
    );
    expect(tooltip).not.toBeNull();
    expect(publicReturn?.getAttribute("title")).toBeNull();
    expect(publicReturn?.getAttribute("aria-describedby")).toBe(tooltip?.id);
  });

  it("collapsed 初期値では brand/nav/public-return/user-menu の水平 padding を剥がす", () => {
    const { container } = renderShell("admin", true);
    const brand = container.querySelector('[data-shell="sidebar"] [data-shell-block="brand"]');
    const navItem = container.querySelector('[data-shell="sidebar"] [data-shell-block="nav-item"]');
    const publicReturn = container.querySelector('[data-shell="sidebar"] [data-role="public-return"]');
    const summary = container.querySelector('[data-shell="sidebar"] summary');

    for (const node of [brand, navItem, publicReturn, summary]) {
      expect(node?.className).toContain("w-full");
      expect(node?.className).toContain("justify-center");
      expect(node?.className).toContain("px-0");
      expect(node?.className).not.toContain("px-3");
    }

    expect(brand?.querySelector('[aria-hidden="true"]')?.className).toContain("h-10");
    expect(navItem?.querySelector('[aria-hidden="true"]')?.className).toContain("h-10");
    expect(publicReturn?.querySelector('[aria-hidden="true"]')?.className).toContain("h-10");
  });

  it("collapsed 初期値では nav list のブラウザ既定 padding を剥がす", () => {
    const { container } = renderShell("admin", true);
    const navList = container.querySelector('[data-shell="sidebar"] [data-shell-block="nav-group"] ul');
    expect(navList?.className).toContain("m-0");
    expect(navList?.className).toContain("p-0");
    expect(navList?.className).toContain("list-none");
  });
});
