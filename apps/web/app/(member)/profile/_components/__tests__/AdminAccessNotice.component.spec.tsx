import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { AdminAccessNotice } from "../AdminAccessNotice";

afterEach(cleanup);

describe("AdminAccessNotice", () => {
  it("管理者向け案内を既存 primitive で描画する", () => {
    render(<AdminAccessNotice />);

    const card = screen.getByTestId("profile-admin-access-notice");
    expect(card.getAttribute("data-component")).toBe("section-card");
    expect(card.getAttribute("data-tone")).toBe("accent");
    expect(card.getAttribute("aria-label")).toBe("管理者向けのご案内");
    expect(screen.getByText("管理者メニュー")).toBeTruthy();
    expect(screen.getByTestId("profile-admin-access-notice").textContent).toContain(
      "管理者アカウントでログインしています。",
    );
  });

  it("管理画面へのリンクを描画する", () => {
    render(<AdminAccessNotice />);

    const link = screen.getByRole("link", { name: "管理画面を開く" });
    expect(link.getAttribute("href")).toBe("/admin");
    expect(link.getAttribute("data-variant")).toBe("secondary");
  });

  it("member data を受け取らず、画面にも露出しない", () => {
    const { container } = render(<AdminAccessNotice />);

    expect(container.textContent).not.toContain("m_1");
    expect(container.textContent).not.toContain("member@example.com");
  });
});
