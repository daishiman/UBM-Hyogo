import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const replaceMock = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParams,
}));

import { MemberFilters } from "../MemberFilters.client";
import type { MembersSearch } from "../../../lib/url/members-search";

const baseInitial: MembersSearch = {
  q: "",
  zone: "all",
  status: "all",
  tag: [],
  sort: "recent",
  density: "comfy",
};

beforeEach(() => {
  replaceMock.mockClear();
});

afterEach(() => cleanup());

describe("MemberFilters", () => {
  it("Search / 2 つの Select / Segmented / DensityToggle をレンダーする", () => {
    const { container } = render(<MemberFilters initial={baseInitial} />);
    expect(
      container.querySelector('[data-component="member-filters"]'),
    ).toBeTruthy();
    expect(screen.getByLabelText("ゾーンで絞り込み")).toBeTruthy();
    expect(screen.getByLabelText("種別で絞り込み")).toBeTruthy();
    expect(
      screen.getByRole("radiogroup", { name: "表示密度" }),
    ).toBeTruthy();
  });

  it("ゾーンを選択すると router.replace が呼ばれる", () => {
    render(<MemberFilters initial={baseInitial} />);
    const zoneSelect = screen.getByLabelText(
      "ゾーンで絞り込み",
    ) as HTMLSelectElement;
    fireEvent.change(zoneSelect, { target: { value: "0_to_1" } });
    expect(replaceMock).toHaveBeenCalled();
    const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("zone=0_to_1");
  });

  it("tag が指定済みの場合 active-tags リストを描画し × ボタンで削除できる", () => {
    const { container } = render(
      <MemberFilters
        initial={{ ...baseInitial, tag: ["foo", "bar"] }}
      />,
    );
    const tags = container.querySelectorAll('[data-role="active-tags"] li');
    expect(tags).toHaveLength(2);
    const fooBtn = screen.getByRole("button", { name: "#foo ×" });
    fireEvent.click(fooBtn);
    expect(replaceMock).toHaveBeenCalled();
  });

  it("active tag button has data-component='tag-pill' / data-selected='true' / aria-pressed='true' (G3-1)", () => {
    render(<MemberFilters initial={{ ...baseInitial, tag: ["foo"] }} />);
    const fooBtn = screen.getByRole("button", { name: "#foo ×" });
    expect(fooBtn.getAttribute("data-component")).toBe("tag-pill");
    expect(fooBtn.getAttribute("data-selected")).toBe("true");
    expect(fooBtn.getAttribute("aria-pressed")).toBe("true");
    expect(fooBtn.hasAttribute("aria-selected")).toBe(false);
  });
});
