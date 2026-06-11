// admin-members-timestamp-jst-and-identity-label-clarity (T2):
// 用語集 SSOT のラベル網羅と formatBooleanJa を検証する（AC-7）。
import { describe, it, expect } from "vitest";
import {
  MEMBER_IDENTITY_FIELD_LABELS,
  MEMBER_DIAGNOSTICS_FIELD_LABELS,
  MEMBER_SYSTEM_SECTION_LABELS,
  formatBooleanJa,
} from "../memberSystemFieldGlossary";

describe("memberSystemFieldGlossary", () => {
  it("AC-3/AC-7: IDENTITY の全英語キーに日本語ラベルが定義されている", () => {
    expect(MEMBER_IDENTITY_FIELD_LABELS).toMatchObject({
      memberId: "会員ID",
      responseEmail: "回答メールアドレス",
      notificationOptOut: "通知の受け取り停止",
      isDeleted: "退会済み",
    });
  });

  it("AC-5/AC-7: DIAGNOSTICS の全英語キーに日本語ラベルが定義されている", () => {
    expect(MEMBER_DIAGNOSTICS_FIELD_LABELS).toMatchObject({
      matchedResponse: "照合できたフォーム回答",
      responseFields: "取得できた項目数",
      publicVisible: "公開ディレクトリに表示",
      h3Hidden: "同意・公開設定により非表示",
      h4MissingFields: "未入力の項目あり",
    });
  });

  it("AC-8: セクション見出しが日本語化されている", () => {
    expect(MEMBER_SYSTEM_SECTION_LABELS.identity).toBe("本人情報（システム項目）");
    expect(MEMBER_SYSTEM_SECTION_LABELS.diagnostics).toBe("診断情報");
  });

  it("AC-4/AC-6: formatBooleanJa は true→はい / false→いいえ", () => {
    expect(formatBooleanJa(true)).toBe("はい");
    expect(formatBooleanJa(false)).toBe("いいえ");
  });

  it("全ラベルが日本語（英語キーがそのまま値になっていない）", () => {
    for (const [key, label] of Object.entries(MEMBER_IDENTITY_FIELD_LABELS)) {
      expect(label).not.toBe(key);
    }
    for (const [key, label] of Object.entries(MEMBER_DIAGNOSTICS_FIELD_LABELS)) {
      expect(label).not.toBe(key);
    }
  });
});
