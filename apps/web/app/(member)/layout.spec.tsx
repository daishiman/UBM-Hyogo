// parallel-03 S-03: Member AppShell layout spec
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { axe } from "../../src/test/axe";

import MemberLayout from "./layout";

afterEach(() => cleanup());

describe("MemberLayout", () => {
  it("wrapper に data-theme='warm' / data-route-group='member' / data-testid='member-shell' を付与する", () => {
    const { container } = render(
      <MemberLayout>
        <p data-testid="child">child</p>
      </MemberLayout>,
    );
    const shell = container.querySelector('[data-testid="member-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute("data-theme")).toBe("warm");
    expect(shell?.getAttribute("data-route-group")).toBe("member");
  });

  it("data-shell='topbar' と main[data-route='member'] を含み children を main 内に render", () => {
    const { container } = render(
      <MemberLayout>
        <p data-testid="child">child</p>
      </MemberLayout>,
    );
    expect(container.querySelector('[data-shell="topbar"]')).not.toBeNull();
    const main = container.querySelector('main[data-route="member"]');
    expect(main).not.toBeNull();
    expect(main?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("axe critical 違反 0", async () => {
    const { container } = render(
      <MemberLayout>
        <p>child</p>
      </MemberLayout>,
    );
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
