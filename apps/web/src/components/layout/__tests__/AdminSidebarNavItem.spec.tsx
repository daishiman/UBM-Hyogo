import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";
import { AdminSidebarNavItem } from "../AdminSidebarNavItem";

afterEach(() => cleanup());

describe("AdminSidebarNavItem", () => {
  it("matching pathname renders data-active=true and aria-current=page", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/members");
    render(
      <ul>
        <AdminSidebarNavItem href="/admin/members" label="会員管理" icon={<span />} />
      </ul>,
    );
    const link = screen.getByRole("link", { name: /会員管理/ });
    expect(link.getAttribute("data-active")).toBe("true");
    expect(link.getAttribute("aria-current")).toBe("page");
  });

  it("non-matching pathname renders data-active=false", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/tags");
    render(
      <ul>
        <AdminSidebarNavItem href="/admin/members" label="会員管理" icon={<span />} />
      </ul>,
    );
    const link = screen.getByRole("link", { name: /会員管理/ });
    expect(link.getAttribute("data-active")).toBe("false");
    expect(link.getAttribute("aria-current")).toBeNull();
  });

  it("badge with count=0 is not rendered", () => {
    vi.mocked(usePathname).mockReturnValue("/admin");
    render(
      <ul>
        <AdminSidebarNavItem
          href="/admin/schema"
          label="schema"
          icon={<span />}
          badge={{ tone: "warn", count: 0 }}
        />
      </ul>,
    );
    expect(screen.queryByText("0")).toBeNull();
  });

  it("badge with count>0 renders the count", () => {
    vi.mocked(usePathname).mockReturnValue("/admin");
    render(
      <ul>
        <AdminSidebarNavItem
          href="/admin/schema"
          label="schema"
          icon={<span />}
          badge={{ tone: "warn", count: 3 }}
        />
      </ul>,
    );
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("null badge renders no chip", () => {
    vi.mocked(usePathname).mockReturnValue("/admin");
    render(
      <ul>
        <AdminSidebarNavItem href="/admin/members" label="会員管理" icon={<span />} badge={null} />
      </ul>,
    );
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });
});
