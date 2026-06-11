import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ZoneSlice } from "../../../../../lib/admin/admin-dashboard-ui";
import { ZoneDistribution } from "../ZoneDistribution";

afterEach(() => {
  cleanup();
});

const slices: ReadonlyArray<ZoneSlice> = [
  { key: "0to1", label: "0→1", hint: "立ち上げ", count: 3, total: 11, tone: "info" },
  { key: "1to10", label: "1→10", hint: "拡大", count: 7, total: 11, tone: "accent" },
  { key: "10to100", label: "10→100", hint: "組織化", count: 1, total: 11, tone: "ok" },
];

describe("ZoneDistribution", () => {
  it("slices=3 件で role=img / aria-label visible", () => {
    render(<ZoneDistribution slices={slices} />);
    const img = screen.getByRole("img", { name: /zone 別人数/i });
    expect(img).toBeTruthy();
  });

  it("各 li が Chip+label+hint+count(mono) の構造を持つ", () => {
    const { container } = render(<ZoneDistribution slices={slices} />);
    const items = container.querySelectorAll("li");
    expect(items.length).toBe(3);
    expect(screen.getByText("会員分布")).toBeDefined();
    expect(screen.queryByText("DISTRIBUTION")).toBeNull();
    expect(container.textContent).toContain("0→1");
    expect(container.textContent).toContain("立ち上げ");
    expect(container.textContent).toContain("3名");
    expect(container.textContent).toContain("10→100");
    expect(container.textContent).toContain("組織化");
  });

  it("slices=undefined で placeholder のみ表示", () => {
    render(<ZoneDistribution slices={undefined} />);
    expect(screen.queryByRole("img", { name: /zone 別人数/i })).toBeNull();
    expect(screen.getByText("会員分布")).toBeDefined();
    expect(screen.getByRole("status").textContent).toMatch(/集計対象外/);
  });

  it("inline style に HEX 直書きが含まれない (var(--ubm-color-*) のみ)", () => {
    const { container } = render(<ZoneDistribution slices={slices} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(html).toMatch(/var\(--ubm-color-/);
  });
});
