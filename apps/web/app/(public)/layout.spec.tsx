// parallel-03 S-01: Public AppShell layout spec
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { axe } from "../../src/test/axe";

import PublicLayout from "./layout";

afterEach(() => cleanup());

describe("PublicLayout", () => {
  it("wrapper に data-theme='warm' / data-route-group='public' / data-testid='public-shell' を付与する", () => {
    const { container } = render(
      <PublicLayout>
        <p data-testid="child">child</p>
      </PublicLayout>,
    );
    const shell = container.querySelector('[data-testid="public-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute("data-theme")).toBe("warm");
    expect(shell?.getAttribute("data-route-group")).toBe("public");
  });

  it("data-shell='topbar' / data-shell='footer' / main[data-route='public'] を含む", () => {
    const { container } = render(
      <PublicLayout>
        <p data-testid="child">child</p>
      </PublicLayout>,
    );
    expect(container.querySelector('[data-shell="topbar"]')).not.toBeNull();
    expect(container.querySelector('[data-shell="footer"]')).not.toBeNull();
    const main = container.querySelector('main[data-route="public"]');
    expect(main).not.toBeNull();
    expect(main?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("axe critical 違反 0", async () => {
    const { container } = render(
      <PublicLayout>
        <p>child</p>
      </PublicLayout>,
    );
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
