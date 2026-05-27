import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { MemberGrid } from "../MemberGrid";
import { buildMember } from "../../../test-utils/fixtures/public";

afterEach(() => cleanup());

describe("MemberGrid", () => {
  it("items 件数分の li を density 属性付きでレンダーする (comfy)", () => {
    const items = [
      buildMember({ memberId: "m_1", fullName: "山田 太郎" }),
      buildMember({ memberId: "m_2", fullName: "鈴木 花子" }),
    ];
    const { container } = render(<MemberGrid items={items} density="comfy" />);
    const grid = container.querySelector('[data-component="member-grid"]');
    expect(grid?.getAttribute("data-density")).toBe("comfy");
    expect(grid?.children).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-component="member-card"]'),
    ).toHaveLength(2);
  });

  it("density=dense 時に data-density 属性が反映される (variant)", () => {
    const { container } = render(
      <MemberGrid items={[buildMember()]} density="dense" />,
    );
    const grid = container.querySelector('[data-component="member-grid"]');
    expect(grid?.getAttribute("data-density")).toBe("dense");
  });

  it("density=list 時に prototype list header と card rows を描画する", () => {
    const { container } = render(
      <MemberGrid items={[buildMember()]} density="list" />,
    );
    const grid = container.querySelector('[data-component="member-grid"]');
    expect(grid?.getAttribute("data-density")).toBe("list");
    expect(container.querySelector('[data-role="list-head"]')).toBeTruthy();
    expect(
      container.querySelector('[data-component="member-card"][data-density="list"]'),
    ).toBeTruthy();
  });

  it("items 空配列でも grid 自体はレンダーされる (empty)", () => {
    const { container } = render(<MemberGrid items={[]} density="comfy" />);
    const grid = container.querySelector('[data-component="member-grid"]');
    expect(grid).toBeTruthy();
    expect(grid?.children).toHaveLength(0);
  });
});
