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

  // --- issue-1029 lane E: photoUrl → <Avatar src> 配線 ---

  const PHOTO = "https://r2/m1?s=x";

  it.each(["comfy", "dense", "list"] as const)(
    "E-1/2/3: photoUrl 有・%s で img src が photoUrl と一致",
    (density) => {
      const member = buildMember({ memberId: "mem-201", photoUrl: PHOTO });
      const { container } = render(<MemberCard member={member} density={density} />);
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(PHOTO);
    },
  );

  it("E-4: photoUrl 無で img なし（hue placeholder へ fallback）", () => {
    const member = buildMember({ memberId: "mem-202" });
    const { container } = render(<MemberCard member={member} density="comfy" />);
    expect(container.querySelector("img")).toBeNull();
  });
});
