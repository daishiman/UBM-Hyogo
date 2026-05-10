// task-15: KpiGrid TC-KG-01〜04
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { KpiGrid } from "../_dashboard/KpiGrid";

afterEach(() => cleanup());

describe("KpiGrid", () => {
  it("TC-KG-01: 4 セルが描画される", () => {
    render(
      <KpiGrid
        totals={{ totalMembers: 100, publicMembers: 50, untaggedMembers: 0, unresolvedSchema: 0 }}
      />,
    );
    expect(screen.getByText("Total members")).toBeDefined();
    expect(screen.getByText("Public on site")).toBeDefined();
    expect(screen.getByText("Untagged")).toBeDefined();
    expect(screen.getByText("Schema issues")).toBeDefined();
  });

  it("TC-KG-02: unresolvedSchema=0 で success tone", () => {
    render(
      <KpiGrid totals={{ totalMembers: 100, publicMembers: 50, untaggedMembers: 0, unresolvedSchema: 0 }} />,
    );
    const card = screen.getByTestId("admin-kpi-card-schema");
    const value = card.querySelector("strong");
    expect(value?.className).toContain("text-[var(--ubm-color-ok)]");
  });

  it("TC-KG-03: unresolvedSchema>0 で danger tone", () => {
    render(
      <KpiGrid totals={{ totalMembers: 100, publicMembers: 50, untaggedMembers: 0, unresolvedSchema: 5 }} />,
    );
    const card = screen.getByTestId("admin-kpi-card-schema");
    const value = card.querySelector("strong");
    expect(value?.className).toContain("text-[var(--ubm-color-danger)]");
  });

  it("TC-KG-04: untaggedMembers>0 で warning tone", () => {
    render(
      <KpiGrid totals={{ totalMembers: 100, publicMembers: 50, untaggedMembers: 3, unresolvedSchema: 0 }} />,
    );
    const card = screen.getByTestId("admin-kpi-card-untagged");
    const value = card.querySelector("strong");
    expect(value?.className).toContain("text-[var(--ubm-color-warn)]");
  });

  it.todo("a11y violations 0");
});
