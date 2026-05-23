import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { AdminQueuePanel } from "../AdminQueuePanel";

afterEach(() => cleanup());

const items = [
  { id: "1", listNode: <span>item-1</span> },
  { id: "2", listNode: <span>item-2</span> },
];

describe("AdminQueuePanel", () => {
  it("TC-QP-01: items を listbox にすべて render する", () => {
    render(
      <AdminQueuePanel
        items={items}
        selectedId={null}
        onSelect={() => {}}
        detail={<div>detail</div>}
      />,
    );
    expect(screen.getByText("item-1")).toBeDefined();
    expect(screen.getByText("item-2")).toBeDefined();
  });

  it("TC-QP-02: 行クリックで onSelect が呼ばれる", () => {
    const onSelect = vi.fn();
    render(
      <AdminQueuePanel
        items={items}
        selectedId={null}
        onSelect={onSelect}
        detail={<div>detail</div>}
      />,
    );
    fireEvent.click(screen.getByText("item-2"));
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("TC-QP-03: selectedId 行に aria-selected=true が付く", () => {
    render(
      <AdminQueuePanel
        items={items}
        selectedId="2"
        onSelect={() => {}}
        detail={<div>detail</div>}
      />,
    );
    const opts = screen.getAllByRole("option");
    expect(opts[0].getAttribute("aria-selected")).toBe("false");
    expect(opts[1].getAttribute("aria-selected")).toBe("true");
  });

  it("TC-QP-04: items が空のとき emptyState (default) を表示する", () => {
    render(
      <AdminQueuePanel
        items={[]}
        selectedId={null}
        onSelect={() => {}}
        detail={<div>detail</div>}
      />,
    );
    expect(screen.getByText("未処理のアイテムはありません")).toBeDefined();
  });

  it("TC-QP-05: detail pane を render する", () => {
    render(
      <AdminQueuePanel
        items={items}
        selectedId="1"
        onSelect={() => {}}
        detail={<div data-testid="detail">DETAIL</div>}
      />,
    );
    expect(screen.getByTestId("detail").textContent).toBe("DETAIL");
  });
});
