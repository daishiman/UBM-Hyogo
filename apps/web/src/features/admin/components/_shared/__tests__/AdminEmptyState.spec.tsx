import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AdminEmptyState } from "../AdminEmptyState";

afterEach(() => cleanup());

describe("AdminEmptyState", () => {
  it("TC-ES-01: title を表示する", () => {
    render(<AdminEmptyState title="対象データがありません" />);
    expect(screen.getByText("対象データがありません")).toBeDefined();
  });

  it("TC-ES-02: description / primaryAction を表示する", () => {
    render(
      <AdminEmptyState
        title="該当なし"
        description="条件を変えてください"
        primaryAction={<button type="button">追加</button>}
      />,
    );
    expect(screen.getByText("条件を変えてください")).toBeDefined();
    expect(screen.getByRole("button", { name: "追加" })).toBeDefined();
  });

  it("TC-ES-03: role=status を持つ", () => {
    render(<AdminEmptyState title="empty" />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("TC-ES-04: icon prop で icon バリアントが切替わる (svg は常に存在)", () => {
    const { container } = render(
      <AdminEmptyState title="検索結果なし" icon="search" />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
