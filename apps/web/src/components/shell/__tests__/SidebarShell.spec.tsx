import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, screen, act } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { SidebarShell } from "../SidebarShell";
import { buildNavForRole } from "../shell-config";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
beforeEach(() => {
  window.localStorage.clear();
});

function renderShell(opts: {
  role: "viewer" | "member" | "admin";
  activePath: string;
  schemaDiffCount?: number;
}) {
  const navGroups = buildNavForRole(opts.role, { schemaDiffCount: opts.schemaDiffCount ?? 0 });
  return render(
    <SidebarShell
      role={opts.role}
      user={{ displayName: "テスト", email: "t@example.com", initials: "テ" }}
      navGroups={navGroups}
      activePath={opts.activePath}
      mobileTriggerSlot={<button type="button">drawer</button>}
    >
      <div>main</div>
    </SidebarShell>,
  );
}

describe("SidebarShell", () => {
  it("viewer renders 3 nav items", () => {
    renderShell({ role: "viewer", activePath: "/" });
    expect(document.querySelectorAll('[data-component="shell-nav-item"]').length).toBe(3);
  });

  it("member renders 4 nav items", () => {
    renderShell({ role: "member", activePath: "/profile" });
    expect(document.querySelectorAll('[data-component="shell-nav-item"]').length).toBe(4);
  });

  it("admin renders 13 nav items", () => {
    renderShell({ role: "admin", activePath: "/admin" });
    expect(document.querySelectorAll('[data-component="shell-nav-item"]').length).toBe(13);
  });

  it("only one item is data-active=true for the current pathname", () => {
    renderShell({ role: "admin", activePath: "/admin/tags" });
    const active = document.querySelectorAll(
      '[data-component="shell-nav-item"][data-active="true"]',
    );
    expect(active.length).toBe(1);
    expect((active[0] as HTMLAnchorElement).getAttribute("href")).toBe("/admin/tags");
  });

  it("nav exposes aria-label=サイドバー", () => {
    renderShell({ role: "viewer", activePath: "/" });
    const nav = screen.getByRole("navigation", { name: "サイドバー" });
    expect(nav).toBeTruthy();
  });

  it("collapse toggle hides labels via sr-only", () => {
    renderShell({ role: "admin", activePath: "/admin" });
    const toggle = screen.getByRole("button", { name: /折り畳む|展開/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    act(() => toggle.click());
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    const labels = document.querySelectorAll(
      '[data-component="shell-nav-label"]',
    );
    expect(labels.length).toBeGreaterThan(0);
    labels.forEach((l) => expect(l.className).toContain("sr-only"));
  });

  it("schema badge appears when schemaDiffCount>0", () => {
    renderShell({ role: "admin", activePath: "/admin", schemaDiffCount: 3 });
    const schemaLink = document.querySelector('a[href="/admin/schema"]');
    expect(schemaLink?.textContent).toContain("3");
  });
});
