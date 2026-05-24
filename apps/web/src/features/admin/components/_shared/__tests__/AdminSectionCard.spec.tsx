import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AdminSectionCard } from "../AdminSectionCard";

afterEach(() => cleanup());

describe("AdminSectionCard", () => {
  it("TC-SC-01: title と children を render する", () => {
    render(
      <AdminSectionCard title="KPI">
        <span data-testid="body">child</span>
      </AdminSectionCard>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "KPI" })).toBeDefined();
    expect(screen.getByTestId("body").textContent).toBe("child");
  });

  it("TC-SC-02: description と actions を render する", () => {
    render(
      <AdminSectionCard
        title="Members"
        description="登録会員 100 件"
        actions={<button type="button">追加</button>}
      >
        body
      </AdminSectionCard>,
    );
    expect(screen.getByText("登録会員 100 件")).toBeDefined();
    expect(screen.getByRole("button", { name: "追加" })).toBeDefined();
  });

  it("TC-SC-03: aria-labelledby が title id と紐づく", () => {
    const { container } = render(
      <AdminSectionCard title="Schema">body</AdminSectionCard>,
    );
    const section = container.querySelector("section");
    const heading = container.querySelector("h2");
    expect(section?.getAttribute("aria-labelledby")).toBe(heading?.id);
  });

  it("TC-SC-04: density compact で marker class が付く", () => {
    const { container } = render(
      <AdminSectionCard title="Queue" density="compact">
        body
      </AdminSectionCard>,
    );
    expect(container.querySelector("section")?.dataset["density"]).toBe("compact");
  });

  it("TC-SC-05: as prop で element tag を変更できる", () => {
    const { container } = render(
      <AdminSectionCard title="Article" as="article">
        body
      </AdminSectionCard>,
    );
    expect(container.querySelector("article")).not.toBeNull();
    expect(container.querySelector("section")).toBeNull();
  });
});
