import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { axe } from "../../../test/axe";
import { AdminTopbar } from "../AdminTopbar";

afterEach(() => cleanup());

describe("AdminTopbar", () => {
  it("props 省略時に既定 breadcrumb と hidden actions slot を描画する", () => {
    const { container } = render(<AdminTopbar />);
    const topbar = container.querySelector('header[data-shell="topbar"]');
    const breadcrumb = container.querySelector(
      '[data-component="admin-breadcrumb-slot"]',
    );
    const actions = container.querySelector(
      '[data-component="admin-topbar-actions"]',
    );

    expect(topbar).not.toBeNull();
    expect(topbar?.className).toContain(
      "border-[var(--ubm-color-border-default)]",
    );
    expect(breadcrumb?.textContent).toBe("管理");
    expect(breadcrumb?.className).toContain(
      "text-[var(--ubm-color-text-primary)]",
    );
    expect(actions?.getAttribute("aria-hidden")).toBe("true");
  });

  it("breadcrumb slot の wrapper を維持したまま中身を差し替える", () => {
    const { container } = render(
      <AdminTopbar breadcrumb={<span>会員管理</span>} />,
    );
    const breadcrumb = container.querySelector(
      '[data-component="admin-breadcrumb-slot"]',
    );

    expect(breadcrumb).not.toBeNull();
    expect(screen.getByText("会員管理")).toBeTruthy();
    expect(breadcrumb?.textContent).toBe("会員管理");
  });

  it("actions slot 注入時は aria-hidden を外して中身を描画する", () => {
    const { container } = render(
      <AdminTopbar actions={<button type="button">保存</button>} />,
    );
    const actions = container.querySelector(
      '[data-component="admin-topbar-actions"]',
    );

    expect(actions).not.toBeNull();
    expect(actions?.hasAttribute("aria-hidden")).toBe(false);
    expect(screen.getByRole("button", { name: "保存" })).toBeTruthy();
  });

  it("breadcrumb=null は既定ラベルへフォールバックする", () => {
    const { container } = render(<AdminTopbar breadcrumb={null} />);
    const breadcrumb = container.querySelector(
      '[data-component="admin-breadcrumb-slot"]',
    );

    expect(breadcrumb?.textContent).toBe("管理");
  });

  it("breadcrumb=0 は意味のある ReactNode として保持する", () => {
    const { container } = render(<AdminTopbar breadcrumb={0} />);
    const breadcrumb = container.querySelector(
      '[data-component="admin-breadcrumb-slot"]',
    );

    expect(breadcrumb?.textContent).toBe("0");
  });

  it("actions=null は省略と区別して aria-hidden を付けない", () => {
    const { container } = render(<AdminTopbar actions={null} />);
    const actions = container.querySelector(
      '[data-component="admin-topbar-actions"]',
    );

    expect(actions).not.toBeNull();
    expect(actions?.hasAttribute("aria-hidden")).toBe(false);
    expect(actions?.textContent).toBe("");
  });

  it("actions=false も省略と区別して aria-hidden を付けない", () => {
    const { container } = render(<AdminTopbar actions={false} />);
    const actions = container.querySelector(
      '[data-component="admin-topbar-actions"]',
    );

    expect(actions?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("axe critical 違反 0", async () => {
    const { container } = render(<AdminTopbar />);
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");

    expect(critical).toEqual([]);
  });

  it("slot 注入時も axe critical 違反 0", async () => {
    const { container } = render(
      <AdminTopbar
        breadcrumb={<span>会員管理</span>}
        actions={<button type="button">操作</button>}
      />,
    );
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");

    expect(critical).toEqual([]);
  });
});
