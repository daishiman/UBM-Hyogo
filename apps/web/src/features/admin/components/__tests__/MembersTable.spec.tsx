// task-15: MembersTable TC-MT-01〜05
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
  pendingRequestTypes: [],
  ...overrides,
});

describe("MembersTable", () => {
  it("TC-MT-01: items=[] で empty 表示", () => {
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

  it("TC-MT-02: 3 行描画", () => {
    const items = [mkMember("a", "山田"), mkMember("b", "鈴木"), mkMember("c", "佐藤")];
    render(
      <MembersTable
        items={items}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={3}
        onPageChange={() => {}}
      />,
    );
    const rows = document.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
  });

  it("TC-MT-03: checkbox toggle", () => {
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

  it("TC-MT-04: 氏名 button click", () => {
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
    fireEvent.click(screen.getByRole("button", { name: "山田" }));
    expect(onOpenRow).toHaveBeenCalledWith("a");
  });

  it("TC-MT-05: pagination 「次へ」", () => {
    const onPageChange = vi.fn();
    render(
      <MembersTable
        items={[mkMember("a", "山田")]}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={120}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("pendingRequestTypes がある行に申請中バッジリンクを描画する", () => {
    render(
      <MembersTable
        items={[
          mkMember("a", "山田", {
            pendingRequestTypes: ["visibility_request", "delete_request"],
          }),
        ]}
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

    expect(screen.getByRole("link", { name: "公開申請中（会員からの申請へ）" }).getAttribute("href")).toBe(
      "/admin/requests?type=visibility_request",
    );
    expect(screen.getByRole("link", { name: "退会申請中（会員からの申請へ）" }).getAttribute("href")).toBe(
      "/admin/requests?type=delete_request",
    );
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

  it("TC-MT-06: occupation を氏名下に描画する", () => {
    render(
      <MembersTable
        items={[mkMember("a", "山田", { occupation: "会社員" })]}
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
    expect(screen.getByRole("button", { name: "山田" })).toBeDefined();
    expect(screen.getByText("会社員")).toBeDefined();
  });

  it("TC-MT-07: occupation 未指定時は occupation text を描画しない", () => {
    render(
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
    expect(screen.queryByText("会社員")).toBeNull();
    expect(screen.queryByText("undefined")).toBeNull();
  });

  it("TC-MT-08: zone chip を text + data-tone + dot 付きで描画する", () => {
    const { container } = render(
      <MembersTable
        items={[
          mkMember("a", "山田", {
            ubmZone: "0_to_1",
          }),
        ]}
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
    expect(screen.getByText("区画 / ステータス")).toBeDefined();
    const zoneChip = container.querySelector('.ui-chip[data-tone="cool"][data-dot="true"]');
    expect(zoneChip?.textContent).toContain("0_to_1");
  });

  it("TC-MT-09: type chip を data-tone 付きで描画する", () => {
    const { container } = render(
      <MembersTable
        items={[
          mkMember("a", "山田", {
            ubmMembershipType: "member",
          }),
        ]}
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
    const typeChip = container.querySelector('.ui-chip[data-tone="green"]');
    expect(typeChip?.textContent).toContain("member");
    expect(typeChip?.getAttribute("data-dot")).toBeNull();
  });

  it("TC-MT-10: tags 2件以内を描画し +N を描画しない", () => {
    render(
      <MembersTable
        items={[
          mkMember("a", "山田", {
            tags: [
              { code: "sales", label: "営業" },
              { code: "engineering", label: "技術" },
            ],
          }),
        ]}
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
    expect(screen.getByText("営業")).toBeDefined();
    expect(screen.getByText("技術")).toBeDefined();
    expect(screen.queryByText(/^\+\d+$/)).toBeNull();
  });

  it("TC-MT-11: tags 3件以上で先頭2件と +N を描画する", () => {
    render(
      <MembersTable
        items={[
          mkMember("a", "山田", {
            tags: [
              { code: "sales", label: "営業" },
              { code: "engineering", label: "技術" },
              { code: "pr", label: "広報" },
            ],
          }),
        ]}
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
    expect(screen.getByText("営業")).toBeDefined();
    expect(screen.getByText("技術")).toBeDefined();
    expect(screen.queryByText("広報")).toBeNull();
    expect(screen.getByText("+1")).toBeDefined();
  });

  it("TC-MT-12: tags 空/undefined で未タグ warn chip を描画し placeholder を消す", () => {
    const { container } = render(
      <MembersTable
        items={[mkMember("a", "山田", { tags: [] }), mkMember("b", "鈴木")]}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={2}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getAllByText("未タグ")).toHaveLength(2);
    const untaggedChips = container.querySelectorAll(
      '.ui-chip[data-tone="warning"][data-dot="true"]',
    );
    expect(untaggedChips).toHaveLength(2);
    expect(screen.queryByText("—")).toBeNull();
  });

  it("TC-MT-13: enrichment 行でも a11y violations 0", async () => {
    const { container } = render(
      <MembersTable
        items={[
          mkMember("a", "山田", {
            occupation: "会社員",
            ubmZone: "0_to_1",
            ubmMembershipType: "member",
            tags: [
              { code: "sales", label: "営業" },
              { code: "engineering", label: "技術" },
              { code: "pr", label: "広報" },
            ],
          }),
        ]}
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

  it("TC-MT-14: zone のみ存在し membershipType 欠如でも zone chip と state chip を描画する", () => {
    const { container } = render(
      <MembersTable
        items={[mkMember("a", "山田", { ubmZone: "1_to_10" })]}
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
    const zoneChip = container.querySelector('.ui-chip[data-tone="warm"][data-dot="true"]');
    expect(zoneChip?.textContent).toContain("1_to_10");
    expect(screen.queryByText("academy")).toBeNull();
    expect(screen.getByTestId("member-state-chip-row")).toBeDefined();
  });

  it("TC-MT-15: membershipType のみ存在し zone 欠如でも type chip を描画する", () => {
    const { container } = render(
      <MembersTable
        items={[mkMember("a", "山田", { ubmMembershipType: "academy" })]}
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
    const typeChip = container.querySelector('.ui-chip[data-tone="cool"]');
    expect(typeChip?.textContent).toContain("academy");
    expect(screen.queryByText("0_to_1")).toBeNull();
    expect(screen.queryByText("1_to_10")).toBeNull();
    expect(screen.queryByText("10_to_100")).toBeNull();
  });

  it("TC-MT-16: tags ちょうど2件では +N を描画しない", () => {
    render(
      <MembersTable
        items={[
          mkMember("a", "山田", {
            tags: [
              { code: "sales", label: "営業" },
              { code: "engineering", label: "技術" },
            ],
          }),
        ]}
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
    expect(screen.getByText("営業")).toBeDefined();
    expect(screen.getByText("技術")).toBeDefined();
    expect(screen.queryByText(/^\+\d+$/)).toBeNull();
  });

  it("TC-MT-17: tags ちょうど3件では +1 と全タグ title を描画する", () => {
    render(
      <MembersTable
        items={[
          mkMember("a", "山田", {
            tags: [
              { code: "sales", label: "営業" },
              { code: "engineering", label: "技術" },
              { code: "pr", label: "広報" },
            ],
          }),
        ]}
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
    expect(screen.getByText("営業")).toBeDefined();
    expect(screen.getByText("技術")).toBeDefined();
    expect(screen.queryByText("広報")).toBeNull();
    expect(screen.getByText("+1").parentElement?.getAttribute("title")).toBe(
      "営業 / 技術 / 広報",
    );
  });

  it("TC-MT-18: occupation 空文字と undefined は描画しない", () => {
    render(
      <MembersTable
        items={[
          mkMember("a", "山田", { occupation: "" }),
          mkMember("b", "鈴木"),
        ]}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={2}
        onPageChange={() => {}}
      />,
    );
    expect(screen.queryByText("会社員")).toBeNull();
    expect(screen.queryByText("undefined")).toBeNull();
  });

  it("TC-MT-19: publishState 各値と zone chip が共存する", () => {
    const { container } = render(
      <MembersTable
        items={[
          mkMember("a", "山田", { publishState: "public", ubmZone: "0_to_1" }),
          mkMember("b", "鈴木", { publishState: "member_only", ubmZone: "10_to_100" }),
          mkMember("c", "佐藤", { publishState: "hidden", ubmZone: "1_to_10" }),
        ]}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={3}
        onPageChange={() => {}}
      />,
    );
    const stateRows = screen.getAllByTestId("member-state-chip-row");
    expect(stateRows).toHaveLength(3);
    expect(stateRows[0]?.textContent).toContain("公開");
    expect(stateRows[1]?.textContent).toContain("会員限定");
    expect(stateRows[2]?.textContent).toContain("非公開");
    expect(container.querySelector('.ui-chip[data-tone="cool"][data-dot="true"]')?.textContent).toContain(
      "0_to_1",
    );
    expect(container.querySelector('.ui-chip[data-tone="amber"][data-dot="true"]')?.textContent).toContain(
      "10_to_100",
    );
    expect(container.querySelector('.ui-chip[data-tone="warm"][data-dot="true"]')?.textContent).toContain(
      "1_to_10",
    );
  });

  it("TC-MT-20: enrichment と部分欠損の混在行でも a11y violations 0", async () => {
    const { container } = render(
      <MembersTable
        items={[
          mkMember("a", "山田", {
            occupation: "会社員",
            ubmZone: "0_to_1",
            ubmMembershipType: "member",
            tags: [
              { code: "sales", label: "営業" },
              { code: "engineering", label: "技術" },
              { code: "pr", label: "広報" },
            ],
          }),
          mkMember("b", "鈴木", { tags: [] }),
          mkMember("c", "佐藤", { ubmZone: "1_to_10" }),
        ]}
        selected={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        onOpenRow={() => {}}
        page={1}
        pageSize={50}
        total={3}
        onPageChange={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
