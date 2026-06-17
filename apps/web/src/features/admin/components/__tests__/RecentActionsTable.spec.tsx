// task-15: RecentActionsTable TC-RAT-01〜03
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";
import { RecentActionsTable } from "../_dashboard/RecentActionsTable";

afterEach(() => cleanup());

describe("RecentActionsTable", () => {
  it("TC-RAT-01: items=[] で empty メッセージ", () => {
    render(<RecentActionsTable items={[]} />);
    expect(screen.getByText("直近 7 日のアクションはありません")).toBeDefined();
  });

  it("TC-RAT-02: items 5 件でカード型リスト 5 行", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      auditId: `a${i}`,
      actorEmail: "admin@example.com",
      action: i === 0 ? "admin.member.status_updated" : "unknown.action",
      targetType: "member",
      targetId: `m${i}`,
      createdAt: "2026-05-10T00:00:00.000Z",
    }));
    render(<RecentActionsTable items={items} />);
    expect(screen.getByTestId("recent-actions-list")).toBeDefined();
    expect(screen.getAllByTestId("recent-action-item")).toHaveLength(5);
    expect(document.querySelector("table")).toBeNull();
    expect(screen.getByText("会員の公開状態を変更")).toBeDefined();
    expect(screen.getAllByText("unknown.action")).toHaveLength(4);
    expect(screen.getAllByText(/対象: 会員 m/)).toHaveLength(5);
  });

  it("TC-RAT-03: 監査ログリンク", () => {
    render(<RecentActionsTable items={[]} />);
    const link = screen.getByRole("link", { name: /監査ログを開く/ });
    expect(link.getAttribute("href")).toBe("/admin/audit");
  });

  it("a11y violations 0", async () => {
    const { container } = render(<RecentActionsTable items={[]} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
