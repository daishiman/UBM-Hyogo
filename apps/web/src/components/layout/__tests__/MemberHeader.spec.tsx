import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(async () => undefined),
}));

import { MemberHeader } from "../MemberHeader";

afterEach(() => cleanup());

describe("MemberHeader", () => {
  it("マイページリンクとログアウトボタンをレンダーする", () => {
    render(<MemberHeader />);
    const header = screen.getByTestId("member-header");
    expect(header).toBeTruthy();
    expect(header.getAttribute("data-auth-state")).toBe("member");
    const link = screen.getByRole("link", { name: "マイページ" });
    expect(link.getAttribute("href")).toBe("/profile");
    expect(link.getAttribute("data-role")).toBe("member-cta");
    expect(screen.getByTestId("sign-out-button")).toBeTruthy();
  });

  // workflow: mypage-prototype-alignment / Phase 4 RED 追加
  it("公開ページ（一覧）への nav リンクを描画する", () => {
    render(<MemberHeader />);
    const link = screen.getByRole("link", { name: "公開ページ" });
    expect(link.getAttribute("href")).toBe("/members");
  });

  it("マイページリンクは /profile を維持する（回帰固定）", () => {
    render(<MemberHeader />);
    const link = screen.getByRole("link", { name: "マイページ" });
    expect(link.getAttribute("href")).toBe("/profile");
  });

  it("admin auth view のときだけ管理リンクを描画する", () => {
    const { container } = render(
      <MemberHeader authView={{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }} />,
    );
    expect(screen.getByTestId("member-header").getAttribute("data-auth-state")).toBe("admin");
    expect(container.querySelector('[data-role="admin-cta"]')?.getAttribute("href")).toBe("/admin");
  });

  it("member auth view では管理リンクを描画しない", () => {
    const { container } = render(<MemberHeader authView={{ kind: "member", profileHref: "/profile" }} />);
    expect(screen.getByTestId("member-header").getAttribute("data-auth-state")).toBe("member");
    expect(container.querySelector('[data-role="admin-cta"]')).toBeNull();
  });
});
