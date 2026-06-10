import { describe, expect, it } from "vitest";
import {
  countTagDefinitions,
  filterTagDefinitions,
  normalizeTagDefinitionList,
} from "../tagDefinitionView";

const rows = [
  { tagId: "tag_1", code: "mentor", label: "メンター", category: "role", active: true },
  { tagId: "tag_2", code: "old", label: "旧タグ", category: "legacy", active: false },
];

describe("normalizeTagDefinitionList", () => {
  it("items 欠落や非配列を空一覧へ倒し reduce crash を防ぐ", () => {
    expect(normalizeTagDefinitionList(undefined)).toEqual({ total: 0, items: [] });
    expect(normalizeTagDefinitionList({})).toEqual({ total: 0, items: [] });
    expect(normalizeTagDefinitionList({ items: null, total: 10 })).toEqual({
      total: 10,
      items: [],
    });
  });

  it("active 欠落は既存 tag master 互換で true に補完する", () => {
    expect(
      normalizeTagDefinitionList({
        items: [{ tagId: "tag_1", code: "mentor", label: "メンター", category: "role" }],
      }),
    ).toEqual({
      total: 1,
      items: [{ tagId: "tag_1", code: "mentor", label: "メンター", category: "role", active: true }],
    });
  });
});

describe("filterTagDefinitions / countTagDefinitions", () => {
  it("既定で停止中を隠し、トグル時だけ表示する", () => {
    expect(filterTagDefinitions(rows, "", false).map((tag) => tag.code)).toEqual(["mentor"]);
    expect(filterTagDefinitions(rows, "", true).map((tag) => tag.code)).toEqual([
      "mentor",
      "old",
    ]);
  });

  it("code / label / category 検索と件数を返す", () => {
    expect(filterTagDefinitions(rows, "LEG", true).map((tag) => tag.code)).toEqual(["old"]);
    expect(countTagDefinitions(rows)).toEqual({ active: 1, inactive: 1, total: 2 });
  });
});
