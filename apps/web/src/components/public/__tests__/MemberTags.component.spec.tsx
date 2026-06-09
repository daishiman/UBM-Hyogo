import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { MemberTags } from "../MemberTags";

afterEach(() => cleanup());

describe("MemberTags", () => {
  it("renders empty-state 'タグ未設定' when tags is empty (TC-U-08, AC-3)", () => {
    // proto 準拠化（public-member-detail-survey-fields-richness AC-3）で、
    // タグ未設定でもセクションを描画し空状態テキストを表示する挙動へ変更。
    const { container } = render(<MemberTags tags={[]} />);
    expect(container.querySelector('[data-component="member-tags"]')).not.toBeNull();
    expect(container.querySelector('[data-role="empty-tags"]')?.textContent).toBe(
      "タグ未設定",
    );
    expect(container.querySelectorAll("li").length).toBe(0);
  });

  it("renders one badge per tag", () => {
    const { container } = render(
      <MemberTags
        tags={[
          { code: "x", label: "X", category: "interest" },
          { code: "y", label: "Y", category: "interest" },
        ]}
      />,
    );
    expect(container.querySelectorAll("li").length).toBe(2);
    expect(container.textContent).toContain("X");
    expect(container.textContent).toContain("Y");
  });
});
