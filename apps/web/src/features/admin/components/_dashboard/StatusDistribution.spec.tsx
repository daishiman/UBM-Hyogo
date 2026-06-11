import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { StatusSlice } from "../../../../lib/admin/admin-dashboard-ui";
import { StatusDistribution } from "./StatusDistribution";

afterEach(() => {
  cleanup();
});

const sampleSlices: ReadonlyArray<StatusSlice> = [
  { status: "public", count: 12 },
  { status: "member_only", count: 8 },
  { status: "hidden", count: 3 },
];

describe("StatusDistribution", () => {
  it("TC-CHART-01: renders placeholder when slices is undefined", () => {
    render(<StatusDistribution slices={undefined} />);

    expect(screen.getByRole("status").textContent).toContain("分布データは現在集計対象外です");
    expect(screen.queryByTestId("status-distribution-chart")).toBeNull();
    expect(screen.queryByTestId("status-distribution-list")).toBeNull();
  });

  it("TC-CHART-02: renders placeholder when slices is empty", () => {
    render(<StatusDistribution slices={[]} />);

    expect(screen.getByRole("status").textContent).toContain("分布データは現在集計対象外です");
    expect(screen.queryByTestId("status-distribution-chart")).toBeNull();
    expect(screen.queryByTestId("status-distribution-list")).toBeNull();
  });

  it("TC-CHART-03/04/06/07/08: renders an accessible horizontal status list when slices are populated", () => {
    const { container } = render(<StatusDistribution slices={sampleSlices} />);

    const list = screen.getByTestId("status-distribution-list");
    expect(list.getAttribute("role")).toBe("img");
    expect(list.getAttribute("aria-label")).toBe("公開ステータス分布: 公開 12, 会員限定 8, 非公開 3");
    expect(screen.queryByTestId("status-distribution-chart")).toBeNull();
    const bars = Array.from(container.querySelectorAll('[data-testid="status-bar"]'));
    expect(bars).toHaveLength(3);
    expect(bars.map((bar) => bar.getAttribute("data-status"))).toEqual(["public", "member_only", "hidden"]);
    expect(screen.getByText("公開")).toBeDefined();
    expect(screen.getByText("会員限定")).toBeDefined();
    expect(screen.getByText("非公開")).toBeDefined();
    expect(screen.getByText("12名")).toBeDefined();
    expect(screen.getByText("8名")).toBeDefined();
    expect(screen.getByText("3名")).toBeDefined();
  });

  it("TC-CHART-05: scales bars proportionally by count", () => {
    const { container } = render(<StatusDistribution slices={sampleSlices} />);

    const bars = Array.from(container.querySelectorAll('[data-testid="status-bar"] svg rect:last-child'));
    const widths = bars.map((rect) => Number(rect.getAttribute("width")));
    expect(widths[0]).toBeGreaterThan(widths[1]);
    expect(widths[1]).toBeGreaterThan(widths[2]);
  });

  it("TC-CHART-09/10: uses OKLch token variables and no HEX colors in chart markup", () => {
    const { container } = render(<StatusDistribution slices={sampleSlices} />);

    const fills = Array.from(container.querySelectorAll('[data-testid="status-bar"] svg rect:last-child')).map(
      (rect) => rect.getAttribute("fill") ?? "",
    );
    expect(fills).toEqual(["var(--ubm-color-ok)", "var(--ubm-color-info)", "var(--ubm-color-warn)"]);
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("TC-CHART-11/12/13: renders tooltips, zero-count data, and partial status data without throwing", () => {
    const { container, rerender } = render(
      <StatusDistribution
        slices={[
          { status: "public", count: 0 },
          { status: "member_only", count: 0 },
          { status: "hidden", count: 0 },
        ]}
      />,
    );

    expect(container.querySelectorAll("title")).toHaveLength(3);
    const zeroWidths = Array.from(container.querySelectorAll('[data-testid="status-bar"] svg rect:last-child')).map((rect) =>
      Number(rect.getAttribute("width")),
    );
    expect(zeroWidths.every((width) => Number.isFinite(width) && width === 0)).toBe(true);

    rerender(<StatusDistribution slices={[{ status: "public", count: 5 }]} />);
    expect(container.querySelectorAll('[data-testid="status-bar"]')).toHaveLength(1);
    expect(screen.getByTestId("status-distribution-list").getAttribute("aria-label")).toBe(
      "公開ステータス分布: 公開 5",
    );
  });

  it("TC-CHART-14: preserves props contract and falls back when all slices are dropped", () => {
    const _props: { readonly slices: ReadonlyArray<StatusSlice> | undefined } = {
      slices: undefined,
    } satisfies ComponentProps<typeof StatusDistribution>;

    render(<StatusDistribution slices={[]} />);

    expect(_props.slices).toBeUndefined();
    expect(screen.getByRole("status").textContent).toContain("分布データは現在集計対象外です");
  });
});
