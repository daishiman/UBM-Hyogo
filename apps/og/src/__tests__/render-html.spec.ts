import { describe, expect, it } from "vitest";

import { buildHtml, escapeHtml, tagLine } from "../render";
import { OG_BRAND, titleFontSize } from "../og-tokens";

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`a & b < c > d " e`)).toBe(
      "a &amp; b &lt; c &gt; d &quot; e",
    );
  });

  it("returns plain text unchanged", () => {
    expect(escapeHtml("山田 太郎")).toBe("山田 太郎");
  });
});

describe("tagLine", () => {
  it("joins present fields with separators", () => {
    expect(
      tagLine({
        id: "m-1",
        fullName: "山田 太郎",
        occupation: "Engineer",
        ubmZone: "1_to_10",
        ubmMembershipType: "regular",
      }),
    ).toBe("Engineer / 1_to_10 / regular");
  });

  it("trims whitespace and drops blank fields", () => {
    expect(
      tagLine({
        id: "m-2",
        fullName: "佐藤 花子",
        occupation: "  Designer  ",
        ubmZone: "   ",
      }),
    ).toBe("Designer");
  });

  it("falls back to a default label when no fields are present", () => {
    expect(tagLine({ id: "m-3", fullName: "無名" })).toBe("UBM Hyogo member");
  });
});

describe("buildHtml", () => {
  it("embeds escaped title and subtitle and fixed OG dimensions", () => {
    const html = buildHtml("<Title> & co", `"Sub"`);
    expect(html).toContain("width:1200px;height:630px");
    expect(html).toContain("&lt;Title&gt; &amp; co");
    expect(html).toContain("&quot;Sub&quot;");
    expect(html).toContain("Member Directory");
    expect(html).not.toContain("<Title>");
  });

  it("uses token-aligned colors and does not keep the old blue palette", () => {
    const html = buildHtml("山田 太郎", "Engineer / 1_to_10 / regular");

    for (const value of Object.values(OG_BRAND)) {
      expect(html).toContain(value);
    }
    expect(html).not.toContain("#0068a9");
    expect(html).not.toContain("#172033");
    expect(html).not.toContain("#f8fafc");
    expect(html).not.toContain("#c9d6e2");
  });

  it("keeps member and default layouts legible with adaptive title sizing", () => {
    expect(buildHtml("UBM 兵庫支部会", "メンバーディレクトリと活動紹介")).toContain(
      `font-size:${titleFontSize("UBM 兵庫支部会")}px`,
    );
    expect(buildHtml("非常に長い氏名を持つメンバー表示テスト", "UBM Hyogo member")).toContain(
      `font-size:${titleFontSize("非常に長い氏名を持つメンバー表示テスト")}px`,
    );
  });
});
