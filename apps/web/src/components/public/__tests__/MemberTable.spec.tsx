import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { MemberTable } from "../MemberTable";
import type { PublicMemberListItem } from "../MemberCard";
import { buildMember } from "../../../test-utils/fixtures/public";

afterEach(() => cleanup());

const buildEmptyOptional = (
  overrides: Partial<PublicMemberListItem> = {},
): PublicMemberListItem =>
  ({
    memberId: "mem-empty",
    fullName: "鈴木 花子",
    occupation: "エンジニア",
    location: "兵庫県神戸市",
    ...overrides,
  }) as PublicMemberListItem;

describe("MemberTable", () => {
  it("ヘッダ行 5 列と各 item の行をレンダーする", () => {
    const items = [
      buildMember({
        memberId: "m_1",
        fullName: "山田 太郎",
        nickname: "taro",
        location: "兵庫県神戸市",
        ubmZone: "Kobe",
        ubmMembershipType: "regular",
      }),
      buildEmptyOptional({ memberId: "m_2", fullName: "鈴木 花子" }),
    ];
    const { container } = render(<MemberTable items={items} />);
    expect(
      container.querySelector('[data-component="member-table"]'),
    ).toBeTruthy();
    const headers = container.querySelectorAll("thead th");
    expect(headers).toHaveLength(5);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);

    const link = screen.getByRole("link", { name: "山田 太郎" });
    expect(link.getAttribute("href")).toBe("/members/m_1");
  });

  it("nickname / zone / status が未指定の行は空文字でレンダーする (empty fields)", () => {
    const { container } = render(
      <MemberTable items={[buildEmptyOptional({ memberId: "m_x" })]} />,
    );
    const cells = container.querySelectorAll("tbody tr td");
    expect(cells[0]?.textContent).toBe("");
    expect(
      container.querySelector('[data-role="zone"]')?.textContent,
    ).toBe("");
    expect(
      container.querySelector('[data-role="status"]')?.textContent,
    ).toBe("");
  });

  it("items 空配列でも table 自体はレンダーされる (empty)", () => {
    const { container } = render(<MemberTable items={[]} />);
    expect(
      container.querySelector('[data-component="member-table"]'),
    ).toBeTruthy();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
  });
});
