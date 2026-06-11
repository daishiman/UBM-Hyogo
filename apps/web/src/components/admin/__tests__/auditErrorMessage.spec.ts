import { describe, expect, it } from "vitest";
import { toAuditErrorView } from "../auditErrorMessage";

describe("toAuditErrorView", () => {
  it("adds a concrete recovery hint for 404 errors", () => {
    expect(toAuditErrorView("admin api failed: 404")).toEqual({
      title: "監査ログを読み込めませんでした（404）",
      hint: "API endpoint への疎通、staging deploy 状態、admin 認可を確認してください。",
    });
  });

  it("normalizes auth failures and keeps generic errors actionable", () => {
    expect(toAuditErrorView("403").title).toContain("認可エラー");
    expect(toAuditErrorView("status 500").hint).toContain("絞り込み条件");
  });

  it("adds actionable hints for date range and cursor errors", () => {
    expect(toAuditErrorView("from must be before to").hint).toContain("from は to より前");
    expect(toAuditErrorView("invalid cursor").hint).toContain("最初のページ");
  });
});
