// followup-003: MembersFilters プロトタイプ整合後の TC-MF-01〜05
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";
import { MembersFilters, type MembersFilterValue } from "../_members/MembersFilters";

afterEach(() => cleanup());

const baseValue: MembersFilterValue = { q: "", zone: "all", filter: "", sort: "recent" };

describe("MembersFilters", () => {
  it("TC-MF-01: PillNav で公開フィルター切替", () => {
    const onChange = vi.fn();
    render(<MembersFilters value={baseValue} onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "公開" }));
    expect(onChange).toHaveBeenCalledWith({ filter: "published" });
  });

  it("TC-MF-02: PillNav で退会フィルター切替", () => {
    const onChange = vi.fn();
    render(<MembersFilters value={baseValue} onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "退会" }));
    expect(onChange).toHaveBeenCalledWith({ filter: "deleted" });
  });

  it("TC-MF-03: sort select 変更", () => {
    const onChange = vi.fn();
    render(<MembersFilters value={baseValue} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("並び順"), { target: { value: "name" } });
    expect(onChange).toHaveBeenCalledWith({ sort: "name" });
  });

  it("TC-MF-04: 自由検索は onBlur で確定", () => {
    const onChange = vi.fn();
    render(<MembersFilters value={baseValue} onChange={onChange} />);
    const input = screen.getByLabelText("会員検索");
    fireEvent.change(input, { target: { value: "yamada" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith({ q: "yamada" });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("TC-MF-05: loading=true で「更新中…」表示", () => {
    render(<MembersFilters value={baseValue} onChange={() => {}} loading />);
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("更新中");
  });

  it("TC-MF-06: totalCount を表示", () => {
    render(
      <MembersFilters value={baseValue} onChange={() => {}} totalCount={1234} />,
    );
    expect(screen.getByText("1,234 件")).toBeDefined();
  });

  it("a11y violations 0", async () => {
    const { container } = render(<MembersFilters value={baseValue} onChange={() => {}} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
