// followup-001 T-5.4: pill-nav + 件数 + debounced search 仕様
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { axe } from "jest-axe";
import { MembersFilters, type MembersFilterValue } from "../_members/MembersFilters";

afterEach(() => cleanup());

const baseValue: MembersFilterValue = { q: "", zone: "all", filter: "", sort: "recent" };

describe("MembersFilters (followup-001)", () => {
  it("renders 4 pill options (すべて / 公開中 / 非公開 / 退会済み)", () => {
    render(<MembersFilters value={baseValue} onChange={() => {}} count={3} />);
    const tabs = screen.getAllByRole("tab");
    const labels = tabs.map((t) => t.textContent);
    expect(labels).toEqual(["すべて", "公開中", "非公開", "退会済み"]);
  });

  it("clicking a pill emits filter change", () => {
    const onChange = vi.fn();
    render(<MembersFilters value={baseValue} onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "公開中" }));
    expect(onChange).toHaveBeenCalledWith({ filter: "published" });
  });

  it("displays count badge", () => {
    render(<MembersFilters value={baseValue} onChange={() => {}} count={42} />);
    expect(screen.getByText(/42 件/)).toBeTruthy();
  });

  it("search input is debounced (no onChange until timer fires)", () => {
    vi.useFakeTimers();
    try {
      const onChange = vi.fn();
      render(<MembersFilters value={baseValue} onChange={onChange} debounceMs={300} />);
      const input = screen.getByLabelText("会員検索");
      fireEvent.change(input, { target: { value: "yamada" } });
      expect(onChange).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(onChange).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(2);
      });
      expect(onChange).toHaveBeenCalledWith({ q: "yamada" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("loading=true で「更新中…」status を表示", () => {
    render(<MembersFilters value={baseValue} onChange={() => {}} loading />);
    expect(screen.getByRole("status").textContent).toContain("更新中");
  });

  it("a11y violations 0", async () => {
    const { container } = render(<MembersFilters value={baseValue} onChange={() => {}} count={1} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
