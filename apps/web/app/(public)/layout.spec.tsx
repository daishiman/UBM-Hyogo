// parallel-03 S-01 / task-a: Public AppShell layout spec
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { axe } from "../../src/test/axe";

vi.mock("../../src/components/public/PublicHeader", () => ({
  PublicHeader: () => (
    <div data-testid="public-header-mock" data-component="public-header" />
  ),
}));
vi.mock("../../src/components/public/PublicFooter", () => ({
  PublicFooter: () => <div data-testid="public-footer-mock" />,
}));
vi.mock("../../src/lib/auth-view", () => ({
  getAuthView: vi.fn(async () => ({ kind: "guest" as const })),
}));

import PublicLayout from "./layout";

afterEach(() => cleanup());

async function renderLayout(children: React.ReactNode) {
  const element = await PublicLayout({ children });
  return render(element);
}

describe("PublicLayout", () => {
  it("wrapper に data-theme='warm' / data-route-group='public' / data-testid='public-shell' を付与する", async () => {
    const { container } = await renderLayout(<p data-testid="child">child</p>);
    const shell = container.querySelector('[data-testid="public-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute("data-theme")).toBe("warm");
    expect(shell?.getAttribute("data-route-group")).toBe("public");
    expect(shell?.getAttribute("data-auth-state")).toBe("guest");
  });

  it("data-shell='topbar' / data-shell='footer' / main[data-route='public'] を含む", async () => {
    const { container } = await renderLayout(<p data-testid="child">child</p>);
    expect(container.querySelector('[data-shell="topbar"]')).not.toBeNull();
    expect(container.querySelector('[data-shell="footer"]')).not.toBeNull();
    const main = container.querySelector('main[data-route="public"]');
    expect(main).not.toBeNull();
    expect(main?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("axe critical 違反 0", async () => {
    const { container } = await renderLayout(<p>child</p>);
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
