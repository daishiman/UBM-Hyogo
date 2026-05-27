// followup-001 T-5.3: プロトタイプ準拠の列構成テスト
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { asMemberId, asResponseEmail } from "@ubm-hyogo/shared";
import { MembersTable } from "../_members/MembersTable";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => cleanup());

type Member = AdminMemberListView["members"][number];

const mkMember = (id: string, name: string, overrides: Partial<Member> = {}): Member => ({
  memberId: asMemberId(id),
  responseEmail: asResponseEmail(`${id}@example.com`),
  fullName: name,
  publicConsent: "consented",
  rulesConsent: "consented",
  publishState: "public",
  isDeleted: false,
  lastSubmittedAt: "2026-05-01T00:00:00.000Z",
  ...overrides,
});

describe("MembersTable (followup-001)", () => {
  it("empty 表示", () => {
    render(
      <MembersTable
        items={[]}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={0}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("該当する会員はいません")).toBeDefined();
  });

  it("プロトタイプ列が描画される (メンバー / メール / 区画 / タグ / 最終更新 / 公開)", () => {
    const items = [mkMember("a", "山田 太郎")];
    render(
      <MembersTable
        items={items}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={1}
        onPageChange={() => {}}
      />,
    );
    const headers = Array.from(document.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).toContain("メンバー");
    expect(headers).toContain("メール");
    expect(headers).toContain("区画 / ステータス");
    expect(headers).toContain("タグ");
    expect(headers).toContain("最終更新");
    expect(headers).toContain("公開");
  });

  it("avatar (role=img) と occupation を表示する", () => {
    const items = [mkMember("a", "山田")];
    const summariesByMember = new Map([["a", { occupation: "経営者", ubmZone: "0_to_1" }]]);
    render(
      <MembersTable
        items={items}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        summariesByMember={summariesByMember}
        page={1}
        pageSize={50}
        total={1}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByRole("img", { name: "山田" })).toBeDefined();
    expect(screen.getByText("経営者")).toBeDefined();
  });

  it("API list item の additive fields を直接表示する", () => {
    const items = [
      mkMember("a", "山田", {
        occupation: "設計者",
        ubmZone: "1_to_10",
        ubmMembershipType: "member",
        tags: [
          { code: "t1", label: "kobe" },
          { code: "t2", label: "founder" },
        ],
        updatedAt: "2026-05-20T00:00:00.000Z",
      }),
    ];
    render(
      <MembersTable
        items={items}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={1}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("設計者")).toBeDefined();
    expect(screen.getByText("1_to_10")).toBeDefined();
    expect(screen.getByText("member")).toBeDefined();
    expect(screen.getByText("kobe")).toBeDefined();
    expect(screen.getByText("founder")).toBeDefined();
    expect(screen.getByText("2026-05-20T00:00:00.000Z")).toBeDefined();
  });

  it("tags max 2 + `+N` を表示する", () => {
    const items = [mkMember("a", "山田")];
    const tagsByMember = new Map([
      [
        "a",
        [
          { code: "t1", label: "kobe" },
          { code: "t2", label: "founder" },
          { code: "t3", label: "tech" },
          { code: "t4", label: "design" },
        ],
      ],
    ]);
    render(
      <MembersTable
        items={items}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        tagsByMember={tagsByMember}
        page={1}
        pageSize={50}
        total={1}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("kobe")).toBeDefined();
    expect(screen.getByText("founder")).toBeDefined();
    expect(screen.queryByText("tech")).toBeNull();
    expect(screen.getByText("+2")).toBeDefined();
  });

  it("isDeleted=true で 退会 Chip を表示し switch は描画しない", () => {
    const items = [mkMember("a", "退会 花子", { isDeleted: true })];
    render(
      <MembersTable
        items={items}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={1}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("退会")).toBeDefined();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("onTogglePublish が switch toggle で発火する", () => {
    const onTogglePublish = vi.fn();
    const items = [mkMember("a", "山田", { publishState: "public" })];
    render(
      <MembersTable
        items={items}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        onTogglePublish={onTogglePublish}
        page={1}
        pageSize={50}
        total={1}
        onPageChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("switch"));
    expect(onTogglePublish).toHaveBeenCalledWith("a", false);
  });

  it("edit icon button で onOpenRow が呼ばれる", () => {
    const onOpenRow = vi.fn();
    render(
      <MembersTable
        items={[mkMember("a", "山田")]}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={onOpenRow}
        page={1}
        pageSize={50}
        total={1}
        onPageChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "山田 を編集" }));
    expect(onOpenRow).toHaveBeenCalledWith("a");
  });

  it("checkbox toggle", () => {
    const onToggleSelect = vi.fn();
    render(
      <MembersTable
        items={[mkMember("a", "山田")]}
        selected={new Set()}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={1}
        onPageChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByLabelText("山田 を選択"));
    expect(onToggleSelect).toHaveBeenCalledWith("a");
  });

  it("a11y violations 0", async () => {
    const { container } = render(
      <MembersTable
        items={[mkMember("a", "山田")]}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={1}
        onPageChange={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
