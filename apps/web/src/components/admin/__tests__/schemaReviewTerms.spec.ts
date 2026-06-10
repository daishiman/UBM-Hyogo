import { describe, expect, it } from "vitest";
import {
  SCHEMA_REVIEW_TERMS,
  plainLabel,
  termDescription,
} from "../schemaReviewTerms";

describe("schemaReviewTerms", () => {
  it("registered terms expose plain labels with technical names", () => {
    expect(plainLabel("stableKey")).toBe("永続的な名前（技術名: stableKey）");
    expect(plainLabel("questionId")).toBe("設問の元ID（技術名: questionId）");
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
