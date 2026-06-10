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

  it("renders curated tags and business summary without region tags on comfy cards", () => {
    const member = buildMember({
      businessSummary: "地域の小さな店舗向けに在庫管理サービスを作っています。",
      tags: [
        { code: "region_hanshin", label: "阪神", category: "region" },
        { code: "int_0to1", label: "0 to 1", category: "interest" },
        { code: "biz_retail", label: "小売", category: "business" },
        { code: "skill_saas", label: "SaaS", category: "skill" },
      ],
    });

    const { container } = render(<MemberCard member={member} density="comfy" />);

    expect(screen.getByText("地域の小さな店舗向けに在庫管理サービスを作っています。")).toBeTruthy();
    expect(screen.getByText("0→1")).toBeTruthy();
    expect(screen.getByText("小売")).toBeTruthy();
    expect(screen.queryByText("阪神")).toBeNull();
    expect(container.querySelector('[data-role="tag-chip"][data-phase="true"]')).toBeTruthy();
  });

  it("keeps list cards compact by showing only the phase tag and no business summary", () => {
    const member = buildMember({
      businessSummary: "一覧では出さない説明文",
      tags: [
        { code: "int_10to100", label: "10 to 100", category: "interest" },
        { code: "skill_ai", label: "AI", category: "skill" },
      ],
    });

    render(<MemberCard member={member} density="list" />);

    expect(screen.getByText("10→100")).toBeTruthy();
    expect(screen.queryByText("AI")).toBeNull();
    expect(screen.queryByText("一覧では出さない説明文")).toBeNull();
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
