import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

let mockPath = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPath,
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

beforeEach(() => {
  mockPath = "/";
});

import { SidebarShell } from "../SidebarShell";
import { SidebarMobileTrigger } from "../SidebarMobileTrigger";
import { buildNavForRole } from "../shell-config";

afterEach(() => cleanup());

function renderShell(role: "viewer" | "member" | "admin") {
  return render(
    <SidebarShell
      role={role}
      user={
        role === "viewer"
          ? null
          : { displayName: "山田太郎", email: "taro@example.com", initials: "山" }
      }
      navGroups={buildNavForRole(role, { schemaDiffCount: 3 })}
      activePath="/"
      mobileTriggerSlot={<SidebarMobileTrigger />}
    >
      <div>本文</div>
    </SidebarShell>,
  );
}

describe("SidebarShell responsive (Task E)", () => {
  it("<aside> は sm で hidden / md+ で flex 表示 (AC-E1)", () => {
    const { container } = renderShell("admin");
    const aside = container.querySelector("aside")!;
    expect(aside.className).toContain("hidden");
    expect(aside.className).toContain("md:flex");
  });

  it("mobileTriggerSlot の trigger が md:hidden で配置される (AC-E1)", () => {
    renderShell("admin");
    const trigger = screen.getByRole("button", { name: "メニューを開く" });
    expect(trigger.className).toContain("md:hidden");
  });

  it("aside ツリーに固定 id を持つ要素が無く id 重複が発生しない (R-E2)", () => {
    const { container } = renderShell("admin");
    const ids = Array.from(container.querySelectorAll("[id]")).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("trigger で開いた drawer が route 変化で自動 close される (AC-E7 / AC-E8)", () => {
    const { rerender } = renderShell("admin");
    // hamburger を押して drawer を開く
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    expect(screen.getByRole("dialog", { name: "サイドバーメニュー" })).toBeTruthy();
    // pathname 変化 → useSidebarState が drawerOpen=false → drawer unmount
    mockPath = "/admin/members";
    rerender(
      <SidebarShell
        role="admin"
        user={{ displayName: "山田太郎", email: "taro@example.com", initials: "山" }}
        navGroups={buildNavForRole("admin", { schemaDiffCount: 3 })}
        activePath="/admin/members"
        mobileTriggerSlot={<SidebarMobileTrigger />}
      >
        <div>本文</div>
      </SidebarShell>,
    );
    expect(screen.queryByRole("dialog", { name: "サイドバーメニュー" })).toBeNull();
  });
});

describe("SidebarShell nav rendering (Task A)", () => {
  it("admin は 13 件の nav link を描画する", () => {
    const { container } = renderShell("admin");
    const navLinks = container.querySelectorAll('[data-component="shell-nav-item"]');
    expect(navLinks).toHaveLength(13);
  });

  it("viewer は user footer を描画しない", () => {
    const { container } = renderShell("viewer");
    expect(container.querySelector('[data-component="shell-footer"]')).toBeNull();
  });

  it("member は user footer を描画する", () => {
    const { container } = renderShell("member");
    expect(container.querySelector('[data-component="shell-footer"]')).not.toBeNull();
  });
});
