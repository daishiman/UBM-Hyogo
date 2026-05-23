import { describe, expect, it } from "vitest";
import {
  levenshtein,
  normalizeLabelForCompare,
  recommendAliases,
} from "./aliasRecommendation";

describe("levenshtein", () => {
  it("equal strings → 0", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
  });
  it("insertion / deletion", () => {
    expect(levenshtein("abc", "abcd")).toBe(1);
    expect(levenshtein("abcd", "abc")).toBe(1);
  });
  it("substitution", () => {
    expect(levenshtein("abc", "abd")).toBe(1);
  });
  it("empty handling", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });
});

describe("recommendAliases", () => {
  const existing = [
    { stableKey: "full_name", label: "Full name", sectionKey: "profile", position: 1 },
    { stableKey: "email", label: "Email address", sectionKey: "profile", position: 2 },
    { stableKey: "phone", label: "Phone number", sectionKey: "contact", position: 3 },
  ];

  it("empty existing → []", () => {
    expect(
      recommendAliases({ label: "x", sectionKey: null, position: null }, []),
    ).toEqual([]);
  });

  it("section + position 一致が最上位", () => {
    const r = recommendAliases(
      { label: "Full name", sectionKey: "profile", position: 1 },
      existing,
    );
    expect(r[0]).toBe("full_name");
  });

  it("topN 制限", () => {
    const r = recommendAliases(
      { label: "x", sectionKey: null, position: null },
      existing,
      2,
    );
    expect(r.length).toBe(2);
  });

  it("score ベースでソート（label 距離小が優先）", () => {
    const r = recommendAliases(
      { label: "Phone number", sectionKey: null, position: null },
      existing,
    );
    expect(r[0]).toBe("phone");
  });

  it("日本語 label 完全一致を優先する", () => {
    const r = recommendAliases(
      { label: "氏名", sectionKey: null, position: null },
      [
        { stableKey: "email", label: "メールアドレス", sectionKey: "profile", position: 2 },
        { stableKey: "full_name", label: "氏名", sectionKey: "profile", position: 1 },
      ],
    );
    expect(r[0]).toBe("full_name");
  });

  it("全角英数字と半角英数字を NFKC で近く扱う", () => {
    const r = recommendAliases(
      { label: "会員ID 2026", sectionKey: null, position: null },
      [
        { stableKey: "member_id", label: "会員ＩＤ　２０２６", sectionKey: "profile", position: 1 },
        { stableKey: "postal_code", label: "郵便番号 2026", sectionKey: "profile", position: 2 },
      ],
    );
    expect(r[0]).toBe("member_id");
  });

  it("前後 trim と連続 whitespace 圧縮後の label 距離で並べる", () => {
    const r = recommendAliases(
      { label: "  参加  希望  区分  ", sectionKey: null, position: null },
      [
        { stableKey: "participation_type", label: "参加 希望 区分", sectionKey: "profile", position: 1 },
        { stableKey: "participation_note", label: "参加希望メモ", sectionKey: "profile", position: 2 },
      ],
    );
    expect(r[0]).toBe("participation_type");
  });

  it("過剰 normalization で別 label を同一視しない", () => {
    const r = recommendAliases(
      { label: "参加希望 区分", sectionKey: null, position: null },
      [
        { stableKey: "participation_type", label: "参加希望 区分", sectionKey: "profile", position: 1 },
        { stableKey: "participation_date", label: "参加希望 日付", sectionKey: "profile", position: 2 },
      ],
    );
    expect(r[0]).toBe("participation_type");
    expect(normalizeLabelForCompare("参加希望 区分")).not.toBe(
      normalizeLabelForCompare("参加希望 日付"),
    );
  });

  it("section 一致が normalize で縮まった label 距離より優先される", () => {
    const r = recommendAliases(
      { label: "メール", sectionKey: "contact", position: null },
      [
        { stableKey: "email_profile", label: "メール", sectionKey: "profile", position: 1 },
        { stableKey: "email_contact", label: "メイル", sectionKey: "contact", position: 2 },
      ],
    );
    expect(r[0]).toBe("email_contact");
  });
});

describe("normalizeLabelForCompare", () => {
  it("NFKC で全角英数字を半角へ寄せる", () => {
    expect(normalizeLabelForCompare("会員ＩＤ　２０２６")).toBe("会員ID 2026");
  });

  it("前後 whitespace を trim する", () => {
    expect(normalizeLabelForCompare("  氏名  ")).toBe("氏名");
  });

  it("連続 whitespace を単一 space に圧縮する", () => {
    expect(normalizeLabelForCompare("参加\t希望\n区分")).toBe("参加 希望 区分");
  });

  it("空文字は空文字のまま返す", () => {
    expect(normalizeLabelForCompare("")).toBe("");
  });

  it("日本語 label は意味的に変換しない", () => {
    expect(normalizeLabelForCompare("氏名")).toBe("氏名");
  });

  it("記号除去や大小文字変換は行わない", () => {
    expect(normalizeLabelForCompare("Email（任意）")).toBe("Email(任意)");
    expect(normalizeLabelForCompare("EMAIL")).not.toBe(
      normalizeLabelForCompare("email"),
    );
  });

  it("大小文字は normalize で吸収しないため Email と email は別 label", () => {
    expect(
      levenshtein(
        normalizeLabelForCompare("Email"),
        normalizeLabelForCompare("email"),
      ),
    ).toBe(1);
  });
});
