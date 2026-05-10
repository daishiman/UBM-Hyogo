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

  it("TC-RAT-02: items 5 件で tbody 5 行", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      auditId: `a${i}`,
      actorEmail: "admin@example.com",
      action: "member.update",
      targetType: "member",
      targetId: `m${i}`,
      createdAt: "2026-05-10T00:00:00.000Z",
    }));
    render(<RecentActionsTable items={items} />);
    expect(document.querySelectorAll("tbody tr").length).toBe(5);
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
