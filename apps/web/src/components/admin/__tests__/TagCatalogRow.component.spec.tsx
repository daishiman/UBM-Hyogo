import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TagCatalogRow } from "../TagCatalogRow";
import type {
  TagDefinitionItem,
  TagLifecycleOperation,
} from "../tagCatalogLifecycle";

const tag = (overrides: Partial<TagDefinitionItem> = {}): TagDefinitionItem => ({
  tagId: "tag_1",
  code: "supporter",
  label: "サポーター",
  category: "role",
  active: true,
  ...overrides,
});

afterEach(() => cleanup());

describe("TagCatalogRow", () => {
  it("active row shows logical delete and physical delete only", () => {
    render(
      <TagCatalogRow
        tag={tag({ active: true })}
        busyOperation={null}
        onOperation={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "サポーターをしまう" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "サポーターを完全削除" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "サポーターを棚に戻す" })).toBeNull();
    expect(screen.getByText("有効")).toBeTruthy();
  });

  it("inactive row shows reactivate and physical delete only", () => {
    render(
      <TagCatalogRow
        tag={tag({ active: false })}
        busyOperation={null}
        onOperation={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "サポーターを棚に戻す" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "サポーターを完全削除" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "サポーターをしまう" })).toBeNull();
    expect(screen.getByText("停止中")).toBeTruthy();
  });

  it("emits the selected lifecycle operation and shows row error", () => {
    const onOperation = vi.fn<
      (tag: TagDefinitionItem, operation: TagLifecycleOperation) => void
    >();
    const row = tag({ active: false });
    render(
      <TagCatalogRow
        tag={row}
        busyOperation={null}
        errorMessage="3人に使用中のため削除不可"
        onOperation={onOperation}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "サポーターを棚に戻す" }));

    expect(onOperation).toHaveBeenCalledWith(row, "reactivate");
    expect(screen.getByRole("alert").textContent).toContain(
      "3人に使用中のため削除不可",
    );
  });
});
