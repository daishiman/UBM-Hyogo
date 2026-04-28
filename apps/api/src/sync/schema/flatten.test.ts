// @vitest-environment node
import { describe, it, expect } from "vitest";
import { flatten, countSections } from "./flatten";
import { FORMS_GET_31_ITEMS } from "../../../tests/fixtures/forms-get";

describe("flatten / countSections", () => {
  it("AC-1: 31 項目・6 セクションを正しく抽出する", () => {
    const flat = flatten(FORMS_GET_31_ITEMS.items);
    expect(flat).toHaveLength(31);
    expect(countSections(FORMS_GET_31_ITEMS.items)).toBe(6);
  });

  it("position は 0 始まりの連番になる", () => {
    const flat = flatten(FORMS_GET_31_ITEMS.items);
    expect(flat.map((q) => q.position)).toEqual(
      Array.from({ length: 31 }, (_, i) => i),
    );
  });

  it("sectionIndex は sectionHeader 出現で +1 される（最初は 0）", () => {
    const flat = flatten(FORMS_GET_31_ITEMS.items);
    // 6 sectionHeader があるので最大 sectionIndex は 5
    expect(flat[0]?.sectionIndex).toBe(0);
    expect(flat[flat.length - 1]?.sectionIndex).toBe(5);
    const unique = new Set(flat.map((q) => q.sectionIndex));
    expect(unique.size).toBe(6);
  });

  it("undefined items 入力は空配列を返す", () => {
    expect(flatten(undefined)).toEqual([]);
    expect(countSections(undefined)).toBe(0);
  });

  it("questionItem を持たない pageBreak は skip される", () => {
    const items = [
      { sectionHeaderItem: { title: "S1" }, title: "S1" },
      { pageBreakItem: { title: "P" }, title: "P" },
      {
        itemId: "i1",
        title: "Q1",
        questionItem: { question: { questionId: "qq1" } },
      },
    ];
    const flat = flatten(items);
    expect(flat).toHaveLength(1);
    expect(flat[0]?.questionId).toBe("qq1");
  });
});
