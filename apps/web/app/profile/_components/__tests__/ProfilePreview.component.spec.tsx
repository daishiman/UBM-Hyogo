// workflow: mypage-prototype-alignment / Phase 6 新規
// 対象: ProfilePreview（ST-3 Avatar hero-split）
// 操作対象: 全 external prop。

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { ProfilePreview } from "../ProfilePreview";

afterEach(() => cleanup());

describe("ProfilePreview", () => {
  it("displayName ありのとき名前と subtitle を描画", () => {
    render(
      <ProfilePreview
        memberId="m-001"
        displayName="山田太郎"
        subtitle="デザイナー"
        chips={[{ label: "兵庫" }]}
      />,
    );
    expect(screen.getByText("山田太郎")).toBeTruthy();
    expect(screen.getByText("デザイナー")).toBeTruthy();
    expect(screen.getByText("兵庫")).toBeTruthy();
    expect(screen.getByRole("img", { name: "山田太郎" })).toBeTruthy();
  });

  it("displayName 空のとき安全に描画する（PREVIEW eyebrow が存在）", () => {
    expect(() =>
      render(<ProfilePreview memberId="m-001" displayName="" />),
    ).not.toThrow();
    expect(screen.getByText("PREVIEW")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "会員" })).toBeTruthy();
  });

  it("chips 未指定のとき chip 行が空でも描画する", () => {
    expect(() =>
      render(
        <ProfilePreview memberId="m-001" displayName="山田太郎" />,
      ),
    ).not.toThrow();
  });
});
