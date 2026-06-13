import { describe, expect, it } from "vitest";

import { generateTagCode, TAG_CODE_PATTERN } from "../tagCodeAutogen";

describe("generateTagCode", () => {
  it.each([
    ["Region Kobe", "region_kobe"],
    ["エリア 01", "eria_01"],
    ["!!!", /^tag_[a-z0-9]+$/],
    ["漢字", /^tag_[a-z0-9]+$/],
    ["a".repeat(90), "a".repeat(64)],
  ])("表示名 %s から pattern 適合 code を生成する", (label, expected) => {
    const code = generateTagCode(label);
    expect(code).toMatch(TAG_CODE_PATTERN);
    if (typeof expected === "string") {
      expect(code).toBe(expected);
    } else {
      expect(code).toMatch(expected);
    }
  });

  it("同じ表示名から決定的な fallback を返す", () => {
    expect(generateTagCode("漢字")).toBe(generateTagCode("漢字"));
  });
});
