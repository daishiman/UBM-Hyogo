import { describe, expect, it } from "vitest";
import { levenshtein, recommendAliases } from "./aliasRecommendation";

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
});
