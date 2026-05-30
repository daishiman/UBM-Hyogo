import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

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
      />,
    );

    expect(screen.getByRole("button", { name: "キーワード絞り込みを解除" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "区画絞り込みを解除" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "種別絞り込みを解除" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "ai タグ絞り込みを解除" })).toBeTruthy();
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
});
