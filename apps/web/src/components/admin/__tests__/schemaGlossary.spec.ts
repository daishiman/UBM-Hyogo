import { describe, expect, it } from "vitest";

import {
  SCHEMA_GLOSSARY,
  describeDiffType,
  describeSchemaStat,
  describeSchemaStatus,
} from "../schemaGlossary";

describe("schemaGlossary", () => {
  it("keeps plain Japanese labels with technical names", () => {
    expect(SCHEMA_GLOSSARY).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ plainLabel: "項目キー", technicalName: "stableKey" }),
        expect.objectContaining({ plainLabel: "対応づけ", technicalName: "resolve" }),
        expect.objectContaining({ plainLabel: "フォーム版数", technicalName: "revision" }),
      ]),
    );
  });

  it("describes diff categories and stats for purpose clarity", () => {
    expect(describeDiffType("unresolved").label).toBe("未対応の設問");
    expect(describeDiffType("added").actionHint).toContain("対応づけ");
    expect(describeSchemaStat("unresolved").hint).toContain("項目キー");
    expect(describeSchemaStatus("queued")).toBe("対応づけ待ち");
    expect(describeSchemaStatus("resolved")).toBe("対応づけ済み");
  });
});
