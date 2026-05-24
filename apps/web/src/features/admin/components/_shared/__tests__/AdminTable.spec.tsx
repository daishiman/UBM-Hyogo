import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { AdminTable, type AdminTableColumn } from "../AdminTable";

afterEach(() => cleanup());

interface Row {
  id: string;
  name: string;
  age: number;
}

const rows: Row[] = [
  { id: "a", name: "Charlie", age: 30 },
  { id: "b", name: "Alice", age: 20 },
  { id: "c", name: "Bob", age: 25 },
];

const columns: AdminTableColumn<Row>[] = [
  { key: "name", header: "氏名", sortable: true },
  { key: "age", header: "年齢", sortable: true, align: "right" },
];

describe("AdminTable", () => {
  it("TC-TB-01: 行をすべて render する", () => {
    render(<AdminTable columns={columns} rows={rows} getRowKey={(r) => r.id} />);
    expect(screen.getByText("Charlie")).toBeDefined();
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
  });

  it("TC-TB-02: 行クリックで onRowSelect が呼ばれる", () => {
    const onSelect = vi.fn();
    render(
      <AdminTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        onRowSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText("Charlie").closest("tr")!);
    expect(onSelect).toHaveBeenCalledWith(rows[0]);
  });

  it("TC-TB-03: 空配列で emptyState を表示する", () => {
    render(
      <AdminTable
        columns={columns}
        rows={[]}
        getRowKey={(r) => r.id}
        emptyState={<div data-testid="empty">empty</div>}
      />,
    );
    expect(screen.getByTestId("empty")).toBeDefined();
  });

  it("TC-TB-04: sortable header click で sort が切り替わる", () => {
    render(<AdminTable columns={columns} rows={rows} getRowKey={(r) => r.id} />);
    fireEvent.click(screen.getByRole("button", { name: /氏名/ }));
    const cells = screen.getAllByRole("cell").filter((c) => /Alice|Bob|Charlie/.test(c.textContent ?? ""));
    expect(cells[0].textContent).toBe("Alice");
    fireEvent.click(screen.getByRole("button", { name: /氏名/ }));
    const cellsDesc = screen.getAllByRole("cell").filter((c) => /Alice|Bob|Charlie/.test(c.textContent ?? ""));
    expect(cellsDesc[0].textContent).toBe("Charlie");
  });

  it("TC-TB-05: caption を render する (a11y)", () => {
    render(
      <AdminTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        caption="会員一覧"
      />,
    );
    expect(screen.getByText("会員一覧").tagName).toBe("CAPTION");
  });

  it("TC-TB-06: selectedKey が data-selected に反映される", () => {
    const { container } = render(
      <AdminTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        selectedKey="b"
      />,
    );
    const selected = container.querySelector("tr[data-selected]");
    expect(selected?.textContent).toContain("Alice");
  });
});
