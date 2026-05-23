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
  it("form[role=search] / 3 つの Select / クリアボタンをレンダーする", () => {
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
    const clearBtn = container.querySelector(
      '[data-role="clear"]',
    ) as HTMLButtonElement | null;
    expect(clearBtn).toBeTruthy();
    expect(clearBtn?.disabled).toBe(true);
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

  it("フィルタ条件があるときクリアボタンが活性化し、押下で /members に遷移する", () => {
    const { container } = render(
      <MemberFilters
        initial={{ ...baseInitial, q: "山田" }}
      />,
    );
    const clearBtn = container.querySelector(
      '[data-component="member-filters"] [data-role="clear"]',
    ) as HTMLButtonElement;
    expect(clearBtn).toBeTruthy();
    expect(clearBtn.disabled).toBe(false);
    fireEvent.click(clearBtn);
    expect(replaceMock).toHaveBeenLastCalledWith("/members");
  });
});
