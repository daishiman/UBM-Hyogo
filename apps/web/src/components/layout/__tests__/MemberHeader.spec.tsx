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
    const link = screen.getByRole("link", { name: "マイページ" });
    expect(link.getAttribute("href")).toBe("/profile");
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
});
