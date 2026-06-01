import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useState } from "react";

import { SelectedFiltersBar } from "../SelectedFiltersBar.client";
import type { MembersSearch } from "../../../lib/url/members-search";

const baseSearch: MembersSearch = {
  q: "",
  zone: "all",
  status: "all",
  tag: [],
  sort: "recent",
  density: "comfy",
};

afterEach(() => cleanup());

describe("SelectedFiltersBar", () => {
  it("絞り込み条件が空なら何も描画しない", () => {
    const { container } = render(
      <SelectedFiltersBar
        search={baseSearch}
        onPatch={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("q / zone / status / tag を chip 化し、sort は chip 化しない", () => {
    const onPatch = vi.fn();
    render(
      <SelectedFiltersBar
        search={{
          ...baseSearch,
          q: "山田",
          zone: "0_to_1",
          status: "member",
          tag: ["ai"],
          sort: "name",
        }}
        onPatch={onPatch}
        onClearAll={vi.fn()}
        tagLabels={{ ai: "AI" }}
      />,
    );

    expect(screen.getByRole("button", { name: "キーワード絞り込みを解除" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "区画絞り込みを解除" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "種別絞り込みを解除" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "AI タグ絞り込みを解除" })).toBeTruthy();
    expect(screen.getByText("#AI ×")).toBeTruthy();
    expect(screen.queryByText(/名前順/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "区画絞り込みを解除" }));
    expect(onPatch).toHaveBeenCalledWith({ zone: "all" });
  });

  it("すべてクリアで onClearAll を呼ぶ", () => {
    const onClearAll = vi.fn();
    render(
      <SelectedFiltersBar
        search={{ ...baseSearch, q: "山田" }}
        onPatch={vi.fn()}
        onClearAll={onClearAll}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "絞り込みをクリア" }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it("topTags にない tag code は code 表示に fallback する", () => {
    render(
      <SelectedFiltersBar
        search={{ ...baseSearch, tag: ["unknown"] }}
        onPatch={vi.fn()}
        onClearAll={vi.fn()}
        tagLabels={{ ai: "AI" }}
      />,
    );
    expect(screen.getByText("#unknown ×")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "unknown タグ絞り込みを解除" }),
    ).toBeTruthy();
  });

  it("prototype property 名の tag code も own property 以外は code 表示に fallback する", () => {
    render(
      <SelectedFiltersBar
        search={{ ...baseSearch, tag: ["toString", "constructor"] }}
        onPatch={vi.fn()}
        onClearAll={vi.fn()}
        tagLabels={{ ai: "AI" }}
      />,
    );
    expect(screen.getByText("#toString ×")).toBeTruthy();
    expect(screen.getByText("#constructor ×")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "toString タグ絞り込みを解除" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "constructor タグ絞り込みを解除" }),
    ).toBeTruthy();
  });

  it("chip 削除後は次 chip、末尾なら前 chip に focus を戻す", () => {
    function ControlledBar() {
      const [search, setSearch] = useState<MembersSearch>({
        ...baseSearch,
        q: "山田",
        zone: "0_to_1",
        tag: ["ai"],
      });
      return (
        <SelectedFiltersBar
          search={search}
          onPatch={(patch) => setSearch((prev) => ({ ...prev, ...patch }))}
          onClearAll={vi.fn()}
          tagLabels={{ ai: "AI" }}
        />
      );
    }

    render(<ControlledBar />);
    fireEvent.click(
      screen.getByRole("button", { name: "キーワード絞り込みを解除" }),
    );
    expect(screen.getByRole("button", { name: "区画絞り込みを解除" })).toBe(
      document.activeElement,
    );

    fireEvent.click(screen.getByRole("button", { name: "AI タグ絞り込みを解除" }));
    expect(screen.getByRole("button", { name: "区画絞り込みを解除" })).toBe(
      document.activeElement,
    );
  });

  it("最後の chip 削除時は onEmpty に fallback focus を委譲する", () => {
    const onEmpty = vi.fn();
    function ControlledBar() {
      const [search, setSearch] = useState<MembersSearch>({
        ...baseSearch,
        tag: ["ai"],
      });
      return (
        <SelectedFiltersBar
          search={search}
          onPatch={(patch) => setSearch((prev) => ({ ...prev, ...patch }))}
          onClearAll={vi.fn()}
          tagLabels={{ ai: "AI" }}
          onEmpty={onEmpty}
        />
      );
    }

    render(<ControlledBar />);
    fireEvent.click(screen.getByRole("button", { name: "AI タグ絞り込みを解除" }));
    expect(onEmpty).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "AI タグ絞り込みを解除" })).toBeNull();
  });
});
