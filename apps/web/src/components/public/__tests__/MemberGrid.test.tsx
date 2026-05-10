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
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("density=dense 時に data-density 属性が反映される (variant)", () => {
    const { container } = render(
      <MemberGrid items={[buildMember()]} density="dense" />,
    );
    const grid = container.querySelector('[data-component="member-grid"]');
    expect(grid?.getAttribute("data-density")).toBe("dense");
  });

  it("items 空配列でも grid 自体はレンダーされる (empty)", () => {
    const { container } = render(<MemberGrid items={[]} density="comfy" />);
    const grid = container.querySelector('[data-component="member-grid"]');
    expect(grid).toBeTruthy();
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });
});
