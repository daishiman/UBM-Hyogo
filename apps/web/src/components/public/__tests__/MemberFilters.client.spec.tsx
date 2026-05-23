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
    expect(fooBtn.getAttribute("data-component")).toBe("tag-pill");
    expect(fooBtn.getAttribute("aria-selected")).toBe("true");
    fireEvent.click(fooBtn);
    expect(replaceMock).toHaveBeenCalled();
  });

  it("topTags を渡すと TagPicker chip が描画される", () => {
    const { container } = render(
      <MemberFilters
        initial={baseInitial}
        topTags={[
          { code: "ai", label: "AI", count: 3 },
          { code: "design", label: "デザイン", count: 1 },
        ]}
      />,
    );
    const chips = container.querySelectorAll(
      '[data-component="tag-picker"] [data-component="tag-pill"]',
    );
    expect(chips).toHaveLength(2);
    fireEvent.click(chips[0] as HTMLElement);
    const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("tag=ai");
  });

  it("選択済みが上限に達すると未選択 chip は aria-disabled で no-op", () => {
    const { container } = render(
      <MemberFilters
        initial={{ ...baseInitial, tag: ["a", "b", "c", "d", "e"] }}
        topTags={[{ code: "f", label: "F", count: 1 }]}
      />,
    );
    const chip = container.querySelector(
      '[data-component="tag-picker"] [data-tag-code="f"]',
    ) as HTMLElement;
    expect(chip.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(chip);
    expect(replaceMock).not.toHaveBeenCalled();
    expect(
      container.querySelector('[data-role="tag-limit-hint"]'),
    ).toBeTruthy();
  });

  it("clear-all ボタンで /members に router.replace される", () => {
    render(
      <MemberFilters initial={{ ...baseInitial, tag: ["foo"] }} />,
    );
    const clearBtn = screen.getByRole("button", { name: "すべてクリア" });
    fireEvent.click(clearBtn);
    expect(replaceMock).toHaveBeenCalledWith("/members");
  });

  it("mobile summary 行 (filters-summary-mobile) が描画され expanded を切替できる", () => {
    const { container } = render(<MemberFilters initial={baseInitial} />);
    const summary = container.querySelector(
      '[data-component="filters-summary-mobile"]',
    ) as HTMLElement;
    expect(summary).toBeTruthy();
    expect(summary.getAttribute("aria-expanded")).toBe("false");
    const root = container.querySelector(
      '[data-component="member-filters"]',
    ) as HTMLElement;
    expect(root.getAttribute("data-expanded")).toBe("false");
    fireEvent.click(summary);
    expect(summary.getAttribute("aria-expanded")).toBe("true");
    expect(root.getAttribute("data-expanded")).toBe("true");
  });
});
