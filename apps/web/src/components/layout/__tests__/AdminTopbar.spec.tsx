import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "../../../test/axe";
import { AdminTopbar } from "../AdminTopbar";

afterEach(() => cleanup());

describe("AdminTopbar", () => {
  it("props 省略時に topbar root と既定 breadcrumb を描画する", () => {
    const { container } = render(<AdminTopbar />);

    const header = container.querySelector('header[data-shell="topbar"]');
    const breadcrumb = container.querySelector('[data-component="admin-breadcrumb-slot"]');

    expect(header).not.toBeNull();
    expect(breadcrumb?.textContent).toBe("管理");
  });

  it("既定 actions は空の aria-hidden placeholder にする", () => {
    const { container } = render(<AdminTopbar />);

    const actions = container.querySelector('[data-component="admin-topbar-actions"]');

    expect(actions).not.toBeNull();
    expect(actions?.getAttribute("aria-hidden")).toBe("true");
    expect(actions?.textContent).toBe("");
  });

  it("breadcrumb slot と actions slot を差し替えられる", () => {
    const { container } = render(
      <AdminTopbar
        breadcrumb={<span>会員管理</span>}
        actions={<button type="button">新規</button>}
      />,
    );

    const breadcrumb = container.querySelector('[data-component="admin-breadcrumb-slot"]');
    const actions = container.querySelector('[data-component="admin-topbar-actions"]');

    expect(breadcrumb?.textContent).toBe("会員管理");
    expect(screen.getByRole("button", { name: "新規" })).toBeTruthy();
    expect(actions?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("inline 実装と同じ OKLch token class を維持する", () => {
    const { container } = render(<AdminTopbar />);

    const header = container.querySelector('header[data-shell="topbar"]');
    const breadcrumb = container.querySelector('[data-component="admin-breadcrumb-slot"]');

    expect(header?.className).toContain("border-[var(--ubm-color-border-default)]");
    expect(breadcrumb?.className).toContain("text-[var(--ubm-color-text-primary)]");
  });

  it("axe critical 違反 0 を維持する", async () => {
    const { container } = render(<AdminTopbar />);

    const results = await axe(container);
    const critical = results.violations.filter((violation) => violation.impact === "critical");

    expect(critical).toEqual([]);
  });
});
