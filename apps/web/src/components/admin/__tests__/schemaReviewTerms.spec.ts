import { describe, expect, it } from "vitest";
import {
  SCHEMA_REVIEW_TERMS,
  plainLabel,
  termDescription,
} from "../schemaReviewTerms";

describe("schemaReviewTerms", () => {
  it("registered terms expose plain labels by default and technical names on demand", () => {
    expect(plainLabel("stableKey")).toBe("永続的な名前");
    expect(plainLabel("questionId")).toBe("設問の元ID");
    expect(plainLabel("stableKey", { includeTechnical: true })).toBe("永続的な名前（技術名: stableKey）");
    expect(plainLabel("questionId", { includeTechnical: true })).toBe("設問の元ID（技術名: questionId）");
    expect(termDescription("alias")).toContain("対応関係");
  });

  it("unknown terms fail open without throwing", () => {
    expect(plainLabel("unknownTerm")).toBe("unknownTerm");
    expect(termDescription("unknownTerm")).toBe("");
  });

  it("keeps the required glossary keys complete", () => {
    expect(Object.keys(SCHEMA_REVIEW_TERMS).sort()).toEqual(
      [
        "added",
        "alias",
        "backfill",
        "changed",
        "questionId",
        "recompute",
        "removed",
        "resolve",
        "revision",
        "rollback",
        "stableKey",
        "unresolved",
      ].sort(),
    );
  });
});
