import { describe, expect, it } from "vitest";
import {
  DASHBOARD_KPI_LABELS,
  MEMBER_STATUS_LABELS,
  describeAuditAction,
  describeTarget,
  describeTargetType,
} from "../dashboardGlossary";

describe("dashboardGlossary", () => {
  it("exposes Japanese KPI and member status labels", () => {
    expect(DASHBOARD_KPI_LABELS).toEqual({
      totalMembers: "会員総数",
      publicMembers: "サイト公開中",
      untaggedMembers: "タグ未設定",
      unresolvedSchema: "要対応のフォーム項目",
    });
    expect(MEMBER_STATUS_LABELS).toEqual({
      public: "公開",
      member_only: "会員限定",
      hidden: "非公開",
    });
  });

  it("describes known audit actions and preserves unknown codes", () => {
    expect(describeAuditAction("admin.member.status_updated")).toBe("会員の公開状態を変更");
    expect(describeAuditAction("attendance.import.add")).toBe("出席を一括取り込み");
    expect(describeAuditAction("unknown.action")).toBe("unknown.action");
  });

  it("describes target types and keeps unknown values visible", () => {
    expect(describeTargetType("member")).toBe("会員");
    expect(describeTargetType("schema")).toBe("フォーム項目");
    expect(describeTargetType("external")).toBe("external");
  });

  it("combines target type and target id without hiding missing ids", () => {
    expect(describeTarget("member", "m-1")).toBe("会員 m-1");
    expect(describeTarget("member", null)).toBe("会員");
    expect(describeTarget("external", "x-1")).toBe("external x-1");
  });
});
