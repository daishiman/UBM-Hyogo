import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Breadcrumb } from "../Breadcrumb";

afterEach(() => cleanup());

describe("Breadcrumb", () => {
  it("items が空なら何も描画しない", () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("breadcrumb nav と最後の current item を描画する", () => {
    render(
      <Breadcrumb
        items={[
          { label: "管理", href: "/admin" },
          { label: "会員管理" },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "breadcrumb" }).getAttribute("data-component")).toBe(
      "breadcrumb",
    );
    expect(screen.getByRole("link", { name: "管理" }).getAttribute("href")).toBe("/admin");
    expect(screen.getByText("会員管理").getAttribute("aria-current")).toBe("page");
  });

  it("href 付きでも最後の item は current span として描画する", () => {
    render(<Breadcrumb items={[{ label: "管理", href: "/admin" }]} />);

    expect(screen.getByText("管理").getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("link", { name: "管理" })).toBeNull();
  });
});
