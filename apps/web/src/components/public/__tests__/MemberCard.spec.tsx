import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { buildMember } from "../../../test-utils/fixtures/public";
import { MemberCard } from "../MemberCard";

afterEach(() => cleanup());

describe("MemberCard", () => {
  it("renders the prototype alignment hooks for comfy cards", () => {
    const member = buildMember({
      memberId: "mem-101",
      fullName: "佐藤 花子",
      nickname: "hanako",
      occupation: "デザイナー",
      location: "兵庫県姫路市",
      ubmZone: "1_to_10",
      ubmMembershipType: "member",
    });

    const { container } = render(<MemberCard member={member} density="comfy" />);

    const card = container.querySelector('[data-component="member-card"]');
    expect(card?.getAttribute("data-density")).toBe("comfy");
    expect(screen.getByRole("link", { name: "佐藤 花子 の詳細" })).toBeTruthy();
    expect(container.querySelector('[data-role="head"]')).toBeTruthy();
    expect(container.querySelector('[data-role="identity"]')).toBeTruthy();
    expect(container.querySelector('[data-role="meta"]')).toBeTruthy();
    expect(screen.getByText("@hanako")).toBeTruthy();
    expect(screen.getByText("デザイナー")).toBeTruthy();
  });

  it("renders list density as a compact row while preserving detail navigation", () => {
    const member = buildMember({
      memberId: "mem-102",
      fullName: "田中 次郎",
      occupation: "エンジニア",
    });

    const { container } = render(<MemberCard member={member} density="list" />);

    const card = container.querySelector('[data-component="member-card"]');
    expect(card?.getAttribute("data-density")).toBe("list");
    expect(screen.getByRole("link", { name: "田中 次郎 の詳細" })).toBeTruthy();
    expect(screen.getByText("エンジニア")).toBeTruthy();
    expect(container.querySelector('[data-role="chip-row"]')).toBeTruthy();
  });
});
