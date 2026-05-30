// parallel-03 S-03: Member AppShell layout spec
import type { ReactNode } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { axe } from "../../src/test/axe";

vi.mock("../../src/lib/auth-view", () => ({
  getAuthView: async () => ({ kind: "member", displayName: "Member" }),
}));

import MemberLayout from "./layout";

afterEach(() => cleanup());

async function renderLayout(children: ReactNode) {
  return render(await MemberLayout({ children }));
}

describe("MemberLayout", () => {
  it("wrapper に data-theme='warm' / data-route-group='member' / data-testid='member-shell' を付与する", async () => {
    const { container } = await renderLayout(<p data-testid="child">child</p>);
    const shell = container.querySelector('[data-testid="member-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute("data-theme")).toBe("warm");
    expect(shell?.getAttribute("data-route-group")).toBe("member");
  });

  it("data-shell='topbar' と main[data-route='member'] を含み children を main 内に render", async () => {
    const { container } = await renderLayout(<p data-testid="child">child</p>);
    expect(container.querySelector('[data-shell="topbar"]')).not.toBeNull();
    const main = container.querySelector('main[data-route="member"]');
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
