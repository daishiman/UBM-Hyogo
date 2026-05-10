// task-15: MembersFilters TC-MF-01〜05
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MembersFilters, type MembersFilterValue } from "../_members/MembersFilters";

afterEach(() => cleanup());

const baseValue: MembersFilterValue = { q: "", zone: "all", filter: "", sort: "recent" };

describe("MembersFilters", () => {
  it("TC-MF-01: zone select 変更で onChange 発火", () => {
    const onChange = vi.fn();
    render(<MembersFilters value={baseValue} onChange={onChange} zoneOptions={[
      { value: "all", label: "全て" },
      { value: "zone_0_1", label: "Zone 0-1" },
    ]} />);
    fireEvent.change(screen.getByLabelText("ゾーン"), { target: { value: "zone_0_1" } });
    expect(onChange).toHaveBeenCalledWith({ zone: "zone_0_1" });
  });

  it("TC-MF-02: filter select 変更", () => {
    const onChange = vi.fn();
    render(<MembersFilters value={baseValue} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("状態"), { target: { value: "published" } });
    expect(onChange).toHaveBeenCalledWith({ filter: "published" });
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

  it.todo("a11y violations 0");
});
