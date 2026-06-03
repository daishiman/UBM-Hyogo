import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/members"),
}));

import { FORM_RESPONSES_EDIT_URL } from "../../../lib/constants/form";
import { SidebarNavItem } from "../SidebarNavItem";
import type { ShellNavItem } from "../shell-config";

afterEach(() => cleanup());

describe("SidebarNavItem", () => {
  it("external item は target/rel 付き anchor で描画し active 扱いにしない", () => {
    const item: ShellNavItem = {
      id: "form-responses",
      href: FORM_RESPONSES_EDIT_URL,
      label: "Form回答",
      icon: "form-responses",
      external: true,
    };
    const { container } = render(
      <ul>
        <SidebarNavItem item={item} collapsed={false} activePath="/admin" />
      </ul>,
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe(FORM_RESPONSES_EDIT_URL);
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link?.getAttribute("aria-current")).toBeNull();
    expect(link?.getAttribute("data-active")).toBeNull();
    expect(link?.textContent).toContain("Form回答");
  });

  it("内部 item は pathname 一致時に active（aria-current/data-active）を出す", () => {
    const item: ShellNavItem = {
      id: "members",
      href: "/admin/members",
      label: "メンバー",
      icon: "members",
    };
    const { container } = render(
      <ul>
        <SidebarNavItem item={item} collapsed={false} activePath="/admin" />
      </ul>,
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("target")).toBeNull();
    expect(link?.getAttribute("data-active")).toBe("true");
    expect(link?.getAttribute("aria-current")).toBe("page");
  });

  it("collapsed のとき label は sr-only になる", () => {
    const item: ShellNavItem = {
      id: "members",
      href: "/admin/members",
      label: "メンバー",
      icon: "members",
    };
    const { container } = render(
      <ul>
        <SidebarNavItem item={item} collapsed activePath="/admin" />
      </ul>,
    );
    const labelSpan = Array.from(container.querySelectorAll("span")).find((s) =>
      s.textContent?.includes("メンバー"),
    );
    expect(labelSpan?.className).toContain("sr-only");
  });

  it("collapsed のとき link は中央寄せになり badge はドット表示になる", () => {
    const item: ShellNavItem = {
      id: "schema",
      href: "/admin/schema",
      label: "スキーマ",
      icon: "schema",
      badge: { count: 2, tone: "warn" },
    };
    const { container } = render(
      <ul>
        <SidebarNavItem item={item} collapsed activePath="/admin" />
      </ul>,
    );
    const link = container.querySelector("a");
    const dot = container.querySelector('[data-shell-block="nav-badge-dot"]');
    expect(link?.className).toContain("justify-center");
    expect(link?.className).toContain("gap-0");
    expect(link?.className).toContain("relative");
    expect(dot).not.toBeNull();
    expect(dot?.className).toContain("absolute");
    expect(dot?.querySelector(".sr-only")?.textContent).toBe("2");
  });
});
