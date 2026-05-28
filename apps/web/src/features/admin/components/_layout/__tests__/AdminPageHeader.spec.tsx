import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminPageHeader } from "../AdminPageHeader";

describe("AdminPageHeader", () => {
  it("renders optional eyebrow and heading id without changing existing props", () => {
    render(
      <AdminPageHeader
        eyebrow="ADMIN / TEST"
        title="テスト見出し"
        description="説明"
        headingId="admin-test-heading"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "テスト" }]}
      />,
    );

    expect(screen.getByText("ADMIN / TEST")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "テスト見出し" }).id).toBe(
      "admin-test-heading",
    );
    expect(screen.getByText("説明")).toBeTruthy();
    expect(screen.getByText("管理")).toBeTruthy();
  });
});
