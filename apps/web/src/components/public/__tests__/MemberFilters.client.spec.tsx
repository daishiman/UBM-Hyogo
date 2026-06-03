import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const replaceMock = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParams,
  usePathname: () => "/members",
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
  it("form[role=search] / 3 つの Select をレンダーし、説明文と紐付く", () => {
    const { container } = render(<MemberFilters initial={baseInitial} />);
    expect(
      container.querySelector('[data-component="member-filters"]'),
    ).toBeTruthy();
    expect(
      container.querySelector(
        '[data-component="member-filters"][role="search"]',
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText("ゾーンで絞り込み")).toBeTruthy();
    expect(screen.getByLabelText("種別で絞り込み")).toBeTruthy();
    expect(screen.getByLabelText("並び替え")).toBeTruthy();
    expect(
      container.querySelector('[data-role="filter-grid"]'),
    ).toBeTruthy();
    const form = container.querySelector(
      '[data-component="member-filters"]',
    ) as HTMLElement;
    expect(form.getAttribute("aria-describedby")).toContain(
      "member-search-live-hint",
    );
    expect(screen.queryByRole("button", { name: "絞り込みをクリア" })).toBeNull();
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
        topTags={[{ code: "foo", label: "Foo", count: 3 }]}
      />,
    );
    const tags = container.querySelectorAll('[data-role="active-filters"] li');
    expect(tags).toHaveLength(2);
    const fooBtn = screen.getByRole("button", { name: "Foo タグ絞り込みを解除" });
    expect(screen.getByText("#Foo ×")).toBeTruthy();
    expect(screen.getByText("#bar ×")).toBeTruthy();
    expect(fooBtn.getAttribute("data-component")).toBe("filter-chip");
    fireEvent.click(fooBtn);
    expect(replaceMock).toHaveBeenCalled();
  });

  it("q のみの絞り込みでは検索入力のクリアボタンだけを表示し、押下で /members に遷移する", () => {
    render(
      <MemberFilters
        initial={{ ...baseInitial, q: "山田" }}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "絞り込みをクリア" }),
    ).toBeNull();
    const clearBtn = screen.getByRole("button", { name: "クリア" });
    fireEvent.click(clearBtn);
    expect(replaceMock).toHaveBeenLastCalledWith("/members");
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
    expect(
      container.querySelector('[data-role="tag-picker-heading"]')?.textContent,
    ).toBe("タグで絞り込み");
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
    const clearBtn = screen.getByRole("button", { name: "絞り込みをクリア" });
    fireEvent.click(clearBtn);
    expect(replaceMock).toHaveBeenCalledWith("/members");
  });

  it("最後の selected filter 削除時は検索入力へ focus を戻す", () => {
    render(
      <MemberFilters
        initial={{ ...baseInitial, tag: ["foo"] }}
        topTags={[{ code: "foo", label: "Foo", count: 3 }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Foo タグ絞り込みを解除" }));
    expect(screen.getByPlaceholderText("名前・職業・地域で検索")).toBe(
      document.activeElement,
    );
  });

  it("live-filter hint と結果件数 status を描画する", () => {
    const { container } = render(
      <MemberFilters initial={baseInitial} totalCount={23} displayedCount={10} />,
    );
    expect(container.querySelector('[data-role="live-filter-hint"]')?.textContent).toBe(
      "入力すると即反映されます",
    );
    expect(screen.getByRole("status").textContent).toBe(
      "23 件中 10 件を表示しています",
    );
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
