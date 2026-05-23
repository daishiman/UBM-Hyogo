import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { SelectedTagsBar } from "../SelectedTagsBar.client";

afterEach(() => cleanup());

describe("SelectedTagsBar", () => {
  it("selected が空のとき何もレンダーしない", () => {
    const { container } = render(
      <SelectedTagsBar
        selected={[]}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("× クリックで onRemove が呼ばれる", () => {
    const onRemove = vi.fn();
    render(
      <SelectedTagsBar
        selected={["foo"]}
        onRemove={onRemove}
        onClearAll={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "#foo ×" }));
    expect(onRemove).toHaveBeenCalledWith("foo");
  });

  it("clear-all クリックで onClearAll が呼ばれる", () => {
    const onClearAll = vi.fn();
    render(
      <SelectedTagsBar
        selected={["a"]}
        onRemove={vi.fn()}
        onClearAll={onClearAll}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "すべてクリア" }));
    expect(onClearAll).toHaveBeenCalled();
  });
});
