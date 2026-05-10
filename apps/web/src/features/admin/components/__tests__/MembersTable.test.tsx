// task-15: MembersTable TC-MT-01〜05
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { asMemberId, asResponseEmail } from "@ubm-hyogo/shared";
import { MembersTable } from "../_members/MembersTable";

afterEach(() => cleanup());

type Member = AdminMemberListView["members"][number];

const mkMember = (id: string, name: string): Member => ({
  memberId: asMemberId(id),
  responseEmail: asResponseEmail(`${id}@example.com`),
  fullName: name,
  publicConsent: "consented",
  rulesConsent: "consented",
  publishState: "public",
  isDeleted: false,
  lastSubmittedAt: "2026-05-01T00:00:00.000Z",
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
