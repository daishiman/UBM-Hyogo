// workflow: mypage-prototype-alignment / Phase 4 RED test
// 対象: ProfileHeader（ST-1 page-head + btn-row）
// 操作対象: 全 external prop。

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));

import { ProfileHeader } from "../ProfileHeader";

afterEach(() => cleanup());

const baseProps = {
  memberId: "m-001",
  editResponseUrl: "https://edit.example",
  fallbackResponderUrl: "https://fallback.example",
} as const;

describe("ProfileHeader", () => {
  it("publishState=public のとき公開ページリンクが有効", () => {
    render(<ProfileHeader {...baseProps} publishState="public" />);
    const link = screen.getByRole("link", { name: /公開ページを見る/ });
    expect(link.getAttribute("href")).toBe("/members/m-001");
    expect(link.getAttribute("aria-disabled")).not.toBe("true");
  });

  it("publishState=member_only のとき公開ページが aria-disabled", () => {
    render(<ProfileHeader {...baseProps} publishState="member_only" />);
    const el = screen.getByText(/公開ページを見る/);
    // 親要素どこかに aria-disabled=true が付くこと（link 化されない）
    const disabled = el.closest('[aria-disabled="true"]');
    expect(disabled).not.toBeNull();
    expect(screen.queryByRole("link", { name: /公開ページを見る/ })).toBeNull();
  });

  it("publishState=hidden のとき公開ページが aria-disabled", () => {
    render(<ProfileHeader {...baseProps} publishState="hidden" />);
    const el = screen.getByText(/公開ページを見る/);
    const disabled = el.closest('[aria-disabled="true"]');
    expect(disabled).not.toBeNull();
    expect(screen.queryByRole("link", { name: /公開ページを見る/ })).toBeNull();
  });

  it("eyebrow / h1 / muted を描画する", () => {
    render(<ProfileHeader {...baseProps} publishState="public" />);
    expect(screen.getByText("MY PROFILE")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "マイページ" })).toBeTruthy();
    expect(
      screen.getByText(/公開情報と会員限定情報を確認・編集できます/),
    ).toBeTruthy();
  });

  // Phase 6: 追加 fail path
  it("hidden のとき非公開理由の title を持つ", () => {
    render(<ProfileHeader {...baseProps} publishState="hidden" />);
    const el = screen.getByText(/公開ページを見る/);
    const disabled = el.closest('[aria-disabled="true"]');
    expect(disabled?.getAttribute("title")).toContain("非公開");
  });
});
