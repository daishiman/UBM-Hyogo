import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SidebarTooltip } from "../SidebarTooltip";

afterEach(() => cleanup());

describe("SidebarTooltip", () => {
  it("collapsed=false では children を直返しし tooltip を描画しない", () => {
    const { container } = render(
      <SidebarTooltip label="メンバー" collapsed={false}>
        <button type="button" aria-label="メンバー">
          icon
        </button>
      </SidebarTooltip>,
    );

    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    expect(container.querySelector("button")?.getAttribute("aria-describedby")).toBeNull();
  });

  it("collapsed=true では role=tooltip と aria-describedby を接続する", () => {
    const { container } = render(
      <SidebarTooltip label="メンバー" collapsed>
        <button type="button" aria-label="メンバー">
          icon
        </button>
      </SidebarTooltip>,
    );

    const tooltip = container.querySelector('[role="tooltip"]');
    const button = container.querySelector("button");
    expect(tooltip?.textContent).toBe("メンバー");
    expect(tooltip?.id).toBeTruthy();
    expect(button?.getAttribute("aria-describedby")).toBe(tooltip?.id);
    expect(button?.getAttribute("aria-label")).toBe("メンバー");
  });

  it("既存 aria-describedby がある場合は tooltip id を連結する", () => {
    const { container } = render(
      <SidebarTooltip label="展開" collapsed>
        <button type="button" aria-label="展開" aria-describedby="existing-description">
          icon
        </button>
      </SidebarTooltip>,
    );

    const tooltip = container.querySelector('[role="tooltip"]');
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-describedby")).toBe(
      `existing-description ${tooltip?.id}`,
    );
  });
});
