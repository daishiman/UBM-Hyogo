import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AdminSectionError } from "../AdminSectionError";

afterEach(() => cleanup());

describe("AdminSectionError", () => {
  it("TC-SE-01: sectionLabel を見出しに含める", () => {
    render(<AdminSectionError sectionLabel="KPI" />);
    expect(screen.getByText(/KPI/).textContent).toContain("KPI");
  });

  it("TC-SE-02: code と correlationId を表示する", () => {
    render(
      <AdminSectionError
        sectionLabel="Members"
        code="ADMIN_FETCH_500"
        correlationId="cf-ray-abc-123"
      />,
    );
    expect(screen.getByText("ADMIN_FETCH_500")).toBeDefined();
    expect(screen.getByText("cf-ray-abc-123")).toBeDefined();
  });

  it("TC-SE-03: role=alert / aria-live=polite が付く", () => {
    render(<AdminSectionError sectionLabel="Tags" />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("polite");
  });

  it("TC-SE-04: message 指定時はカスタム文言を表示", () => {
    render(
      <AdminSectionError sectionLabel="Schema" message="API がダウンしています" />,
    );
    expect(screen.getByText("API がダウンしています")).toBeDefined();
  });

  it("TC-SE-05: code/correlationId が未指定なら meta 行が省略される", () => {
    const { container } = render(<AdminSectionError sectionLabel="Audit" />);
    expect(container.querySelector("code")).toBeNull();
  });
});
