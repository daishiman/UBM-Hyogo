// AdminSidebar: structure / accessibility / 全リンク網羅
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AdminSidebar } from "../AdminSidebar";

afterEach(() => cleanup());

describe("AdminSidebar", () => {
  it("管理メニュー nav が aria-label 付きで存在する (accessibility)", () => {
    render(<AdminSidebar />);
    const nav = screen.getByRole("navigation", { name: "管理メニュー" });
    expect(nav).toBeTruthy();
    expect(nav.getAttribute("aria-label")).toBe("管理メニュー");
  });

  it("8 件のリンクをラベルと href の組で全件レンダーする", () => {
    render(<AdminSidebar />);
    const expected: Array<[string, string]> = [
      ["ダッシュボード", "/admin"],
      ["会員管理", "/admin/members"],
      ["タグキュー", "/admin/tags"],
      ["schema", "/admin/schema"],
      ["開催日", "/admin/meetings"],
      ["依頼キュー", "/admin/requests"],
      ["Identity重複", "/admin/identity-conflicts"],
      ["監査ログ", "/admin/audit"],
    ];
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(expected.length);
    for (const [label, href] of expected) {
      const link = screen.getByRole("link", { name: label });
      expect(link.getAttribute("href")).toBe(href);
    }
  });

  it("リンクはすべて <li> 内に配置されている (structure)", () => {
    const { container } = render(<AdminSidebar />);
    const items = container.querySelectorAll("nav.admin-sidebar > ul > li > a");
    expect(items.length).toBe(8);
  });
});
