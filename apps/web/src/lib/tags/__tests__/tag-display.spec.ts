import { describe, expect, it } from "vitest";

import { normalizeTagLabel, phaseTone, selectCardTags } from "../tag-display";

describe("tag-display", () => {
  it("normalizes phase tags to arrow labels by code", () => {
    expect(normalizeTagLabel({ code: "int_0to1", label: "0 to 1" })).toBe("0→1");
    expect(normalizeTagLabel({ code: "int_1to10", label: "1 to 10" })).toBe("1→10");
    expect(normalizeTagLabel({ code: "other", label: "その他" })).toBe("その他");
  });

  it("selects business-relevant tags and hides region/status categories", () => {
    const selected = selectCardTags(
      [
        { code: "region_hanshin", label: "阪神", category: "region" },
        { code: "skill_ai", label: "AI", category: "skill" },
        { code: "int_0to1", label: "0 to 1", category: "interest" },
        { code: "biz_food", label: "飲食", category: "business" },
        { code: "status_member", label: "会員", category: "status" },
      ],
      "comfy",
    );

    expect(selected).toEqual([
      { code: "int_0to1", label: "0→1", category: "interest", isPhase: true },
      { code: "biz_food", label: "飲食", category: "business", isPhase: false },
      { code: "skill_ai", label: "AI", category: "skill", isPhase: false },
    ]);
  });

  it("limits list density to the phase tag", () => {
    expect(
      selectCardTags(
        [
          { code: "skill_ai", label: "AI", category: "skill" },
          { code: "int_10to100", label: "10 to 100", category: "interest" },
        ],
        "list",
      ),
    ).toEqual([
      { code: "int_10to100", label: "10→100", category: "interest", isPhase: true },
    ]);
  });

  it("maps phase tones without creating new chip tones", () => {
    expect(phaseTone("int_0to1")).toBe("cool");
    expect(phaseTone("int_1to10")).toBe("warm");
    expect(phaseTone("int_10to100")).toBe("amber");
    expect(phaseTone("unknown")).toBe("stone");
  });
});
